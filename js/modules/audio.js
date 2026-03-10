/* ── Audio Steganography Module ── */

/* --- Module state --- */
var _audioCoverPCM = null;       // Float32Array of uploaded/recorded cover
var _audioCoverRate = 44100;     // sample rate of uploaded cover
var _audioGenBuf = null;         // last generated Int-samples array (for playback)
var _audioGenRate = 44100;       // sample rate of last generated file
var _audioPlayCtx = null;        // AudioContext for playback
var _audioPlaySrc = null;        // current playing source node
var _audioIsPlaying = false;
var _audioIsRecording = false;
var _audioRecorder = null;       // MediaRecorder instance
var _audioRecordChunks = [];

/* ================================================================
   1. PAYLOAD SELECTION HELPERS
   ================================================================ */

function audioSelectPayload() {
  var sel = document.getElementById('audioPayloadDD');
  var ta = document.getElementById('audioPayload');
  if (sel && ta && P[+sel.value]) ta.value = P[+sel.value].t;
}

function audioLoadFromGen() {
  var ap = document.getElementById('audioPayload');
  if (ap) {
    var pl = document.getElementById('pl');
    var val = (pl && pl.value) ? pl.value : currentPayload;
    if (val) {
      ap.value = val;
      toast('Loaded payload from Generate tab', 'ok');
    } else {
      toast('No payload found in Generate tab', 'warn');
    }
  }
}

/* ================================================================
   2. COVER AUDIO: UPLOAD / RECORD / CLEAR
   ================================================================ */

function audioUploadCover(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    var actx = new (window.AudioContext || window.webkitAudioContext)();
    actx.decodeAudioData(e.target.result, function(abuf) {
      _audioCoverPCM = abuf.getChannelData(0);
      _audioCoverRate = abuf.sampleRate;
      _showCoverInfo(file.name, abuf);
      _audioRenderWaveform(_audioCoverPCM, 'audioCoverWaveform');
      document.getElementById('audioCoverWaveform').style.display = 'block';
      document.getElementById('audioClearCoverBtn').disabled = false;
      document.getElementById('audioClearCoverBtn').style.opacity = '1';
      actx.close();
      toast('Cover audio loaded: ' + file.name, 'ok');
    }, function() {
      toast('Failed to decode audio file', 'err');
      actx.close();
    });
  };
  reader.readAsArrayBuffer(file);
}

function _showCoverInfo(name, abuf) {
  var info = document.getElementById('audioCoverInfo');
  if (!info) return;
  var dur = abuf.duration.toFixed(2);
  var ch = abuf.numberOfChannels;
  var sr = abuf.sampleRate;
  safeText(info, name + ' | ' + dur + 's | ' + ch + 'ch | ' + sr + ' Hz | ' + abuf.length + ' samples');
  info.style.display = 'block';
}

function audioRecordToggle() {
  if (_audioIsRecording) {
    _audioIsRecording = false;
    if (_audioRecorder && _audioRecorder.state === 'recording') _audioRecorder.stop();
    document.getElementById('audioRecordBtn').innerHTML = '&#x1F3A4;&#xFE0F; Record';
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('MediaDevices API not available', 'err');
    return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    _audioIsRecording = true;
    _audioRecordChunks = [];
    _audioRecorder = new MediaRecorder(stream);
    _audioRecorder.ondataavailable = function(e) {
      if (e.data.size > 0) _audioRecordChunks.push(e.data);
    };
    _audioRecorder.onstop = function() {
      stream.getTracks().forEach(function(t) { t.stop(); });
      var blob = new Blob(_audioRecordChunks, { type: 'audio/webm' });
      var reader = new FileReader();
      reader.onload = function(ev) {
        var actx = new (window.AudioContext || window.webkitAudioContext)();
        actx.decodeAudioData(ev.target.result, function(abuf) {
          _audioCoverPCM = abuf.getChannelData(0);
          _audioCoverRate = abuf.sampleRate;
          _showCoverInfo('Recorded', abuf);
          _audioRenderWaveform(_audioCoverPCM, 'audioCoverWaveform');
          document.getElementById('audioCoverWaveform').style.display = 'block';
          document.getElementById('audioClearCoverBtn').disabled = false;
          document.getElementById('audioClearCoverBtn').style.opacity = '1';
          document.getElementById('audioPlayCoverBtn').disabled = false;
          document.getElementById('audioPlayCoverBtn').style.opacity = '1';
          actx.close();
          toast('Recording captured', 'ok');
        }, function() {
          toast('Failed to decode recording', 'err');
          actx.close();
        });
      };
      reader.readAsArrayBuffer(blob);
    };
    _audioRecorder.start();
    document.getElementById('audioRecordBtn').innerHTML = '&#x23F9; Stop';
    toast('Recording started...', 'info');
  }).catch(function(err) {
    toast('Mic access denied: ' + err.message, 'err');
  });
}

