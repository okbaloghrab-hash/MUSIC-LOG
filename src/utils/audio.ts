/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Resolve LameJS Mp3Encoder constructor in browser environment completely bypassing strict-mode bundler rewriting
export function createMp3EncoderInstance(channels: number, sampleRate: number, bitrate: number): any {
  // First, check safe non-strict browser globals
  const globalLame = (window as any).lamejs || (window as any).Lame || (window as any).LAME;
  if (globalLame) {
    if (globalLame.Mp3Encoder) {
      return new globalLame.Mp3Encoder(channels, sampleRate, bitrate);
    }
    if (typeof globalLame === "function") {
      const con = (globalLame as any).Mp3Encoder;
      if (con) return new con(channels, sampleRate, bitrate);
    }
  }
  
  // Try backup standard names
  const Mp3EncoderCon = (window as any).Mp3Encoder || (typeof globalThis !== "undefined" && (globalThis as any).Mp3Encoder);
  if (Mp3EncoderCon) {
    return new Mp3EncoderCon(channels, sampleRate, bitrate);
  }

  throw new Error(
    "LameJS Mp3Encoder constructor not found.\n" +
    "Mohamed, please wait for connection to load encoder script, or check web link."
  );
}

// Custom Reverb Impulse Generator with static cache map to boost performance and response speed
const reverbCache = new Map<string, AudioBuffer>();

export function createReverbImpulseResponse(context: BaseAudioContext, duration: number, decay: number): AudioBuffer {
  const sampleRate = context.sampleRate;
  const cacheKey = `${sampleRate}_${duration}_${decay}`;
  
  if (reverbCache.has(cacheKey)) {
    return reverbCache.get(cacheKey)!;
  }

  const length = sampleRate * duration;
  const impulse = context.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const percent = i / length;
    // Exponential decay of white noise
    const decayFactor = Math.exp(-percent * decay);
    
    // Add multiple delay points to simulate initial reflections
    const noise = Math.random() * 2 - 1;
    left[i] = noise * decayFactor;
    
    const noiseRight = Math.random() * 2 - 1;
    right[i] = noiseRight * decayFactor;
  }
  
  reverbCache.set(cacheKey, impulse);
  return impulse;
}