function audioClearCover() {
  _audioCoverPCM = null;
  _audioCoverRate = 44100;
  document.getElementById('audioCoverInfo').style.display = 'none';
  document.getElementById('audioCoverWaveform').style.display = 'none';
  document.getElementById('audioClearCoverBtn').disabled = true;
  document.getElementById('audioClearCoverBtn').style.opacity = '0.6';
  var inp = document.getElementById('audioUploadInput');
  if (inp) inp.value = '';
  toast('Cover audio cleared', 'info');
}

/* ================================================================
   3. DUAL CHANNEL UI UPDATE
   ================================================================ */

function audioUpdateDualChannel() {
  var ch = document.getElementById('audioChannels');
  var row = document.getElementById('aud_dual_channel_row');
  if (ch && row) row.style.opacity = ch.value === '2' ? '1' : '0.4';
}

/* ================================================================
   4. SYNTHETIC COVER GENERATION
   ================================================================ */

function _audioGenSynth(type, numSamples, sampleRate) {
  var samples = new Float32Array(numSamples);
  var i, t;
  switch (type) {
    case 'silence':
      break;
    case 'white_noise':
      for (i = 0; i < numSamples; i++) {
        samples[i] = (Math.random() * 2 - 1) * 0.3;
      }
      break;
    case 'tone':
      for (i = 0; i < numSamples; i++) {
        t = i / sampleRate;
        samples[i] = Math.sin(2 * Math.PI * 440 * t) * 0.5;
      }
      break;
    case 'sweep':
      for (i = 0; i < numSamples; i++) {
        t = i / numSamples;
        var freq = 200 + (2000 - 200) * t;
        samples[i] = Math.sin(2 * Math.PI * freq * (i / sampleRate)) * 0.5;
      }
      break;
    case 'speech_sim':
      for (i = 0; i < numSamples; i++) {
        t = i / sampleRate;
        var ampMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t);
        samples[i] = ampMod * (
          0.4 * Math.sin(2 * Math.PI * 120 * t) +
          0.25 * Math.sin(2 * Math.PI * 250 * t) +
          0.15 * Math.sin(2 * Math.PI * 500 * t) +
          0.1 * Math.sin(2 * Math.PI * 800 * t)
        ) * 0.5;
      }
      break;
    case 'music_sim':
      for (i = 0; i < numSamples; i++) {
        t = i / sampleRate;
        var env = 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.5 * t);
        samples[i] = env * (
          0.35 * Math.sin(2 * Math.PI * 261.63 * t) +
          0.25 * Math.sin(2 * Math.PI * 329.63 * t) +
          0.2 * Math.sin(2 * Math.PI * 392.0 * t) +
          0.1 * Math.sin(2 * Math.PI * 523.25 * t) +
          0.1 * Math.sin(2 * Math.PI * 659.25 * t)
        ) * 0.5;
      }
      break;
    default:
      break;
  }
  return samples;
}

/* ================================================================
   5. PAYLOAD TO BITS CONVERSION
   ================================================================ */

function _audioPayloadToBits(payload) {
  var bits = [];
  for (var i = 0; i < payload.length; i++) {
    var code = payload.charCodeAt(i) & 0xFF;
    for (var b = 7; b >= 0; b--) {
      bits.push((code >> b) & 1);
    }
  }
  return bits;
}

function _audioPayloadToUTF8Bytes(payload) {
  var bytes = [];
  for (var i = 0; i < payload.length; i++) {
    var c = payload.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
    } else {
      bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    }
  }
  return bytes;
}

/* ================================================================
   6. INJECTION TECHNIQUES
   ================================================================ */

function _audioInjectMetadata(payload) {
  // Returns array of {id: fourCC, data: Uint8Array} for RIFF INFO chunks
  var enc = new TextEncoder();
  var chunks = [];
  var parts = [
    { id: 'INAM', text: payload },
    { id: 'ICMT', text: 'SYSTEM: ' + payload },
    { id: 'IART', text: payload },
    { id: 'ISFT', text: 'PromptStrike Audio v7.0 | ' + payload }
  ];
  for (var i = 0; i < parts.length; i++) {
    var data = enc.encode(parts[i].text + '\0');
    chunks.push({ id: parts[i].id, data: data });
  }
  return chunks;
}