// Convert AudioBuffer to 16-bit Stereo PCM WAV Blob with optional ID3 metadata
export function audioBufferToWavBlob(buffer: AudioBuffer, id3Data?: Uint8Array): Blob {
  const numOfChan = buffer.numberOfChannels;
  const pcmLength = buffer.length * numOfChan * 2;
  
  const id3HeaderSize = id3Data ? 8 : 0;
  const id3PayloadSize = id3Data ? id3Data.length : 0;
  const id3PaddingSize = (id3PayloadSize % 2 !== 0) ? 1 : 0;
  
  // Total length of the WAV file
  const length = 44 + pcmLength + id3HeaderSize + id3PayloadSize + id3PaddingSize;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  // Helpers to write standard Wav file headers
  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // FMT sub-chunk
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // chunk size = 16
  setUint16(1);          // PCM format = 1 (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate (sampleRate * blockAlign)
  setUint16(numOfChan * 2);                    // block align (channels * bytesPerSample)
  setUint16(16);                               // bits per sample

  // DATA sub-chunk
  setUint32(0x61746164); // "data" chunk
  setUint32(pcmLength);  // chunk length (EXCLUDE extra chunks from the size of the data chunk!)

  // Write channel data
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < 44 + pcmLength) {
    for (let c = 0; c < numOfChan; c++) {
      sample = Math.max(-1, Math.min(1, channels[c][offset]));
      // Expand float to 16-bit linear PCM INT
      sample = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  // Write standard ID3 sub-chunk if original metadata was extracted
  if (id3Data) {
    // sub-chunk ID 'id3 ' (in ASCII little-endian is: 'i'=0x69, 'd'=0x64, '3'=0x33, ' '=0x20 => stored as uint32: 0x20336469)
    setUint32(0x20336469);
    setUint32(id3PayloadSize); // chunk payload size (32-bit little endian)
    
    // Copy original ID3v2 tag block exactly
    const u8Arr = new Uint8Array(bufferArr);
    u8Arr.set(id3Data, pos);
    pos += id3PayloadSize;
    
    if (id3PaddingSize > 0) {
      view.setUint8(pos, 0);
      pos += 1;
    }
  }

  return new Blob([bufferArr], { type: "audio/wav" });
}

// Extract album cover from raw ID3v2 binary metadata
export function extractCoverFromId3(id3Bytes: Uint8Array): string | undefined {
  try {
    if (id3Bytes[0] !== 0x49 || id3Bytes[1] !== 0x44 || id3Bytes[2] !== 0x33) return undefined;
    
    let pos = 10; // skip 10-byte ID3v2 header
    const totalSize = id3Bytes.length;
    
    while (pos < totalSize - 10) {
      const frameId = String.fromCharCode(id3Bytes[pos], id3Bytes[pos+1], id3Bytes[pos+2], id3Bytes[pos+3]);
      
      const frameSize = (id3Bytes[pos+4] << 24) | (id3Bytes[pos+5] << 16) | (id3Bytes[pos+6] << 8) | id3Bytes[pos+7];
      
      if (frameSize <= 0 || pos + 10 + frameSize > totalSize) {
        break;
      }
      
      if (frameId === "APIC") {
        const payloadStart = pos + 10;
        const payloadEnd = payloadStart + frameSize;
        const encoding = id3Bytes[payloadStart];
        
        // Find MIME type end (null terminator)
        let mimeEnd = payloadStart + 1;
        while (mimeEnd < payloadEnd && id3Bytes[mimeEnd] !== 0) {
          mimeEnd++;
        }
        
        const mimeTypeBytes = id3Bytes.slice(payloadStart + 1, mimeEnd);
        const mimeType = String.fromCharCode(...Array.from(mimeTypeBytes));
        
        const picTypePos = mimeEnd + 1;
        const descStart = picTypePos + 1;
        
        // Find Description end (null terminator or double null for UTF-16)
        let descEnd = descStart;
        if (encoding === 0 || encoding === 3) {
          while (descEnd < payloadEnd && id3Bytes[descEnd] !== 0) {
            descEnd++;
          }
          descEnd++;
        } else {
          while (descEnd < payloadEnd - 1 && !(id3Bytes[descEnd] === 0 && id3Bytes[descEnd+1] === 0)) {
            descEnd++;
          }
          descEnd += 2;
        }
        
        if (descEnd < payloadEnd) {
          const picData = id3Bytes.slice(descEnd, payloadEnd);
          let binary = "";
          const len = picData.length;
          // Process in small chunks to prevent call stack size exceeded errors
          const chunkSize = 8192;
          for (let i = 0; i < len; i += chunkSize) {
            const chunk = picData.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64 = btoa(binary);
          const finalMime = mimeType || "image/jpeg";
          return `data:${finalMime};base64,${base64}`;
        }
      }
      
      pos += 10 + frameSize;
    }
  } catch (e) {
    console.warn("Failed to extract ID3 cover art:", e);
  }
  return undefined;
}

// Extract raw album cover bytes directly from ID3v2 binary
export function extractCoverBytesFromId3(id3Bytes: Uint8Array): { bytes: Uint8Array; mimeType: string } | undefined {
  try {
    if (id3Bytes[0] !== 0x49 || id3Bytes[1] !== 0x44 || id3Bytes[2] !== 0x33) return undefined;
    
    let pos = 10; // skip 10-byte ID3v2 header
    const totalSize = id3Bytes.length;
    
    while (pos < totalSize - 10) {
      const frameId = String.fromCharCode(id3Bytes[pos], id3Bytes[pos+1], id3Bytes[pos+2], id3Bytes[pos+3]);
      const frameSize = (id3Bytes[pos+4] << 24) | (id3Bytes[pos+5] << 16) | (id3Bytes[pos+6] << 8) | id3Bytes[pos+7];
      
      if (frameSize <= 0 || pos + 10 + frameSize > totalSize) {
        break;
      }
      
      if (frameId === "APIC") {
        const payloadStart = pos + 10;
        const payloadEnd = payloadStart + frameSize;
        const encoding = id3Bytes[payloadStart];
        
        // Find MIME type end (null terminator)
        let mimeEnd = payloadStart + 1;
        while (mimeEnd < payloadEnd && id3Bytes[mimeEnd] !== 0) {
          mimeEnd++;
        }
        
        const mimeTypeBytes = id3Bytes.slice(payloadStart + 1, mimeEnd);
        const mimeType = String.fromCharCode(...Array.from(mimeTypeBytes)) || "image/jpeg";
        
        const picTypePos = mimeEnd + 1;
        const descStart = picTypePos + 1;
        
        // Find Description end (null terminator or double null for UTF-16)
        let descEnd = descStart;
        if (encoding === 0 || encoding === 3) {
          while (descEnd < payloadEnd && id3Bytes[descEnd] !== 0) {
            descEnd++;
          }
          descEnd++;
        } else {
          while (descEnd < payloadEnd - 1 && !(id3Bytes[descEnd] === 0 && id3Bytes[descEnd+1] === 0)) {
            descEnd++;
          }
          descEnd += 2;
        }
        
        if (descEnd < payloadEnd) {
          const picData = id3Bytes.slice(descEnd, payloadEnd);
          return { bytes: picData, mimeType };
        }
      }
      
      pos += 10 + frameSize;
    }
  } catch (e) {
    console.warn("Failed to extract ID3 cover art bytes:", e);
  }
  return undefined;
}

// Procedural Synth 1: Ambient Galactic Loop
export function generateAmbientSynth(sampleRate: number): AudioBuffer {
  const duration = 16; // 16-second loop
  const ctx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(2, sampleRate * duration, sampleRate);
  
  const chordProgression = [
    [110.00, 220.00, 277.18, 329.63, 415.30], // A Major 7 (A2, A3, C#4, E4, G#4)
    [116.54, 233.08, 293.66, 349.23, 440.00], // Bb Major 7 (A#2, A#3, D4, F4, A4)
    [98.00, 196.00, 246.94, 293.66, 392.00],  // G Major 7 (G2, G3, B3, D4, G4)
    [110.00, 220.00, 261.63, 329.63, 392.00], // A Minor 7 (A2, A3, C4, E4, G4)
  ];

  const chordDur = 4.0; // 4 seconds per chord

  // Create deep ambient pad synthesis
  for (let chordIdx = 0; chordIdx < 4; chordIdx++) {
    const startTime = chordIdx * chordDur;
    const endTime = startTime + chordDur;
    const notes = chordProgression[chordIdx];

    notes.forEach((freq) => {
      // Create soft triangle oscillator for gentle warm pads
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, startTime);
      filter.frequency.exponentialRampToValueAtTime(140, endTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.04, startTime + 1.2);
      gain.gain.setValueAtTime(0.04, endTime - 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      // Stereo widen by modulating pan
      const panner = ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.positionX.setValueAtTime(Math.sin(freq) * 0.8, startTime);
      panner.positionY.setValueAtTime(0, startTime);
      panner.positionZ.setValueAtTime(Math.cos(freq) * 0.5, startTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(endTime);
    });
  }

  // Soft glittering bell melody
  const melody = [
    { time: 0.5, note: 659.25 }, // E5
    { time: 2.0, note: 830.61 }, // G#5
    { time: 3.5, note: 987.77 }, // B5
    { time: 4.5, note: 698.46 }, // F5
    { time: 6.0, note: 880.00 }, // A5
    { time: 7.5, note: 1046.50 }, // C6
    { time: 8.5, note: 587.33 }, // D5
    { time: 10.0, note: 783.99 }, // G5
    { time: 11.5, note: 987.77 }, // B5
    { time: 12.5, note: 440.00 }, // A4
    { time: 13.5, note: 523.25 }, // C5
    { time: 14.5, note: 659.25 }, // E5
  ];

  melody.forEach((val) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(val.note, val.time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, val.time);
    gain.gain.linearRampToValueAtTime(0.03, val.time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, val.time + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(val.time);
    osc.stop(val.time + 1.3);
  });

  // Render synths as an AudioBuffer
  const bufferPromise = ctx.startRendering();
  // Safe helper as offline rendering is synchronous promise-based
  return (bufferPromise as any);
}

// Procedural Synth 2: Cyber beats (Retrowave/Synthwave loop)
export function generateSynthwaveSynth(sampleRate: number): AudioBuffer {
  const duration = 12; // 12-second loop
  const ctx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(2, sampleRate * duration, sampleRate);
  
  const bpm = 110;
  const stepSec = 60 / bpm / 2; // eighth notes

  // Bassline notes A Minor: A2 G2 F2 E2
  const bassNotes = [55.00, 48.99, 43.65, 41.20]; // A1, G1, F1, E1
  const stepsCount = Math.floor(duration / stepSec);

  // Synthesize pulsing 8th note arpeggiator bassline
  for (let i = 0; i < stepsCount; i++) {
    const startTime = i * stepSec;
    const noteGroup = Math.floor(i / 8) % bassNotes.length;
    const freq = bassNotes[noteGroup];

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, startTime);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(150, startTime);
    filter.frequency.exponentialRampToValueAtTime(100, startTime + stepSec);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + stepSec - 0.01);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + stepSec);
  }

  // Synthesize soft hi-hat clicks
  for (let i = 0; i < stepsCount; i++) {
    if (i % 2 === 1) { // Upbeat hi-hats
      const startTime = i * stepSec;
      const bufferSize = sampleRate * 0.04;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let s = 0; s < bufferSize; s++) {
        data[s] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = "highpass";
      hpFilter.frequency.setValueAtTime(7000, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.008, startTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.03);

      noiseNode.connect(hpFilter);
      hpFilter.connect(gain);
      gain.connect(ctx.destination);

      noiseNode.start(startTime);
      noiseNode.stop(startTime + 0.04);
    }
  }

  // Sweet synthwave chord arpeggiator on top
  const chordSteps = [440.00, 523.25, 659.25, 783.99]; // Am7 notes (A4, C5, E5, G5)
  for (let i = 0; i < stepsCount; i++) {
    if (i % 4 === 0) {
      const startTime = i * stepSec;
      const noteIdx = Math.floor(i / 4) % chordSteps.length;
      const freq = chordSteps[noteIdx];

      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.03, startTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + stepSec * 3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + stepSec * 3);
    }
  }

  const bufferPromise = ctx.startRendering();
  return (bufferPromise as any);
}