function _audioInjectExtendedMeta(payload) {
  var enc = new TextEncoder();
  var chunks = [];

  // BEXT chunk (Broadcast Extension)
  var desc = enc.encode(payload);
  var bext = new Uint8Array(602);
  bext.set(desc.subarray(0, Math.min(256, desc.length)), 0); // Description (256 bytes)
  var orig = enc.encode('PromptStrike');
  bext.set(orig.subarray(0, Math.min(32, orig.length)), 256); // Originator
  var origRef = enc.encode(payload.substring(0, 32));
  bext.set(origRef.subarray(0, Math.min(32, origRef.length)), 288); // OriginatorRef
  chunks.push({ id: 'bext', data: bext });

  // iXML chunk
  var xml = '<?xml version="1.0"?><BWFXML><DESCRIPTION>' + esc(payload) +
    '</DESCRIPTION><NOTE>' + esc(payload) +
    '</NOTE><USER>' + esc(payload) + '</USER></BWFXML>';
  chunks.push({ id: 'iXML', data: enc.encode(xml) });

  // Custom chunk
  var customData = enc.encode('INJECT:' + payload + '\0');
  chunks.push({ id: 'psrk', data: customData });

  return chunks;
}

function _audioInjectUltrasonic(samples, sampleRate, payload) {
  // FSK: bit 0 = 18000Hz, bit 1 = 19500Hz
  var bits = _audioPayloadToBits(payload);
  var samplesPerBit = Math.floor(sampleRate / 600);
  var amplitude = 0.02;
  var out = new Float32Array(samples.length);
  out.set(samples);
  for (var i = 0; i < bits.length; i++) {
    var freq = bits[i] === 1 ? 19500 : 18000;
    var start = i * samplesPerBit;
    for (var s = 0; s < samplesPerBit && (start + s) < out.length; s++) {
      var t = s / sampleRate;
      out[start + s] += amplitude * Math.sin(2 * Math.PI * freq * t);
    }
  }
  return out;
}

function _audioInjectLSB(samples, bitDepth, payload) {
  var bits = _audioPayloadToBits(payload);
  var maxVal = (1 << (bitDepth - 1)) - 1;
  var out = new Float32Array(samples.length);
  out.set(samples);
  for (var i = 0; i < bits.length && i < out.length; i++) {
    var intVal = Math.round(out[i] * maxVal);
    intVal = (intVal & ~1) | bits[i];
    out[i] = intVal / maxVal;
  }
  return out;
}

function _audioInjectDualChannel(leftSamples, sampleRate, payload) {
  // Returns {left, right} Float32Arrays
  var bits = _audioPayloadToBits(payload);
  var samplesPerBit = Math.floor(sampleRate / 300);
  var right = new Float32Array(leftSamples.length);
  var amplitude = 0.05;
  for (var i = 0; i < bits.length; i++) {
    var freq = bits[i] === 1 ? 1200 : 800;
    var start = i * samplesPerBit;
    for (var s = 0; s < samplesPerBit && (start + s) < right.length; s++) {
      var t = s / sampleRate;
      right[start + s] = amplitude * Math.sin(2 * Math.PI * freq * t);
    }
  }
  return { left: leftSamples, right: right };
}

function _audioInjectSubaudible(samples, sampleRate, payload) {
  var bits = _audioPayloadToBits(payload);
  var samplesPerBit = Math.floor(sampleRate / 200);
  var amplitude = 0.005;
  var out = new Float32Array(samples.length);
  out.set(samples);
  for (var i = 0; i < bits.length; i++) {
    var freq = bits[i] === 1 ? 180 : 120;
    var start = i * samplesPerBit;
    for (var s = 0; s < samplesPerBit && (start + s) < out.length; s++) {
      var t = s / sampleRate;
      var env = 0.5 * (1 - Math.cos(2 * Math.PI * s / samplesPerBit));
      out[start + s] += amplitude * env * Math.sin(2 * Math.PI * freq * t);
    }
  }
  return out;
}