// Procedural Synth 3: Chill Cosmic Lofi with simulated vinyl crackle!
export function generateLofiSynth(sampleRate: number): AudioBuffer {
  const duration = 14; 
  const ctx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(2, sampleRate * duration, sampleRate);
  
  // Vinyl crackle simulator node
  const crackleSamples = sampleRate * duration;
  const crackleBuffer = ctx.createBuffer(1, crackleSamples, sampleRate);
  const cData = crackleBuffer.getChannelData(0);
  for (let i = 0; i < crackleSamples; i++) {
    // Generate organic ticks and constant thin hum
    const white = Math.random() * 2 - 1;
    // Tiny constant hiss
    let sample = white * 0.015;
    // Random dust scratches triggers
    if (Math.random() < 0.00015) {
      sample += (Math.random() > 0.5 ? 1 : -1) * 0.65;
    }
    cData[i] = sample;
  }
  
  const crackleSource = ctx.createBufferSource();
  crackleSource.buffer = crackleBuffer;
  
  const crackleFilter = ctx.createBiquadFilter();
  crackleFilter.type = "bandpass";
  crackleFilter.frequency.setValueAtTime(1200, 0);
  crackleFilter.Q.setValueAtTime(0.4, 0);

  const crackleGain = ctx.createGain();
  crackleGain.gain.setValueAtTime(0.012, 0);

  crackleSource.connect(crackleFilter);
  crackleFilter.connect(crackleGain);
  crackleGain.connect(ctx.destination);
  crackleSource.start(0);

  // Warm Rhodes E-Piano Chords: Dm9 -> G13 -> Cmaj9 -> A7(#5)
  const lofiChords = [
    [146.83, 220.00, 293.66, 349.23, 440.00, 523.25], // Dm9 (D3, A3, D4, F4, A4, C5)
    [98.00, 196.00, 246.94, 311.13, 392.00, 440.00],  // G13 (G2, G3, B3, D#4, G4, A4)
    [130.81, 261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9 (C3, C4, E4, G4, B4, D5)
    [110.00, 220.00, 277.18, 329.63, 415.30, 493.88], // A7#5 (A2, A3, C#4, E4, G#4, B4)
  ];

  const chordLength = 3.5; // 3.5 seconds per chord

  for (let i = 0; i < lofiChords.length; i++) {
    const startTime = i * chordLength;
    const endTime = startTime + chordLength;
    const freqs = lofiChords[i];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "sine"; // Pure organic rhodes sound
      osc.frequency.setValueAtTime(freq, startTime);

      // Add slight detune LFO manually for that organic tape-flutter vibe!
      const flutterFactor = Math.sin(idx * 45) * 1.5;
      osc.detune.setValueAtTime(flutterFactor, startTime);
      osc.detune.linearRampToValueAtTime(flutterFactor + 15, startTime + 1.5);
      osc.detune.linearRampToValueAtTime(flutterFactor - 15, startTime + 3.0);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      // Soft touch build up
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      const keyFilter = ctx.createBiquadFilter();
      keyFilter.type = "lowpass";
      keyFilter.frequency.setValueAtTime(1000, startTime);

      osc.connect(keyFilter);
      keyFilter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(endTime);
    });
  }

  const bufferPromise = ctx.startRendering();
  return (bufferPromise as any);
}