function _audioInjectSpectrogram(samples, sampleRate, payload) {
  // Write text as frequency-domain patterns in 4-20kHz band
  var out = new Float32Array(samples.length);
  out.set(samples);
  var text = payload.toUpperCase();
  var charWidth = Math.floor(out.length / Math.max(text.length, 1));
  var amplitude = 0.015;
  var minFreq = 4000;
  var maxFreq = 18000;

  for (var ci = 0; ci < text.length; ci++) {
    var code = text.charCodeAt(ci);
    if (code < 32 || code > 126) code = 32;
    var norm = (code - 32) / 94;
    // Each char becomes a set of frequency bands
    var centerFreq = minFreq + norm * (maxFreq - minFreq);
    var start = ci * charWidth;
    for (var s = 0; s < charWidth && (start + s) < out.length; s++) {
      var t = s / sampleRate;
      // Main frequency line for the character
      out[start + s] += amplitude * Math.sin(2 * Math.PI * centerFreq * t);
      // Add harmonic for thickness
      out[start + s] += amplitude * 0.5 * Math.sin(2 * Math.PI * (centerFreq + 200) * t);
      // Add second line based on bit pattern for visual distinction
      var bits3 = (code >> 3) & 7;
      var secondFreq = minFreq + (bits3 / 7) * (maxFreq - minFreq) * 0.5 + 2000;
      out[start + s] += amplitude * 0.3 * Math.sin(2 * Math.PI * secondFreq * t);
    }
  }
  return out;
}

/* ================================================================
   7. WAV FILE BUILDING
   ================================================================ */

function _audioBuildWAV(opts) {
  // opts: { samples (Float32Array or {left,right}), sampleRate, bitDepth, channels,
  //         infoChunks, extraChunks, riffPad }
  var sampleRate = opts.sampleRate;
  var bitDepth = opts.bitDepth;
  var channels = opts.channels;
  var bytesPerSample = bitDepth / 8;
  var isStereo = channels === 2;
  var left, right, numSamples;

  if (isStereo && opts.samples.left) {
    left = opts.samples.left;
    right = opts.samples.right;
    numSamples = left.length;
  } else if (isStereo) {
    left = opts.samples;
    right = new Float32Array(opts.samples.length);
    numSamples = left.length;
  } else {
    left = (opts.samples.left) ? opts.samples.left : opts.samples;
    right = null;
    numSamples = left.length;
  }

  // Build metadata (INFO LIST) chunk
  var infoChunks = opts.infoChunks || [];
  var extraChunks = opts.extraChunks || [];
  var infoListData = null;
  var infoListSize = 0;

  if (infoChunks.length > 0) {
    // Calculate INFO list size: 4 (INFO) + sum of (8 + padded data size) per chunk
    infoListSize = 4;
    for (var ic = 0; ic < infoChunks.length; ic++) {
      var dLen = infoChunks[ic].data.length;
      infoListSize += 8 + dLen + (dLen % 2); // pad to even
    }
  }

  // Calculate extra chunk sizes
  var extraSize = 0;
  for (var ec = 0; ec < extraChunks.length; ec++) {
    var ecLen = extraChunks[ec].data.length;
    extraSize += 8 + ecLen + (ecLen % 2);
  }

  // RIFF padding
  var padSize = 0;
  if (opts.riffPad) padSize = 512;

  // Data chunk
  var dataSize = numSamples * channels * bytesPerSample;
  var fmtSize = 16;

  // Total RIFF size
  var listChunkSize = infoListSize > 0 ? (8 + infoListSize) : 0;
  var riffSize = 4 + (8 + fmtSize) + listChunkSize + extraSize +
    (padSize > 0 ? 8 + padSize : 0) + (8 + dataSize);

  var bufSize = 8 + riffSize;
  var buf = new ArrayBuffer(bufSize);
  var view = new DataView(buf);
  var offset = 0;

  function writeStr(str) {
    for (var i = 0; i < str.length; i++) {
      view.setUint8(offset++, str.charCodeAt(i));
    }
  }

  function writeU32(val) { view.setUint32(offset, val, true); offset += 4; }
  function writeU16(val) { view.setUint16(offset, val, true); offset += 2; }

  // RIFF header
  writeStr('RIFF');
  writeU32(riffSize);
  writeStr('WAVE');

  // fmt chunk
  writeStr('fmt ');
  writeU32(fmtSize);
  writeU16(1); // PCM
  writeU16(channels);
  writeU32(sampleRate);
  writeU32(sampleRate * channels * bytesPerSample); // byte rate
  writeU16(channels * bytesPerSample); // block align
  writeU16(bitDepth);

  // INFO LIST chunk
  if (infoListSize > 0) {
    writeStr('LIST');
    writeU32(infoListSize);
    writeStr('INFO');
    for (var ic2 = 0; ic2 < infoChunks.length; ic2++) {
      writeStr(infoChunks[ic2].id);
      var d = infoChunks[ic2].data;
      writeU32(d.length);
      for (var j = 0; j < d.length; j++) {
        view.setUint8(offset++, d[j]);
      }
      if (d.length % 2) view.setUint8(offset++, 0); // pad
    }
  }

  // Extra chunks (BEXT, iXML, custom)
  for (var ec2 = 0; ec2 < extraChunks.length; ec2++) {
    var chunk = extraChunks[ec2];
    writeStr(chunk.id);
    writeU32(chunk.data.length);
    for (var k = 0; k < chunk.data.length; k++) {
      view.setUint8(offset++, chunk.data[k]);
    }
    if (chunk.data.length % 2) view.setUint8(offset++, 0);
  }

  // RIFF padding chunk
  if (padSize > 0) {
    writeStr('JUNK');
    writeU32(padSize);
    var enc = new TextEncoder();
    var padPayload = enc.encode('PAD:' + (opts.padPayload || ''));
    for (var p = 0; p < padSize; p++) {
      view.setUint8(offset++, p < padPayload.length ? padPayload[p] : 0);
    }
  }

  // data chunk
  writeStr('data');
  writeU32(dataSize);

  var maxVal8 = 127;
  var maxVal16 = 32767;
  var maxVal24 = 8388607;

  for (var s = 0; s < numSamples; s++) {
    var chans = isStereo ? [left[s] || 0, right ? (right[s] || 0) : 0] : [left[s] || 0];
    for (var ch = 0; ch < channels; ch++) {
      var val = Math.max(-1, Math.min(1, chans[ch]));
      if (bitDepth === 8) {
        view.setUint8(offset++, Math.round((val + 1) * 0.5 * 255));
      } else if (bitDepth === 16) {
        view.setInt16(offset, Math.round(val * maxVal16), true);
        offset += 2;
      } else if (bitDepth === 24) {
        var intVal24 = Math.round(val * maxVal24);
        view.setUint8(offset++, intVal24 & 0xFF);
        view.setUint8(offset++, (intVal24 >> 8) & 0xFF);
        view.setUint8(offset++, (intVal24 >> 16) & 0xFF);
      }
    }
  }

  return new Blob([buf], { type: 'audio/wav' });
}