// Struct for Parsed Audio album art, titles, and artists
export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
}

// Generate a beautiful, creative, unique SVG vinyl/cassette placeholder based on song name seed
export function generateDefaultCoverUrl(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = Math.abs((hash * 13) % 360);
  
  // High-fidelity rich modern neon gradients
  const color1 = `hsl(${h1}, 80%, 45%)`;
  const color2 = `hsl(${h2}, 85%, 25%)`;
  
  const initials = name.trim().slice(0, 2).replace(/[^a-zA-Z0-9أ-ي]/g, "").toUpperCase() || "MU";
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="grad-${h1}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="40" fill="url(#grad-${h1})" />
    <!-- Outer Vinyl Groove lines -->
    <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
    <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="4" />
    <circle cx="100" cy="100" r="58" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
    <circle cx="100" cy="100" r="44" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="4" />
    <!-- Center Label -->
    <circle cx="100" cy="100" r="28" fill="rgba(0,0,0,0.5)" />
    <!-- Spindle core -->
    <circle cx="100" cy="100" r="7" fill="rgba(255,255,255,0.85)" />
    <!-- Initials text overlay -->
    <text x="100" y="108" font-family="'Inter', system-ui, sans-serif" font-size="22" font-weight="950" fill="white" fill-opacity="0.9" text-anchor="middle" letter-spacing="1.5">${initials}</text>
  </svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Parse ID3v2 Tags & extract Title, Artist, Album, and Cover Image safely
export function parseAudioMetadata(id3Bytes: Uint8Array): AudioMetadata {
  const result: AudioMetadata = {};
  try {
    if (id3Bytes[0] !== 0x49 || id3Bytes[1] !== 0x44 || id3Bytes[2] !== 0x33) return result;
    
    const majorVersion = id3Bytes[3];
    let pos = 10; // skip 10-byte ID3v2 header
    const totalSize = id3Bytes.length;
    
    const decodeText = (bytes: Uint8Array, encoding: number): string => {
      // Remove trailing null-bytes first because they are padding and mess up zero-counts
      let endIdx = bytes.length;
      while (endIdx > 0 && bytes[endIdx - 1] === 0) {
        endIdx--;
      }
      const activeBytes = bytes.subarray(0, endIdx);
      if (activeBytes.length === 0) return "";

      // Helper to check if a decoded string is mostly junk Chinese/CJK characters (Mojibake check)
      const isMojibakeCJK = (str: string): boolean => {
        if (!str) return false;
        let cjkCount = 0;
        let asciiOrArabicCount = 0;
        for (let i = 0; i < str.length; i++) {
          const code = str.charCodeAt(i);
          // CJK Unified Ideographs block
          if (code >= 0x4e00 && code <= 0x9fff) {
            cjkCount++;
          } else if ((code >= 32 && code <= 126) || (code >= 0x0600 && code <= 0x06ff)) {
            asciiOrArabicCount++;
          }
        }
        // If CJK count is high, or if CJK characters exist but there are no ascii/arabic characters, it's Mojibake
        if (cjkCount > 0) {
          if (cjkCount / str.length > 0.15 || asciiOrArabicCount === 0) {
            return true;
          }
        }
        return false;
      };

      let decoded = "";

      // 1. If bytes start with UTF-16 BOM, use native "utf-16" decoder which automatically handles BOM
      if (activeBytes.length >= 2) {
        if ((activeBytes[0] === 0xff && activeBytes[1] === 0xfe) || (activeBytes[0] === 0xfe && activeBytes[1] === 0xff)) {
          try {
            decoded = new TextDecoder("utf-16").decode(activeBytes);
            if (!isMojibakeCJK(decoded)) {
              return decoded.replace(/\0/g, "").trim();
            }
          } catch {}
        }
      }

      // 2. Try the specified encoding (UTF-16 with BOM / BE)
      if (encoding === 1 || encoding === 2) {
        try {
          const label = encoding === 2 ? "utf-16be" : "utf-16le";
          decoded = new TextDecoder(label).decode(activeBytes);
          if (!isMojibakeCJK(decoded)) {
            return decoded.replace(/\0/g, "").trim();
          }
        } catch {}
      }

      // 3. Fallback: try UTF-8 first (very common for standard/modern Arabic and English tags)
      try {
        decoded = new TextDecoder("utf-8").decode(activeBytes);
        if (!isMojibakeCJK(decoded)) {
          return decoded.replace(/\0/g, "").trim();
        }
      } catch {}

      // 4. Fallback: try Windows-1256 (excellent for 8-bit Arabic tags that aren't UTF-8)
      try {
        const decoded1256 = new TextDecoder("windows-1256").decode(activeBytes);
        if (/[\u0600-\u06FF]/.test(decoded1256) && !isMojibakeCJK(decoded1256)) {
          return decoded1256.replace(/\0/g, "").trim();
        }
      } catch {}

      // 5. Fallback: try ISO-8859-1 (standard Western)
      try {
        decoded = new TextDecoder("iso-8859-1").decode(activeBytes);
        if (!isMojibakeCJK(decoded)) {
          return decoded.replace(/\0/g, "").trim();
        }
      } catch {}

      // 6. Hard fallback: String.fromCharCode
      return String.fromCharCode(...Array.from(activeBytes)).replace(/\0/g, "").trim();
    };

    while (pos < totalSize - 10) {
      if (id3Bytes[pos] === 0) {
        break; // reached padding
      }
      
      const frameId = String.fromCharCode(id3Bytes[pos], id3Bytes[pos+1], id3Bytes[pos+2], id3Bytes[pos+3]);
      
      let frameSize = 0;
      if (majorVersion === 4) {
        // ID3v2.4 sizes are synchsafe (7 bits per byte)
        frameSize = ((id3Bytes[pos+4] & 0x7F) << 21) |
                    ((id3Bytes[pos+5] & 0x7F) << 14) |
                    ((id3Bytes[pos+6] & 0x7F) << 7) |
                     (id3Bytes[pos+7] & 0x7F);
      } else {
        // ID3v2.3 sizes are 32-bit big-endian
        frameSize = (id3Bytes[pos+4] << 24) | (id3Bytes[pos+5] << 16) | (id3Bytes[pos+6] << 8) | id3Bytes[pos+7];
      }
      
      if (frameSize <= 0 || pos + 10 + frameSize > totalSize) {
        break;
      }
      
      const payloadStart = pos + 10;
      const payloadEnd = payloadStart + frameSize;
      
      if (frameId === "TIT2") {
        const encoding = id3Bytes[payloadStart];
        const textBytes = id3Bytes.slice(payloadStart + 1, payloadEnd);
        result.title = decodeText(textBytes, encoding).replace(/\0/g, "").trim();
      } else if (frameId === "TPE1") {
        const encoding = id3Bytes[payloadStart];
        const textBytes = id3Bytes.slice(payloadStart + 1, payloadEnd);
        result.artist = decodeText(textBytes, encoding).replace(/\0/g, "").trim();
      } else if (frameId === "TALB") {
        const encoding = id3Bytes[payloadStart];
        const textBytes = id3Bytes.slice(payloadStart + 1, payloadEnd);
        result.album = decodeText(textBytes, encoding).replace(/\0/g, "").trim();
      } else if (frameId === "APIC") {
        const encoding = id3Bytes[payloadStart];
        
        let mimeEnd = payloadStart + 1;
        while (mimeEnd < payloadEnd && id3Bytes[mimeEnd] !== 0) {
          mimeEnd++;
        }
        
        const mimeTypeBytes = id3Bytes.slice(payloadStart + 1, mimeEnd);
        const mimeType = String.fromCharCode(...Array.from(mimeTypeBytes));
        
        const picTypePos = mimeEnd + 1;
        const descStart = picTypePos + 1;
        
        let descEnd = descStart;
        if (encoding === 0 || encoding === 3) {
          while (descEnd < payloadEnd && id3Bytes[descEnd] !== 0) {
            descEnd++;
          }
          descEnd++;
        } else {
          while (descEnd < payloadEnd - 1 && !(id3Bytes[descEnd] === 0 && id3Bytes[descEnd+1] === 0)) {
            descEnd++;
          }
          descEnd += 2;
        }
        
        if (descEnd < payloadEnd) {
          const picData = id3Bytes.slice(descEnd, payloadEnd);
          let binary = "";
          const len = picData.length;
          const chunkSize = 8192;
          for (let i = 0; i < len; i += chunkSize) {
            const chunk = picData.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64 = btoa(binary);
          const finalMime = mimeType || "image/jpeg";
          result.coverUrl = `data:${finalMime};base64,${base64}`;
        }
      }
      
      pos += 10 + frameSize;
    }
  } catch (e) {
    console.warn("Failed to parse full ID3 tags:", e);
  }
  return result;
}

/**
 * Searches the iTunes API for cover art based on track title and/or artist,
 * and extracts high-resolution artwork and correct metadata.
 */
export async function searchAndFetchCoverArt(title: string, artist?: string): Promise<{ coverUrl: string; artist?: string; album?: string } | undefined> {
  try {
    let cleanedTitle = title
      .replace(/\.(mp3|wav|m4a|ogg|flac)$/i, "")
      .replace(/(_slowed|_reverb|_slowed_reverb|slowed|reverb)/gi, "")
      .replace(/[\-_]/g, " ")
      .trim();
    
    let query = cleanedTitle;
    if (artist) {
      let cleanedArtist = artist.replace(/[\-_]/g, " ").trim();
      query += ` ${cleanedArtist}`;
    }
    
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`;
    const res = await fetch(searchUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        let highResArtwork = result.artworkUrl100 || "";
        if (highResArtwork.includes("100x100bb")) {
          highResArtwork = highResArtwork.replace("100x100bb", "600x600bb");
        } else if (highResArtwork.includes("100x100")) {
          highResArtwork = highResArtwork.replace("100x100", "600x600");
        }
        return {
          coverUrl: highResArtwork,
          artist: result.artistName,
          album: result.collectionName
        };
      }
    }
  } catch (err) {
    console.warn("iTunes Search API artwork discovery failed:", err);
  }
  return undefined;
}

/**
 * Helper to fetch binary image bytes from any image URL (such as iTunes or base64)
 */
export async function fetchImageBytes(coverUrl: string): Promise<{ bytes: Uint8Array; mimeType: string } | undefined> {
  try {
    if (!coverUrl) return undefined;
    if (coverUrl.startsWith("data:")) {
      const match = coverUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return { bytes, mimeType };
      }
      
      if (coverUrl.includes("data:image/svg+xml")) {
        const decodedSvg = decodeURIComponent(coverUrl.replace(/^data:image\/svg\+xml;utf8,/, "").replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
        return new Promise((resolve) => {
          const timeoutId = setTimeout(() => {
            console.warn("SVG rendering timed out gracefully.");
            resolve(undefined);
          }, 1500);
          const img = new Image();
          img.onload = () => {
            clearTimeout(timeoutId);
            const canvas = document.createElement("canvas");
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, 200, 200);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
              const base64 = dataUrl.split(",")[1];
              const bin = atob(base64);
              const b = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
              resolve({ bytes: b, mimeType: "image/jpeg" });
            } else {
              resolve(undefined);
            }
          };
          img.onerror = () => {
            clearTimeout(timeoutId);
            resolve(undefined);
          };
          img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(decodedSvg)));
        });
      }
    } else {
      // Normal external URL. We should use direct fetch because iTunes is CORS-enabled.
      // Use an AbortController with 2000ms timeout to ensure saving process doesn't hang on slow image servers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      try {
        const res = await fetch(coverUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const blob = await res.blob();
          const arrayBuffer = await blob.arrayBuffer();
          return { bytes: new Uint8Array(arrayBuffer), mimeType: blob.type || "image/jpeg" };
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn("Fetch image bytes timed out or was blocked:", fetchErr);
      }
    }
  } catch (err) {
    console.error("Failed to fetch image bytes for ID3:", err);
  }
  return undefined;
}

/**
 * Encodes text fields into standard ID3v2.3 compliant frame with UTF-16 LE and BOM.
 */
function encodeTextFrame(frameId: string, text: string): Uint8Array {
  const textBytes = new Uint8Array(2 + text.length * 2);
  textBytes[0] = 0xFF; // BOM LE
  textBytes[1] = 0xFE;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    textBytes[2 + i * 2] = code & 0xFF;
    textBytes[2 + i * 2 + 1] = (code >> 8) & 0xFF;
  }
  
  const frameLength = 1 + textBytes.length; // 1 byte for encoding type, plus string payload
  const header = new Uint8Array(10);
  for (let i = 0; i < 4; i++) {
    header[i] = frameId.charCodeAt(i);
  }
  header[4] = (frameLength >> 24) & 0xFF;
  header[5] = (frameLength >> 16) & 0xFF;
  header[6] = (frameLength >> 8) & 0xFF;
  header[7] = frameLength & 0xFF;
  header[8] = 0;
  header[9] = 0;
  
  const frame = new Uint8Array(10 + frameLength);
  frame.set(header, 0);
  frame[10] = 1; // 1 = UTF-16 with BOM
  frame.set(textBytes, 11);
  return frame;
}

/**
 * Encodes an image into a standard ID3v2.3 APIC frame.
 */
function encodeApicFrame(imageBytes: Uint8Array, mimeType: string): Uint8Array {
  const mimeBytes = new TextEncoder().encode(mimeType);
  const descBytes = new Uint8Array([0]); // Empty description string + null terminator
  
  const payloadSize = 1 + mimeBytes.length + 1 + 1 + descBytes.length + imageBytes.length;
  
  const header = new Uint8Array(10);
  header[0] = 0x41; // 'A'
  header[1] = 0x50; // 'P'
  header[2] = 0x49; // 'I'
  header[3] = 0x43; // 'C'
  
  header[4] = (payloadSize >> 24) & 0xFF;
  header[5] = (payloadSize >> 16) & 0xFF;
  header[6] = (payloadSize >> 8) & 0xFF;
  header[7] = payloadSize & 0xFF;
  header[8] = 0;
  header[9] = 0;
  
  const frame = new Uint8Array(10 + payloadSize);
  frame.set(header, 0);
  let pos = 10;
  frame[pos++] = 0; // Encoding: 0 = ISO-8859-1 / ASCII
  frame.set(mimeBytes, pos);
  pos += mimeBytes.length;
  frame[pos++] = 0; // Terminate MIME type
  frame[pos++] = 3; // Picture type: 3 = Cover (front)
  frame.set(descBytes, pos);
  pos += descBytes.length;
  frame.set(imageBytes, pos);
  return frame;
}

/**
 * Constructs a fully valid ID3v2.3 overall container tag byte block.
 */
export function createId3v23Tag(title: string, artist: string, album: string, imageBytes?: Uint8Array, mimeType: string = "image/jpeg"): Uint8Array {
  const frames: Uint8Array[] = [];
  
  if (title) frames.push(encodeTextFrame("TIT2", title));
  if (artist) frames.push(encodeTextFrame("TPE1", artist));
  if (album) frames.push(encodeTextFrame("TALB", album));
  if (imageBytes && imageBytes.length > 0) {
    frames.push(encodeApicFrame(imageBytes, mimeType));
  }
  
  let totalFramesSize = 0;
  for (const f of frames) totalFramesSize += f.length;
  
  const tagSize = totalFramesSize;
  const b0 = (tagSize >> 21) & 0x7F;
  const b1 = (tagSize >> 14) & 0x7F;
  const b2 = (tagSize >> 7) & 0x7F;
  const b3 = tagSize & 0x7F;
  
  const tagHeader = new Uint8Array(10);
  tagHeader[0] = 0x49; // 'I'
  tagHeader[1] = 0x44; // 'D'
  tagHeader[2] = 0x33; // '3'
  tagHeader[3] = 3;    // ID3v2.3
  tagHeader[4] = 0;
  tagHeader[5] = 0;
  tagHeader[6] = b0;
  tagHeader[7] = b1;
  tagHeader[8] = b2;
  tagHeader[9] = b3;
  
  const entireTag = new Uint8Array(10 + totalFramesSize);
  entireTag.set(tagHeader, 0);
  let pos = 10;
  for (const f of frames) {
    entireTag.set(f, pos);
    pos += f.length;
  }
  return entireTag;
}

/**
 * Strips existing ID3v2 tags from beginning of binary audio arrays
 */
export function stripExistingId3v2Tag(audioBytes: Uint8Array): Uint8Array {
  if (audioBytes[0] === 0x49 && audioBytes[1] === 0x44 && audioBytes[2] === 0x33) {
    const b0 = audioBytes[6];
    const b1 = audioBytes[7];
    const b2 = audioBytes[8];
    const b3 = audioBytes[9];
    const size = ((b0 & 0x7F) << 21) | ((b1 & 0x7F) << 14) | ((b2 & 0x7F) << 7) | (b3 & 0x7F);
    const totalSize = size + 10;
    if (totalSize <= audioBytes.length) {
      return audioBytes.subarray(totalSize);
    }
  }
  return audioBytes;
}

/**
 * Creates and injects fresh and complete ID3v2.3 tags into sound file binary arrays (MP3 or WAV).
 */
export async function embedId3MetadataInAudioFile(
  originalFileBytes: Uint8Array,
  title: string,
  artist: string,
  album: string,
  coverUrl: string
): Promise<Uint8Array> {
  try {
    const imgData = await fetchImageBytes(coverUrl);
    const id3Bytes = createId3v23Tag(
      title,
      artist,
      album,
      imgData?.bytes,
      imgData?.mimeType || "image/jpeg"
    );
    
    const isWav = originalFileBytes[0] === 0x52 && originalFileBytes[1] === 0x49 && originalFileBytes[2] === 0x46 && originalFileBytes[3] === 0x46; // "RIFF"
    if (isWav) {
      return originalFileBytes;
    } else {
      const stripped = stripExistingId3v2Tag(originalFileBytes);
      const blended = new Uint8Array(id3Bytes.length + stripped.length);
      blended.set(id3Bytes, 0);
      blended.set(stripped, id3Bytes.length);
      return blended;
    }
  } catch (err) {
    console.error("Failed to embed ID3 metadata in audio file:", err);
    return originalFileBytes;
  }
}

/**
 * Encodes an AudioBuffer into a high-quality stereo/mono MP3 bytes buffer using lamejs.
 */
export function audioBufferToMp3Bytes(buffer: AudioBuffer): Uint8Array {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  // Safely resolve Mp3Encoder across environments
  const mp3encoder = createMp3EncoderInstance(channels, sampleRate, 192);
  
  const mp3Data: Uint8Array[] = [];
  const sampleBlockSize = 1152;
  
  if (channels === 1) {
    const left = buffer.getChannelData(0);
    const size = left.length;
    const chunk = new Int16Array(sampleBlockSize);
    
    for (let i = 0; i < size; i += sampleBlockSize) {
      const chunkLen = Math.min(sampleBlockSize, size - i);
      const activeChunk = chunkLen === sampleBlockSize ? chunk : new Int16Array(chunkLen);
      
      for (let j = 0; j < chunkLen; j++) {
        let s = left[i + j];
        if (s < -1) s = -1;
        else if (s > 1) s = 1;
        activeChunk[j] = s < 0 ? s * 32768 : s * 32767;
      }
      
      const mp3buf = mp3encoder.encodeBuffer(activeChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }
  } else {
    // Stereo
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const size = left.length;
    
    const chunkL = new Int16Array(sampleBlockSize);
    const chunkR = new Int16Array(sampleBlockSize);
    
    for (let i = 0; i < size; i += sampleBlockSize) {
      const chunkLen = Math.min(sampleBlockSize, size - i);
      const activeL = chunkLen === sampleBlockSize ? chunkL : new Int16Array(chunkLen);
      const activeR = chunkLen === sampleBlockSize ? chunkR : new Int16Array(chunkLen);
      
      for (let j = 0; j < chunkLen; j++) {
        let sL = left[i + j];
        if (sL < -1) sL = -1;
        else if (sL > 1) sL = 1;
        activeL[j] = sL < 0 ? sL * 32768 : sL * 32767;
        
        let sR = right[i + j];
        if (sR < -1) sR = -1;
        else if (sR > 1) sR = 1;
        activeR[j] = sR < 0 ? sR * 32768 : sR * 32767;
      }
      
      const mp3buf = mp3encoder.encodeBuffer(activeL, activeR);
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }
  }
  
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(new Uint8Array(mp3buf));
  }
  
  let totalLength = 0;
  for (const arr of mp3Data) {
    totalLength += arr.length;
  }
  
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of mp3Data) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}

/**
 * Encodes an AudioBuffer into a high-quality stereo/mono MP3 bytes buffer using chunks to allow progress updates and yield to CPU.
 */
export async function audioBufferToMp3BytesAsync(
  buffer: AudioBuffer,
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  // Safely resolve Mp3Encoder across environments
  const mp3encoder = createMp3EncoderInstance(channels, sampleRate, 192);
  
  const mp3Data: Uint8Array[] = [];
  const sampleBlockSize = 1152;
  
  if (channels === 1) {
    const left = buffer.getChannelData(0);
    const size = left.length;
    const chunk = new Int16Array(sampleBlockSize);
    
    let lastProgressTime = Date.now();
    
    for (let i = 0; i < size; i += sampleBlockSize) {
      const chunkLen = Math.min(sampleBlockSize, size - i);
      const activeChunk = chunkLen === sampleBlockSize ? chunk : new Int16Array(chunkLen);
      
      for (let j = 0; j < chunkLen; j++) {
        let s = left[i + j];
        if (s < -1) s = -1;
        else if (s > 1) s = 1;
        activeChunk[j] = s < 0 ? s * 32768 : s * 32767;
      }
      
      const mp3buf = mp3encoder.encodeBuffer(activeChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
      
      // Update progress and yield with setTimeout to keep UI super smooth
      if (onProgress && (i % (sampleBlockSize * 40) === 0 || i + sampleBlockSize >= size)) {
        const percent = Math.min(99, Math.round((i / size) * 100));
        onProgress(percent);
        // Limit yielding to avoid slowing down too much, yield every 15ms or so
        const now = Date.now();
        if (now - lastProgressTime > 15) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          lastProgressTime = Date.now();
        }
      }
    }
  } else {
    // Stereo
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const size = left.length;
    
    const chunkL = new Int16Array(sampleBlockSize);
    const chunkR = new Int16Array(sampleBlockSize);
    
    let lastProgressTime = Date.now();
    
    for (let i = 0; i < size; i += sampleBlockSize) {
      const chunkLen = Math.min(sampleBlockSize, size - i);
      const activeL = chunkLen === sampleBlockSize ? chunkL : new Int16Array(chunkLen);
      const activeR = chunkLen === sampleBlockSize ? chunkR : new Int16Array(chunkLen);
      
      for (let j = 0; j < chunkLen; j++) {
        let sL = left[i + j];
        if (sL < -1) sL = -1;
        else if (sL > 1) sL = 1;
        activeL[j] = sL < 0 ? sL * 32768 : sL * 32767;
        
        let sR = right[i + j];
        if (sR < -1) sR = -1;
        else if (sR > 1) sR = 1;
        activeR[j] = sR < 0 ? sR * 32768 : sR * 32767;
      }
      
      const mp3buf = mp3encoder.encodeBuffer(activeL, activeR);
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
      
      // Update progress and yield with setTimeout
      if (onProgress && (i % (sampleBlockSize * 40) === 0 || i + sampleBlockSize >= size)) {
        const percent = Math.min(99, Math.round((i / size) * 100));
        onProgress(percent);
        const now = Date.now();
        if (now - lastProgressTime > 15) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          lastProgressTime = Date.now();
        }
      }
    }
  }
  
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(new Uint8Array(mp3buf));
  }
  
  let totalLength = 0;
  for (const arr of mp3Data) {
    totalLength += arr.length;
  }
  
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of mp3Data) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  if (onProgress) {
    onProgress(100);
  }
  
  return result;
}

/**
 * Encodes AudioBuffer to MP3 and prepends standard ID3v2.3 tags with cover art!
 */
export function audioBufferToMp3Blob(buffer: AudioBuffer, id3Data?: Uint8Array): Blob {
  const mp3Bytes = audioBufferToMp3Bytes(buffer);
  if (id3Data && id3Data.length > 0) {
    const blended = new Uint8Array(id3Data.length + mp3Bytes.length);
    blended.set(id3Data, 0);
    blended.set(mp3Bytes, id3Data.length);
    return new Blob([blended], { type: "audio/mp3" });
  }
  return new Blob([mp3Bytes], { type: "audio/mp3" });
}

/**
 * Encodes AudioBuffer to MP3 asynchronously and prepends standard ID3v2.3 tags with cover art.
 */
export async function audioBufferToMp3BlobAsync(
  buffer: AudioBuffer,
  id3Data?: Uint8Array,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const mp3Bytes = await audioBufferToMp3BytesAsync(buffer, onProgress);
  if (id3Data && id3Data.length > 0) {
    const blended = new Uint8Array(id3Data.length + mp3Bytes.length);
    blended.set(id3Data, 0);
    blended.set(mp3Bytes, id3Data.length);
    return new Blob([blended], { type: "audio/mp3" });
  }
  return new Blob([mp3Bytes], { type: "audio/mp3" });
}

/**
 * Utility to convert Uint8Array binary bytes into a base64 Data URL.
 */
export function bytesToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = "";
  const len = bytes.length;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