/* ================================================================
   8. MAIN GENERATE FUNCTION
   ================================================================ */

function audioGenerate() {
  var payload = (document.getElementById('audioPayload').value || '').trim();
  if (!payload) {
    ss('audioSt', 'err', 'Enter an injection payload first');
    return;
  }

  var sampleRate = parseInt(document.getElementById('audioSampleRate').value, 10);
  var bitDepth = parseInt(document.getElementById('audioBitDepth').value, 10);
  var channels = parseInt(document.getElementById('audioChannels').value, 10);
  var repeat = parseInt(document.getElementById('audioRepeat').value, 10);
  var filename = document.getElementById('audioFilename').value || 'audio_recording_001.wav';
  var riffPad = document.getElementById('audioRiffPad').checked;
  var canary = document.getElementById('audioCanary').checked;

  // Techniques
  var useMetadata = document.getElementById('aud_metadata').checked;
  var useUltrasonic = document.getElementById('aud_ultrasonic').checked;
  var useLSB = document.getElementById('aud_lsb').checked;
  var useDualChannel = document.getElementById('aud_dual_channel').checked && channels === 2;
  var useSubaudible = document.getElementById('aud_subaudible').checked;
  var useSpectrogram = document.getElementById('aud_spectrogram').checked;
  var useExtendedMeta = document.getElementById('aud_extended_meta').checked;

  // Repeat payload
  var fullPayload = payload;
  if (repeat > 1) {
    var parts = [];
    for (var r = 0; r < repeat; r++) parts.push(payload);
    fullPayload = parts.join(' ');
  }
  if (canary) {
    var canaryToken = 'CANARY-' + Date.now().toString(36).toUpperCase();
    fullPayload += ' [CANARY:' + canaryToken + ']';
  }

  // Get or generate cover audio
  var duration = parseInt(document.getElementById('audioDuration').value, 10);
  var numSamples;
  var samples;

  if (_audioCoverPCM) {
    // Resample uploaded cover to target sample rate if different
    if (_audioCoverRate !== sampleRate) {
      var ratio = sampleRate / _audioCoverRate;
      numSamples = Math.floor(_audioCoverPCM.length * ratio);
      samples = new Float32Array(numSamples);
      for (var i = 0; i < numSamples; i++) {
        var srcIdx = i / ratio;
        var idx0 = Math.floor(srcIdx);
        var idx1 = Math.min(idx0 + 1, _audioCoverPCM.length - 1);
        var frac = srcIdx - idx0;
        samples[i] = _audioCoverPCM[idx0] * (1 - frac) + _audioCoverPCM[idx1] * frac;
      }
    } else {
      numSamples = _audioCoverPCM.length;
      samples = new Float32Array(numSamples);
      samples.set(_audioCoverPCM);
    }
  } else {
    var coverType = document.getElementById('audioCover').value;
    numSamples = sampleRate * duration;
    samples = _audioGenSynth(coverType, numSamples, sampleRate);
  }

  // Apply injection techniques to samples
  var techniques = [];

  if (useUltrasonic) {
    samples = _audioInjectUltrasonic(samples, sampleRate, fullPayload);
    techniques.push('Ultrasonic FSK');
  }
  if (useLSB) {
    samples = _audioInjectLSB(samples, bitDepth, fullPayload);
    techniques.push('LSB Steganography');
  }
  if (useSubaudible) {
    samples = _audioInjectSubaudible(samples, sampleRate, fullPayload);
    techniques.push('Sub-audible Layer');
  }
  if (useSpectrogram) {
    samples = _audioInjectSpectrogram(samples, sampleRate, fullPayload);
    techniques.push('Spectrogram Text');
  }

  // Dual channel handling
  var finalSamples;
  if (useDualChannel) {
    finalSamples = _audioInjectDualChannel(samples, sampleRate, fullPayload);
    techniques.push('Dual-Channel');
  } else if (channels === 2) {
    finalSamples = { left: samples, right: new Float32Array(samples) };
  } else {
    finalSamples = samples;
  }

  // Metadata chunks
  var infoChunks = [];
  var extraChunks = [];

  if (useMetadata) {
    infoChunks = _audioInjectMetadata(fullPayload);
    techniques.push('RIFF INFO Metadata');
  }
  if (useExtendedMeta) {
    extraChunks = _audioInjectExtendedMeta(fullPayload);
    techniques.push('Extended Metadata (BEXT/iXML)');
  }

  // Build WAV
  var blob = _audioBuildWAV({
    samples: finalSamples,
    sampleRate: sampleRate,
    bitDepth: bitDepth,
    channels: channels,
    infoChunks: infoChunks,
    extraChunks: extraChunks,
    riffPad: riffPad,
    padPayload: riffPad ? fullPayload : ''
  });

  // Store for playback
  _audioGenBuf = samples;
  _audioGenRate = sampleRate;

  // Render previews
  _audioRenderWaveform(samples, 'audioWaveform');
  _audioRenderSpectrogram(samples, sampleRate, 'audioSpectrogram');

  // Download
  dl(blob, filename);
  gC++;
  var cGEl = document.getElementById('cG');
  if (cGEl) cGEl.textContent = gC;

  var techStr = techniques.length > 0 ? techniques.join(', ') : 'None';
  ss('audioSt', 'ok', filename + ' generated (' + (blob.size / 1024).toFixed(1) +
    ' KB) | Techniques: ' + techStr);
}

/* ================================================================
   9. PLAYBACK
   ================================================================ */

function audioPlayToggle() {
  if (_audioIsPlaying) {
    if (_audioPlaySrc) {
      _audioPlaySrc.stop();
      _audioPlaySrc = null;
    }
    _audioIsPlaying = false;
    document.getElementById('audioPlayBtn').innerHTML = '&#x25B6; Play Preview';
    return;
  }

  if (!_audioGenBuf) {
    toast('Generate audio first', 'warn');
    return;
  }

  _audioPlayCtx = _audioPlayCtx || new (window.AudioContext || window.webkitAudioContext)();
  
  // Browsers require resume() after user gesture if context was suspended
  if (_audioPlayCtx.state === 'suspended') {
    _audioPlayCtx.resume();
  }

  var abuf = _audioPlayCtx.createBuffer(1, _audioGenBuf.length, _audioGenRate);
  abuf.getChannelData(0).set(_audioGenBuf);
  _audioPlaySrc = _audioPlayCtx.createBufferSource();
  _audioPlaySrc.buffer = abuf;
  _audioPlaySrc.connect(_audioPlayCtx.destination);
  _audioPlaySrc.onended = function() {
    _audioIsPlaying = false;
    document.getElementById('audioPlayBtn').innerHTML = '&#x25B6; Play Preview';
  };
  _audioPlaySrc.start();
  _audioIsPlaying = true;
  document.getElementById('audioPlayBtn').innerHTML = '&#x23F9; Stop';
}

function audioPlayCover() {
  if (!_audioCoverPCM) {
    toast('No cover audio to play', 'warn');
    return;
  }
  
  var ctx = new (window.AudioContext || window.webkitAudioContext)();
  var abuf = ctx.createBuffer(1, _audioCoverPCM.length, _audioCoverRate);
  abuf.getChannelData(0).set(_audioCoverPCM);
  var src = ctx.createBufferSource();
  src.buffer = abuf;
  src.connect(ctx.destination);
  src.start();
  toast('Playing cover audio...', 'info');
  src.onended = function() { ctx.close(); };
}

/* ================================================================
   10. WAVEFORM VISUALIZATION
   ================================================================ */

function _audioRenderWaveform(samples, canvasId) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#05050a';
  ctx.fillRect(0, 0, w, h);

  if (!samples || samples.length === 0) return;

  var step = Math.max(1, Math.floor(samples.length / w));
  var mid = h / 2;

  // Draw zero line
  ctx.strokeStyle = '#0a2a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, mid);
  ctx.lineTo(w, mid);
  ctx.stroke();

  // Draw waveform
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (var x = 0; x < w; x++) {
    var idx = x * step;
    var minVal = 1, maxVal = -1;
    for (var s = 0; s < step && (idx + s) < samples.length; s++) {
      var val = samples[idx + s];
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }
    var y1 = mid - maxVal * mid;
    var y2 = mid - minVal * mid;
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
  }
  ctx.stroke();
}

/* ================================================================
   11. SPECTROGRAM VISUALIZATION (windowed DFT)
   ================================================================ */

function _audioRenderSpectrogram(samples, sampleRate, canvasId) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#05050a';
  ctx.fillRect(0, 0, w, h);

  if (!samples || samples.length === 0) return;

  var windowSize = 256;
  var numBins = windowSize / 2;
  var hopSize = Math.max(1, Math.floor(samples.length / w));
  var imgData = ctx.createImageData(w, h);

  for (var x = 0; x < w; x++) {
    var start = x * hopSize;
    // Compute DFT magnitudes for this window
    var mags = new Float32Array(numBins);
    var maxMag = 0;

    for (var k = 0; k < numBins; k++) {
      var re = 0, im = 0;
      for (var n = 0; n < windowSize; n++) {
        var si = start + n;
        var val = si < samples.length ? samples[si] : 0;
        // Hann window
        var win = 0.5 * (1 - Math.cos(2 * Math.PI * n / (windowSize - 1)));
        var angle = 2 * Math.PI * k * n / windowSize;
        re += val * win * Math.cos(angle);
        im -= val * win * Math.sin(angle);
      }
      mags[k] = Math.sqrt(re * re + im * im);
      if (mags[k] > maxMag) maxMag = mags[k];
    }

    // Map bins to pixel rows (bottom = low freq, top = high freq)
    for (var y = 0; y < h; y++) {
      var binIdx = Math.floor((1 - y / h) * numBins);
      if (binIdx >= numBins) binIdx = numBins - 1;
      var intensity = maxMag > 0 ? mags[binIdx] / maxMag : 0;
      // Log scale for better visibility
      intensity = Math.log1p(intensity * 10) / Math.log1p(10);
      intensity = Math.min(1, Math.max(0, intensity));

      var pixIdx = (y * w + x) * 4;
      // Color map: dark blue -> cyan -> yellow -> white
      if (intensity < 0.33) {
        var t = intensity / 0.33;
        imgData.data[pixIdx] = 0;
        imgData.data[pixIdx + 1] = Math.round(t * 100);
        imgData.data[pixIdx + 2] = Math.round(50 + t * 150);
      } else if (intensity < 0.66) {
        var t2 = (intensity - 0.33) / 0.33;
        imgData.data[pixIdx] = Math.round(t2 * 255);
        imgData.data[pixIdx + 1] = Math.round(100 + t2 * 155);
        imgData.data[pixIdx + 2] = Math.round(200 - t2 * 200);
      } else {
        var t3 = (intensity - 0.66) / 0.34;
        imgData.data[pixIdx] = 255;
        imgData.data[pixIdx + 1] = 255;
        imgData.data[pixIdx + 2] = Math.round(t3 * 255);
      }
      imgData.data[pixIdx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

/* ================================================================
   12. COPY PAYLOAD INFO
   ================================================================ */

function audioCopyPayloadInfo() {
  var payload = (document.getElementById('audioPayload').value || '').trim();
  if (!payload) {
    toast('No payload to copy', 'warn');
    return;
  }
  var sampleRate = document.getElementById('audioSampleRate').value;
  var bitDepth = document.getElementById('audioBitDepth').value;
  var channels = document.getElementById('audioChannels').value;
  var repeat = document.getElementById('audioRepeat').value;
  var filename = document.getElementById('audioFilename').value;

  var techs = [];
  if (document.getElementById('aud_metadata').checked) techs.push('RIFF INFO Metadata');
  if (document.getElementById('aud_ultrasonic').checked) techs.push('Ultrasonic FSK');
  if (document.getElementById('aud_lsb').checked) techs.push('LSB Steganography');
  if (document.getElementById('aud_dual_channel').checked) techs.push('Dual-Channel');
  if (document.getElementById('aud_subaudible').checked) techs.push('Sub-audible Layer');
  if (document.getElementById('aud_spectrogram').checked) techs.push('Spectrogram Text');
  if (document.getElementById('aud_extended_meta').checked) techs.push('Extended Metadata');

  var info = [
    '=== PromptStrike Audio Stego Report ===',
    'Filename: ' + filename,
    'Sample Rate: ' + sampleRate + ' Hz',
    'Bit Depth: ' + bitDepth + '-bit',
    'Channels: ' + (channels === '2' ? 'Stereo' : 'Mono'),
    'Repeat: ' + repeat + 'x',
    'Techniques: ' + (techs.length > 0 ? techs.join(', ') : 'None'),
    '',
    'Payload:',
    payload
  ].join('\n');

  navigator.clipboard.writeText(info).then(function() {
    toast('Payload info copied to clipboard', 'ok');
  }).catch(function() {
    toast('Clipboard write failed', 'err');
  });
}

/* ================================================================
   13. PRESETS
   ================================================================ */

function _audioApplyPreset(checks) {
  var ids = ['aud_metadata', 'aud_ultrasonic', 'aud_lsb', 'aud_dual_channel',
    'aud_subaudible', 'aud_spectrogram', 'aud_extended_meta'];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) el.checked = checks.indexOf(ids[i]) !== -1;
  }
  toast('Preset applied', 'ok');
}

function _audioRenderPresets() {
  var container = document.getElementById('audioPresets');
  if (!container) return;

  var presets = [
    { name: 'Metadata Only (Safest)', ids: ['aud_metadata'] },
    { name: 'Full Stealth', ids: ['aud_metadata', 'aud_lsb', 'aud_extended_meta'] },
    { name: 'Ultrasonic Attack', ids: ['aud_ultrasonic', 'aud_metadata'] },
    { name: 'Spectrogram Hidden', ids: ['aud_spectrogram', 'aud_metadata'] },
    {
      name: 'Maximum Payload',
      ids: ['aud_metadata', 'aud_ultrasonic', 'aud_lsb', 'aud_dual_channel',
        'aud_subaudible', 'aud_spectrogram', 'aud_extended_meta']
    }
  ];

  container.innerHTML = '';
  for (var i = 0; i < presets.length; i++) {
    var btn = document.createElement('button');
    btn.className = 'btn bS';
    btn.style.fontSize = '.68rem';
    btn.style.flex = '0';
    btn.textContent = presets[i].name;
    btn.setAttribute('data-preset', i);
    btn.onclick = (function(ids) {
      return function() { _audioApplyPreset(ids); };
    })(presets[i].ids);
    container.appendChild(btn);
  }
}

/* ================================================================
   14. DURATION LABEL SYNC
   ================================================================ */

function _audioInitDurationSync() {
  var slider = document.getElementById('audioDuration');
  var label = document.getElementById('audioDurationV');
  if (slider && label) {
    slider.addEventListener('input', function() {
      safeText(label, this.value + 's');
    });
  }
}

/* ================================================================
   15. BATCH GENERATION (for batch module)
   ================================================================ */

function batchAudioGen(fn, payload) {
  return new Promise(function(resolve) {
    var sampleRate = 44100;
    var bitDepth = 16;
    var channels = 1;
    var numSamples = sampleRate * 3;
    var samples = _audioGenSynth('tone', numSamples, sampleRate);

    samples = _audioInjectLSB(samples, bitDepth, payload);
    var infoChunks = _audioInjectMetadata(payload);

    var blob = _audioBuildWAV({
      samples: samples,
      sampleRate: sampleRate,
      bitDepth: bitDepth,
      channels: channels,
      infoChunks: infoChunks,
      extraChunks: [],
      riffPad: false,
      padPayload: ''
    });

    dl(blob, fn);
    gC++;
    var cGEl = document.getElementById('cG');
    if (cGEl) cGEl.textContent = gC;
    resolve();
  });
}

/* ================================================================
   16. TAB INIT (called from showP on first visit)
   ================================================================ */

function initAudioTab() {
  _audioRenderPresets();
  _audioInitDurationSync();
  audioUpdateDualChannel();

  // Populate payload dropdown
  var sel = document.getElementById('audioPayloadDD');
  if (sel && sel.options.length <= 1) {
    for (var i = 0; i < P.length; i++) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = P[i].id + ' [' + P[i].c + '] ' + P[i].s;
      sel.appendChild(opt);
    }
  }
}
