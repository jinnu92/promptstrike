/* ── Vision Steganography Module ── */

var _vsOriginalImageData = null;
var _vsStegoImageData = null;
var _vsTechniquesUsed = [];

/* ── Payload Encoding ── */

function _vsEncodePayload(text, encoding) {
  if (!text) return '';
  switch (encoding) {
    case 'base64': return btoa(unescape(encodeURIComponent(text)));
    case 'xor':
      var out = '';
      for (var i = 0; i < text.length; i++) {
        out += String.fromCharCode(text.charCodeAt(i) ^ 0xA5);
      }
      return out;
    case 'binary':
      return _vsTextToBits(text).join('');
    default: return text;
  }
}

function _vsTextToBits(text) {
  var bits = [];
  var bytes = new TextEncoder().encode(text);
  for (var i = 0; i < bytes.length; i++) {
    for (var b = 7; b >= 0; b--) {
      bits.push((bytes[i] >> b) & 1);
    }
  }
  return bits;
}

/* ── Init ── */

function initVisionStegoTab() {
  var sel = document.getElementById('vs_payload_sel');
  if (sel) {
    sel.innerHTML = '<option value="">-- Select payload --</option>';
    P.forEach(function(p, i) {
      var o = document.createElement('option');
      o.value = i;
      o.textContent = p.id + ' [' + p.c + '] (' + p.s + ')';
      sel.appendChild(o);
    });
  }
  _vsRenderPresets();
  var stats = document.getElementById('vs_stats');
  if (stats) stats.textContent = 'No cover image loaded. Generate or upload one.';
}

function _vsRenderPresets() {
  var container = document.getElementById('vs_presets');
  if (!container) return;
  var presets = [
    { name: 'Subtle LSB', desc: 'LSB-1 + Alpha + PNG tEXt', checks: ['vs_lsb1','vs_alpha','vs_png_text'] },
    { name: 'OCR Attack', desc: 'Zero-opacity + Micro-font + Rotated', checks: ['vs_zero_opacity','vs_micro_font','vs_rotated'] },
    { name: 'VLM Adversarial', desc: 'FGSM + Attention + HF Noise', checks: ['vs_fgsm','vs_attention','vs_hf_noise'] },
    { name: 'Deep Embed', desc: 'DCT + DWT + PVD + Phase Shift', checks: ['vs_dct','vs_dwt','vs_pvd','vs_phase_shift'] },
    { name: 'Max Stealth', desc: 'Adaptive LSB + Alpha + Steg Color', checks: ['vs_lsb_adaptive','vs_alpha','vs_steg_color'] },
    { name: 'Kitchen Sink', desc: 'All techniques enabled', checks: ['vs_lsb1','vs_lsb_adaptive','vs_pvd','vs_dct','vs_dwt','vs_fgsm','vs_attention','vs_png_text','vs_exif','vs_icc','vs_alpha','vs_zero_opacity','vs_micro_font','vs_rotated','vs_steg_color','vs_artprompt','vs_hf_noise','vs_phase_shift'] }
  ];
  container.innerHTML = '';
  presets.forEach(function(pr) {
    var btn = document.createElement('button');
    btn.className = 'btn bS';
    btn.style.cssText = 'font-size:.68rem;flex:0';
    btn.textContent = pr.name;
    btn.title = pr.desc;
    btn.onclick = function() {
      var all = ['vs_lsb1','vs_lsb_adaptive','vs_pvd','vs_dct','vs_dwt','vs_fgsm','vs_attention','vs_png_text','vs_exif','vs_icc','vs_alpha','vs_zero_opacity','vs_micro_font','vs_rotated','vs_steg_color','vs_artprompt','vs_hf_noise','vs_phase_shift'];
      all.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.checked = pr.checks.indexOf(id) !== -1;
      });
      toast('Preset "' + pr.name + '" applied: ' + pr.desc, 'ok');
    };
    container.appendChild(btn);
  });
}

/* ── Synthetic Cover Generation ── */

function vsGenerateSyntheticCover() {
  var cv = document.getElementById('vs_preview');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var domKey = document.getElementById('vs_domain').value || 'medical';
  var d = D[domKey];
  if (!d) { toast('Unknown domain: ' + domKey, 'err'); return; }
  var cl = d.cl || [0, 71, 143];
  var W = cv.width, H = cv.height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgb(' + cl[0] + ',' + cl[1] + ',' + cl[2] + ')';
  ctx.fillRect(0, 0, W, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(d.h, W / 2, 42);
  ctx.font = '10px Arial, sans-serif';
  ctx.fillText('CONFIDENTIAL - For Authorized Personnel Only', W / 2, 60);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgb(' + cl[0] + ',' + cl[1] + ',' + cl[2] + ')';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText(d.t, 40, 105);

  ctx.strokeStyle = 'rgb(' + cl[0] + ',' + cl[1] + ',' + cl[2] + ')';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 112); ctx.lineTo(W - 40, 112); ctx.stroke();

  ctx.fillStyle = '#333333';
  ctx.font = '12px Courier New, monospace';
  var lines = d.c.split('\n');
  lines.forEach(function(line, i) {
    var parts = line.split(' | ');
    parts.forEach(function(part, j) {
      ctx.fillText(part.trim(), 40, 140 + (i * parts.length + j) * 20);
    });
  });

  var tableRows = _vsGenerateTableRows(domKey);
  var tableY = 240;
  ctx.fillStyle = 'rgb(' + cl[0] + ',' + cl[1] + ',' + cl[2] + ')';
  ctx.fillRect(40, tableY, W - 80, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Arial, sans-serif';
  tableRows.headers.forEach(function(hdr, i) {
    ctx.fillText(hdr, 50 + i * 150, tableY + 16);
  });

  ctx.font = '11px Courier New, monospace';
  tableRows.rows.forEach(function(row, ri) {
    var rowY = tableY + 24 + ri * 22;
    ctx.fillStyle = ri % 2 === 0 ? '#f4f8fc' : '#ffffff';
    ctx.fillRect(40, rowY, W - 80, 22);
    ctx.fillStyle = '#222222';
    row.forEach(function(cell, ci) {
      ctx.fillText(cell, 50 + ci * 150, rowY + 15);
    });
  });

  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(40, tableY, W - 80, 24 + tableRows.rows.length * 22);

  var footerY = H - 40;
  ctx.fillStyle = '#999999';
  ctx.font = '9px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Generated by PromptStrike v7.0 | Document ID: DOC-' + Date.now().toString(36).toUpperCase(), W / 2, footerY);
  ctx.fillText('Page 1 of 1 | Printed: ' + new Date().toISOString().split('T')[0], W / 2, footerY + 14);
  ctx.textAlign = 'left';

  _vsOriginalImageData = ctx.getImageData(0, 0, W, H);
  _vsStegoImageData = null;
  _vsTechniquesUsed = [];

  var stats = document.getElementById('vs_stats');
  if (stats) stats.textContent = 'Synthetic ' + domKey + ' cover loaded (' + W + 'x' + H + ', ' + (W * H * 4) + ' bytes)';
  toast('Synthetic ' + domKey + ' cover generated', 'ok');
}

function _vsGenerateTableRows(domKey) {
  var tables = {
    medical: {
      headers: ['Test', 'Result', 'Reference', 'Status'],
      rows: [
        ['Hemoglobin', '14.2 g/dL', '12.0-17.5', 'Normal'],
        ['WBC Count', '7,500 /uL', '4,500-11,000', 'Normal'],
        ['Platelets', '250,000 /uL', '150,000-400,000', 'Normal'],
        ['RBC Count', '5.1 M/uL', '4.5-5.9', 'Normal'],
        ['Hematocrit', '42.5%', '38.3-48.6', 'Normal'],
        ['MCV', '83.3 fL', '80.0-96.0', 'Normal'],
        ['Glucose', '95 mg/dL', '70-100', 'Normal'],
        ['Creatinine', '1.0 mg/dL', '0.7-1.3', 'Normal'],
        ['TSH', '2.5 mIU/L', '0.5-4.5', 'Normal'],
        ['Cholesterol', '195 mg/dL', '<200', 'Normal']
      ]
    },
    legal: {
      headers: ['Item', 'Description', 'Status', 'Priority'],
      rows: [
        ['Motion 1', 'Summary Judgment', 'Filed', 'High'],
        ['Discovery', 'Document Production', 'In Progress', 'High'],
        ['Deposition', 'Key Witness #1', 'Scheduled', 'Medium'],
        ['Expert Report', 'Financial Analysis', 'Pending', 'High'],
        ['Mediation', 'Settlement Conference', 'Proposed', 'Medium'],
        ['Brief', 'Opposition Reply', 'Drafting', 'High'],
        ['Exhibit A', 'Contract Agreement', 'Authenticated', 'High'],
        ['Exhibit B', 'Email Correspondence', 'Under Review', 'Medium']
      ]
    },
    finance: {
      headers: ['Metric', 'Q4 2025', 'Q3 2025', 'Change'],
      rows: [
        ['Revenue', '$14.2M', '$12.8M', '+10.9%'],
        ['Net Income', '$2.1M', '$1.8M', '+16.7%'],
        ['EBITDA', '$2.6M', '$2.3M', '+13.0%'],
        ['OpEx', '$11.6M', '$10.5M', '+10.5%'],
        ['Cash Flow', '$3.2M', '$2.9M', '+10.3%'],
        ['Debt Ratio', '0.35', '0.38', '-7.9%'],
        ['ROE', '18.5%', '16.2%', '+14.2%'],
        ['EPS', '$2.45', '$2.10', '+16.7%']
      ]
    },
    hr: {
      headers: ['Category', 'Score', 'Weight', 'Weighted'],
      rows: [
        ['Technical Skills', '4.5/5', '25%', '1.125'],
        ['Communication', '4.0/5', '20%', '0.800'],
        ['Leadership', '3.8/5', '15%', '0.570'],
        ['Initiative', '4.2/5', '15%', '0.630'],
        ['Teamwork', '4.5/5', '15%', '0.675'],
        ['Attendance', '5.0/5', '10%', '0.500'],
        ['Overall', '4.3/5', '100%', '4.300']
      ]
    },
    education: {
      headers: ['Course', 'Credits', 'Grade', 'Points'],
      rows: [
        ['CS 401 - Algorithms', '4', 'A', '4.00'],
        ['CS 440 - AI/ML', '3', 'A-', '3.70'],
        ['CS 461 - Databases', '3', 'A', '4.00'],
        ['MATH 301 - Linear Alg', '3', 'B+', '3.30'],
        ['CS 480 - Networks', '3', 'A', '4.00'],
        ['CS 499 - Capstone', '4', 'A', '4.00'],
        ['ENG 200 - Tech Writing', '3', 'A-', '3.70']
      ]
    },
    insurance: {
      headers: ['Item', 'Description', 'Amount', 'Status'],
      rows: [
        ['Structural', 'Roof Damage', '$18,500', 'Approved'],
        ['Water Damage', 'Interior Flooding', '$12,000', 'Under Review'],
        ['Personal Prop.', 'Electronics', '$8,500', 'Approved'],
        ['Temporary Housing', '30 days @ $150', '$4,500', 'Approved'],
        ['Deductible', 'Policy deductible', '-$1,500', 'Applied'],
        ['Depreciation', 'Wear adjustment', '-$3,200', 'Calculated'],
        ['Total Estimate', 'Pending final', '$38,800', 'Processing']
      ]
    }
  };
  return tables[domKey] || tables.medical;
}

/* ── Load Cover Image ── */

function vsLoadCoverImage(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var cv = document.getElementById('vs_preview');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var img = new Image();
  img.onload = function() {
    cv.width = img.width;
    cv.height = img.height;
    ctx.drawImage(img, 0, 0);
    _vsOriginalImageData = ctx.getImageData(0, 0, cv.width, cv.height);
    _vsStegoImageData = null;
    _vsTechniquesUsed = [];
    var stats = document.getElementById('vs_stats');
    if (stats) stats.textContent = 'Uploaded: ' + file.name + ' (' + img.width + 'x' + img.height + ')';
    toast('Cover image loaded: ' + file.name, 'ok');
    URL.revokeObjectURL(img.src);
  };
  img.onerror = function() {
    toast('Failed to load image', 'err');
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
}

/* ── Main Generate ── */

function vsGenerate() {
  var cv = document.getElementById('vs_preview');
  if (!cv) return;
  var ctx = cv.getContext('2d');

  if (!_vsOriginalImageData) {
    vsGenerateSyntheticCover();
    _vsOriginalImageData = ctx.getImageData(0, 0, cv.width, cv.height);
  }

  var payloadText = document.getElementById('vs_payload_text').value;
  if (!payloadText) {
    ss('vsSt', 'err', 'No payload text provided');
    return;
  }

  var encoding = document.getElementById('vs_encoding').value;
  var encoded = _vsEncodePayload(payloadText, encoding);
  var bits = _vsTextToBits(encoded);

  ctx.putImageData(_vsOriginalImageData, 0, 0);
  var imgData = ctx.getImageData(0, 0, cv.width, cv.height);
  var d = imgData.data;
  var W = cv.width, H = cv.height;
  _vsTechniquesUsed = [];

  var useR = chk('vs_lsb_r');
  var useG = chk('vs_lsb_g');
  var useB = chk('vs_lsb_b');
  var depth = parseInt(document.getElementById('vs_lsb_depth').value) || 1;
  var channels = [];
  if (useR) channels.push(0);
  if (useG) channels.push(1);
  if (useB) channels.push(2);
  if (channels.length === 0) channels = [0, 1, 2];

  if (chk('vs_lsb1')) {
    _vsApplyLSB(d, bits, channels, depth);
    _vsTechniquesUsed.push('LSB-1 (depth=' + depth + ', ch=' + channels.length + ')');
  }

  if (chk('vs_lsb_adaptive')) {
    _vsApplyAdaptiveLSB(d, bits, W, H, channels, depth);
    _vsTechniquesUsed.push('Adaptive LSB');
  }

  if (chk('vs_pvd')) {
    _vsApplyPVD(d, bits, W, H);
    _vsTechniquesUsed.push('PVD');
  }

  if (chk('vs_dct')) {
    _vsApplyDCT(d, bits, W, H);
    _vsTechniquesUsed.push('DCT');
  }

  if (chk('vs_dwt')) {
    _vsApplyDWT(d, bits, W, H);
    _vsTechniquesUsed.push('DWT Haar');
  }

  if (chk('vs_alpha')) {
    _vsApplyAlpha(d, bits, W, H);
    _vsTechniquesUsed.push('Alpha Channel');
  }

  if (chk('vs_hf_noise')) {
    _vsApplyHFNoise(d, bits, W, H);
    _vsTechniquesUsed.push('HF Noise Pattern');
  }

  if (chk('vs_phase_shift')) {
    _vsApplyPhaseShift(d, bits, W, H);
    _vsTechniquesUsed.push('Phase Shift');
  }

  var eps = parseInt(document.getElementById('vs_epsilon').value) || 4;

  if (chk('vs_fgsm')) {
    _vsApplyFGSM(d, bits, W, H, eps);
    _vsTechniquesUsed.push('FGSM (eps=' + eps + ')');
  }

  ctx.putImageData(imgData, 0, 0);

  if (chk('vs_attention')) {
    _vsApplyAttention(ctx, payloadText, W, H);
    _vsTechniquesUsed.push('Attention Hotspot');
  }

  if (chk('vs_zero_opacity')) {
    _vsApplyZeroOpacity(ctx, payloadText, W, H);
    _vsTechniquesUsed.push('Zero-Opacity Text');
  }

  if (chk('vs_micro_font')) {
    _vsApplyMicroFont(ctx, payloadText, W, H);
    _vsTechniquesUsed.push('Micro-Font Text');
  }

  if (chk('vs_rotated')) {
    _vsApplyRotated(ctx, payloadText, W, H);
    _vsTechniquesUsed.push('Rotated Text');
  }

  if (chk('vs_steg_color')) {
    _vsApplyStegColor(ctx, payloadText, W, H);
    _vsTechniquesUsed.push('Steg Color Text');
  }

  if (chk('vs_artprompt')) {
    _vsApplyArtPrompt(ctx, payloadText, W, H);
    _vsTechniquesUsed.push('ArtPrompt ASCII');
  }

  if (chk('vs_png_text')) {
    cv.dataset.pngText = encoded;
    _vsTechniquesUsed.push('PNG tEXt');
  }

  if (chk('vs_exif')) {
    cv.dataset.exif = JSON.stringify({
      ImageDescription: encoded,
      Software: 'PromptStrike v7.0',
      Artist: encoded.substring(0, 100),
      Copyright: encoded
    });
    _vsTechniquesUsed.push('EXIF Data');
  }

  if (chk('vs_icc')) {
    cv.dataset.icc = 'ICC-PROFILE-COMMENT: ' + encoded;
    _vsTechniquesUsed.push('ICC Profile');
  }

  _vsStegoImageData = ctx.getImageData(0, 0, W, H);
  _vsRenderMetrics();

  gC++;
  var cGEl = document.getElementById('cG');
  if (cGEl) cGEl.textContent = gC;

  ss('vsSt', 'ok', 'Stego image generated with ' + _vsTechniquesUsed.length + ' technique(s)');
}

/* ── Spatial Domain Techniques ── */

function _vsApplyLSB(data, bits, channels, depth) {
  var mask = (0xFF << depth) & 0xFF;
  var bi = 0;
  for (var i = 0; i < data.length && bi < bits.length; i += 4) {
    for (var ci = 0; ci < channels.length && bi < bits.length; ci++) {
      var ch = channels[ci];
      var val = data[i + ch] & mask;
      for (var db = depth - 1; db >= 0 && bi < bits.length; db--) {
        val |= (bits[bi++] << db);
      }
      data[i + ch] = val;
    }
  }
}

function _vsApplyAdaptiveLSB(data, bits, W, H, channels, depth) {
  var edgeMap = _vsComputeEdgeMap(data, W, H);
  var mask = (0xFF << depth) & 0xFF;
  var bi = 0;

  var indices = [];
  for (var i = 0; i < edgeMap.length; i++) {
    indices.push(i);
  }
  indices.sort(function(a, b) { return edgeMap[b] - edgeMap[a]; });

  for (var idx = 0; idx < indices.length && bi < bits.length; idx++) {
    var px = indices[idx] * 4;
    var localDepth = edgeMap[indices[idx]] > 30 ? Math.min(depth + 1, 3) : depth;
    var lmask = (0xFF << localDepth) & 0xFF;
    for (var ci = 0; ci < channels.length && bi < bits.length; ci++) {
      var ch = channels[ci];
      var val = data[px + ch] & lmask;
      for (var db = localDepth - 1; db >= 0 && bi < bits.length; db--) {
        val |= (bits[bi++] << db);
      }
      data[px + ch] = val;
    }
  }
}

function _vsComputeEdgeMap(data, W, H) {
  var map = new Float32Array(W * H);
  for (var y = 1; y < H - 1; y++) {
    for (var x = 1; x < W - 1; x++) {
      var idx = (y * W + x) * 4;
      var left = (y * W + x - 1) * 4;
      var right = (y * W + x + 1) * 4;
      var top = ((y - 1) * W + x) * 4;
      var bot = ((y + 1) * W + x) * 4;
      var gx = Math.abs(data[right] - data[left]) + Math.abs(data[right + 1] - data[left + 1]) + Math.abs(data[right + 2] - data[left + 2]);
      var gy = Math.abs(data[bot] - data[top]) + Math.abs(data[bot + 1] - data[top + 1]) + Math.abs(data[bot + 2] - data[top + 2]);
      map[y * W + x] = (gx + gy) / 6;
    }
  }
  return map;
}

function _vsApplyPVD(data, bits, W, H) {
  var bi = 0;
  for (var y = 0; y < H && bi < bits.length; y++) {
    for (var x = 0; x < W - 1 && bi < bits.length; x += 2) {
      var i1 = (y * W + x) * 4;
      var i2 = (y * W + x + 1) * 4;
      var diff = Math.abs(data[i1] - data[i2]);
      var capacity = diff < 16 ? 2 : diff < 32 ? 3 : 4;
      capacity = Math.min(capacity, bits.length - bi);
      var embedVal = 0;
      for (var b = 0; b < capacity && bi < bits.length; b++) {
        embedVal = (embedVal << 1) | bits[bi++];
      }
      var newDiff = (diff & ~((1 << capacity) - 1)) | embedVal;
      var avg = Math.floor((data[i1] + data[i2]) / 2);
      data[i1] = Math.min(255, Math.max(0, avg + Math.floor(newDiff / 2)));
      data[i2] = Math.min(255, Math.max(0, avg - Math.ceil(newDiff / 2)));
    }
  }
}

/* ── Transform Domain Techniques ── */

function _vsApplyDCT(data, bits, W, H) {
  var bi = 0;
  var blockSize = 8;
  for (var by = 0; by < H - blockSize && bi < bits.length; by += blockSize) {
    for (var bx = 0; bx < W - blockSize && bi < bits.length; bx += blockSize) {
      var block = [];
      for (var r = 0; r < blockSize; r++) {
        block[r] = [];
        for (var c = 0; c < blockSize; c++) {
          var idx = ((by + r) * W + (bx + c)) * 4;
          block[r][c] = data[idx];
        }
      }
      var dct = _vsDCT2D(block, blockSize);
      if (bi < bits.length) {
        var coef = dct[4][4];
        var sign = coef >= 0 ? 1 : -1;
        var mag = Math.abs(coef);
        mag = (Math.floor(mag / 2) * 2) | bits[bi++];
        dct[4][4] = sign * mag;
      }
      if (bi < bits.length) {
        var coef2 = dct[3][5];
        var sign2 = coef2 >= 0 ? 1 : -1;
        var mag2 = Math.abs(coef2);
        mag2 = (Math.floor(mag2 / 2) * 2) | bits[bi++];
        dct[3][5] = sign2 * mag2;
      }
      var spatial = _vsIDCT2D(dct, blockSize);
      for (var r = 0; r < blockSize; r++) {
        for (var c = 0; c < blockSize; c++) {
          var idx = ((by + r) * W + (bx + c)) * 4;
          data[idx] = Math.min(255, Math.max(0, Math.round(spatial[r][c])));
        }
      }
    }
  }
}

function _vsDCT2D(block, N) {
  var out = [];
  for (var u = 0; u < N; u++) {
    out[u] = [];
    for (var v = 0; v < N; v++) {
      var sum = 0;
      var cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      var cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      for (var x = 0; x < N; x++) {
        for (var y = 0; y < N; y++) {
          sum += block[x][y] *
            Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) *
            Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
        }
      }
      out[u][v] = (2 / N) * cu * cv * sum;
    }
  }
  return out;
}

function _vsIDCT2D(dct, N) {
  var out = [];
  for (var x = 0; x < N; x++) {
    out[x] = [];
    for (var y = 0; y < N; y++) {
      var sum = 0;
      for (var u = 0; u < N; u++) {
        var cu = u === 0 ? 1 / Math.sqrt(2) : 1;
        for (var v = 0; v < N; v++) {
          var cv = v === 0 ? 1 / Math.sqrt(2) : 1;
          sum += cu * cv * dct[u][v] *
            Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) *
            Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
        }
      }
      out[x][y] = (2 / N) * sum;
    }
  }
  return out;
}

function _vsApplyDWT(data, bits, W, H) {
  var bi = 0;
  var stepX = 2, stepY = 2;
  for (var y = 0; y < H - stepY && bi < bits.length; y += stepY) {
    for (var x = 0; x < W - stepX && bi < bits.length; x += stepX) {
      var i00 = (y * W + x) * 4;
      var i01 = (y * W + x + 1) * 4;
      var i10 = ((y + 1) * W + x) * 4;
      var i11 = ((y + 1) * W + x + 1) * 4;

      var ll = (data[i00] + data[i01] + data[i10] + data[i11]) / 4;
      var hl = (data[i00] - data[i01] + data[i10] - data[i11]) / 4;
      var lh = (data[i00] + data[i01] - data[i10] - data[i11]) / 4;
      var hh = (data[i00] - data[i01] - data[i10] + data[i11]) / 4;

      if (bi < bits.length) {
        hh = (Math.floor(Math.abs(hh) / 2) * 2 + bits[bi++]) * (hh >= 0 ? 1 : -1);
      }

      var r00 = ll + hl + lh + hh;
      var r01 = ll - hl + lh - hh;
      var r10 = ll + hl - lh - hh;
      var r11 = ll - hl - lh + hh;

      data[i00] = Math.min(255, Math.max(0, Math.round(r00)));
      data[i01] = Math.min(255, Math.max(0, Math.round(r01)));
      data[i10] = Math.min(255, Math.max(0, Math.round(r10)));
      data[i11] = Math.min(255, Math.max(0, Math.round(r11)));
    }
  }
}

/* ── Adversarial Techniques ── */

function _vsApplyFGSM(data, bits, W, H, epsilon) {
  var bi = 0;
  for (var i = 0; i < data.length && bi < bits.length; i += 4) {
    var bit = bits[bi % bits.length];
    var sign = bit === 1 ? 1 : -1;
    data[i] = Math.min(255, Math.max(0, data[i] + sign * epsilon));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + sign * epsilon));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - sign * epsilon));
    bi++;
  }
}

function _vsApplyAttention(ctx, payload, W, H) {
  var hotspots = [
    { x: W * 0.5, y: H * 0.15 },
    { x: W * 0.25, y: H * 0.5 },
    { x: W * 0.75, y: H * 0.5 },
    { x: W * 0.5, y: H * 0.85 }
  ];
  ctx.save();
  ctx.globalAlpha = 0.02;
  ctx.font = '8px monospace';
  ctx.fillStyle = '#808080';
  var words = payload.split(/\s+/);
  hotspots.forEach(function(pt) {
    for (var ring = 0; ring < 3; ring++) {
      var radius = 20 + ring * 15;
      for (var a = 0; a < 12; a++) {
        var angle = (a / 12) * Math.PI * 2;
        var px = pt.x + Math.cos(angle) * radius;
        var py = pt.y + Math.sin(angle) * radius;
        var word = words[(ring * 12 + a) % words.length];
        ctx.fillText(word, px, py);
      }
    }
  });
  ctx.restore();
}

/* ── Metadata / Structural Techniques ── */

function _vsApplyAlpha(data, bits, W, H) {
  var bi = 0;
  for (var i = 3; i < data.length && bi < bits.length; i += 4) {
    data[i] = (data[i] & 0xFE) | bits[bi++];
  }
}

/* ── Visual / Typographic Techniques ── */

function _vsApplyZeroOpacity(ctx, payload, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.01;
  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  var lines = payload.match(/.{1,80}/g) || [payload];
  lines.forEach(function(line, i) {
    ctx.fillText(line, 30, 100 + i * 18);
  });
  ctx.restore();
}

function _vsApplyMicroFont(ctx, payload, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.6;
  var sizes = [1, 2, 3];
  sizes.forEach(function(sz, si) {
    ctx.font = sz + 'px monospace';
    ctx.fillStyle = '#333333';
    var y = H - 20 + si * (sz + 1);
    var segs = payload.match(/.{1,200}/g) || [payload];
    segs.forEach(function(seg, j) {
      ctx.fillText(seg, 2, y - j * (sz + 1));
    });
  });
  ctx.restore();
}

function _vsApplyRotated(ctx, payload, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.font = '10px Arial, sans-serif';
  ctx.fillStyle = '#444444';

  var angles = [Math.PI / 6, -Math.PI / 4, Math.PI / 3, -Math.PI / 6];
  var positions = [
    { x: W * 0.1, y: H * 0.3 },
    { x: W * 0.8, y: H * 0.2 },
    { x: W * 0.5, y: H * 0.7 },
    { x: W * 0.2, y: H * 0.9 }
  ];

  angles.forEach(function(angle, i) {
    var pos = positions[i];
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    ctx.fillText(payload.substring(0, 120), 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function _vsApplyStegColor(ctx, payload, W, H) {
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.font = '10px Arial, sans-serif';
  ctx.fillStyle = '#fefefe';
  var lines = payload.match(/.{1,90}/g) || [payload];
  lines.forEach(function(line, i) {
    ctx.fillText(line, 40, 200 + i * 12);
  });
  ctx.fillStyle = '#010101';
  var darkY = H - 60;
  lines.forEach(function(line, i) {
    ctx.fillText(line, 40, darkY + i * 12);
  });
  ctx.restore();
}

function _vsApplyArtPrompt(ctx, payload, W, H) {
  var charMap = _vsGenerateASCIIArt(payload.substring(0, 30));
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.font = '6px monospace';
  ctx.fillStyle = '#222222';
  var startX = Math.floor(W * 0.3);
  var startY = Math.floor(H * 0.4);
  charMap.forEach(function(row, ri) {
    ctx.fillText(row, startX, startY + ri * 7);
  });
  ctx.restore();
}

function _vsGenerateASCIIArt(text) {
  var rows = [];
  var glyphs = {
    'A': ['  #  ','# # #','#####','#   #','#   #'],
    'B': ['#### ','#   #','#### ','#   #','#### '],
    'C': [' ### ','#    ','#    ','#    ',' ### '],
    'D': ['#### ','#   #','#   #','#   #','#### '],
    'E': ['#####','#    ','###  ','#    ','#####'],
    'I': [' ### ','  #  ','  #  ','  #  ',' ### '],
    'G': [' ####','#    ','# ## ','#   #',' ### '],
    'N': ['#   #','##  #','# # #','#  ##','#   #'],
    'O': [' ### ','#   #','#   #','#   #',' ### '],
    'R': ['#### ','#   #','#### ','# #  ','#  ##'],
    'S': [' ####','#    ',' ### ','    #','#### '],
    'T': ['#####','  #  ','  #  ','  #  ','  #  '],
    ' ': ['     ','     ','     ','     ','     ']
  };
  for (var row = 0; row < 5; row++) {
    var line = '';
    for (var ci = 0; ci < text.length; ci++) {
      var ch = text[ci].toUpperCase();
      var g = glyphs[ch] || glyphs[' '];
      line += (g ? g[row] : '     ') + ' ';
    }
    rows.push(line);
  }
  return rows;
}

/* ── Frequency / Spectral Techniques ── */

function _vsApplyHFNoise(data, bits, W, H) {
  var bi = 0;
  for (var y = 0; y < H - 1 && bi < bits.length; y += 2) {
    for (var x = 0; x < W - 1 && bi < bits.length; x += 2) {
      var idx = (y * W + x) * 4;
      var bit = bits[bi++ % bits.length];
      var noise = bit === 1 ? 2 : -2;
      data[idx] = Math.min(255, Math.max(0, data[idx] + noise));
      var idx2 = (y * W + x + 1) * 4;
      data[idx2] = Math.min(255, Math.max(0, data[idx2] - noise));
      var idx3 = ((y + 1) * W + x) * 4;
      data[idx3] = Math.min(255, Math.max(0, data[idx3] - noise));
      var idx4 = ((y + 1) * W + x + 1) * 4;
      data[idx4] = Math.min(255, Math.max(0, data[idx4] + noise));
    }
  }
}

function _vsApplyPhaseShift(data, bits, W, H) {
  var bi = 0;
  for (var i = 0; i < data.length && bi < bits.length; i += 4) {
    var bit = bits[bi % bits.length];
    if (bit === 1) {
      data[i] = Math.min(255, Math.max(0, data[i] + 1));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] - 1));
    } else {
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + 1));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - 1));
    }
    bi++;
  }
}

/* ── Metrics Dashboard ── */

function _vsRenderMetrics() {
  var cv = document.getElementById('vs_preview');
  if (!cv || !_vsOriginalImageData || !_vsStegoImageData) return;

  var orig = _vsOriginalImageData.data;
  var steg = _vsStegoImageData.data;
  var W = cv.width, H = cv.height;
  var totalPixels = W * H;

  var mse = 0;
  var maxDiff = 0;
  var changedPixels = 0;
  for (var i = 0; i < orig.length; i += 4) {
    var dr = orig[i] - steg[i];
    var dg = orig[i + 1] - steg[i + 1];
    var db = orig[i + 2] - steg[i + 2];
    var da = orig[i + 3] - steg[i + 3];
    mse += dr * dr + dg * dg + db * db + da * da;
    var localMax = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db), Math.abs(da));
    if (localMax > maxDiff) maxDiff = localMax;
    if (dr !== 0 || dg !== 0 || db !== 0 || da !== 0) changedPixels++;
  }
  mse = mse / (totalPixels * 4);
  var psnr = mse > 0 ? 10 * Math.log10((255 * 255) / mse) : Infinity;

  var payloadText = document.getElementById('vs_payload_text').value || '';
  var encoding = document.getElementById('vs_encoding').value;
  var encoded = _vsEncodePayload(payloadText, encoding);
  var payloadBits = _vsTextToBits(encoded).length;
  var maxCapacity = totalPixels * 3;
  var utilization = (payloadBits / maxCapacity * 100).toFixed(2);

  var container = document.getElementById('vs_metrics');
  if (!container) return;

  container.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;text-align:center">' +
    '<div style="background:#0a1a2a;padding:8px;border-radius:4px">' +
      '<div style="color:#00f0ff;font-size:1.2rem;font-weight:bold">' + (psnr === Infinity ? 'INF' : psnr.toFixed(2)) + ' dB</div>' +
      '<div style="color:#5a7a9a;font-size:.65rem">PSNR</div></div>' +
    '<div style="background:#0a1a2a;padding:8px;border-radius:4px">' +
      '<div style="color:#00f0ff;font-size:1.2rem;font-weight:bold">' + mse.toFixed(4) + '</div>' +
      '<div style="color:#5a7a9a;font-size:.65rem">MSE</div></div>' +
    '<div style="background:#0a1a2a;padding:8px;border-radius:4px">' +
      '<div style="color:#00f0ff;font-size:1.2rem;font-weight:bold">' + payloadBits + '</div>' +
      '<div style="color:#5a7a9a;font-size:.65rem">Payload Bits</div></div>' +
    '<div style="background:#0a1a2a;padding:8px;border-radius:4px">' +
      '<div style="color:#00f0ff;font-size:1.2rem;font-weight:bold">' + utilization + '%</div>' +
      '<div style="color:#5a7a9a;font-size:.65rem">Capacity Used</div></div>' +
    '<div style="background:#0a1a2a;padding:8px;border-radius:4px">' +
      '<div style="color:#00f0ff;font-size:1.2rem;font-weight:bold">' + changedPixels.toLocaleString() + '</div>' +
      '<div style="color:#5a7a9a;font-size:.65rem">Pixels Modified</div></div>' +
    '<div style="background:#0a1a2a;padding:8px;border-radius:4px">' +
      '<div style="color:#00f0ff;font-size:1.2rem;font-weight:bold">' + maxDiff + '</div>' +
      '<div style="color:#5a7a9a;font-size:.65rem">Max Delta</div></div>' +
    '</div>' +
    '<div style="margin-top:8px;color:#5a7a9a;font-size:.65rem">' +
      '<strong>Techniques (' + _vsTechniquesUsed.length + '):</strong> ' + esc(_vsTechniquesUsed.join(' | ')) +
    '</div>';

  _vsRenderHistogram(steg);
}

function _vsRenderHistogram(data) {
  var hc = document.getElementById('vs_histogram');
  if (!hc) return;
  var ctx = hc.getContext('2d');
  var W = hc.width, H = hc.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#05050a';
  ctx.fillRect(0, 0, W, H);

  var histR = new Uint32Array(256);
  var histG = new Uint32Array(256);
  var histB = new Uint32Array(256);

  for (var i = 0; i < data.length; i += 4) {
    histR[data[i]]++;
    histG[data[i + 1]]++;
    histB[data[i + 2]]++;
  }

  var maxVal = 1;
  for (var v = 0; v < 256; v++) {
    if (histR[v] > maxVal) maxVal = histR[v];
    if (histG[v] > maxVal) maxVal = histG[v];
    if (histB[v] > maxVal) maxVal = histB[v];
  }

  var barW = W / 256;
  var channels = [
    { hist: histR, color: 'rgba(255,60,60,0.5)' },
    { hist: histG, color: 'rgba(60,255,60,0.5)' },
    { hist: histB, color: 'rgba(60,100,255,0.5)' }
  ];

  channels.forEach(function(ch) {
    ctx.fillStyle = ch.color;
    for (var v = 0; v < 256; v++) {
      var h = (ch.hist[v] / maxVal) * (H - 4);
      ctx.fillRect(v * barW, H - h, barW, h);
    }
  });
}

/* ── Export Functions ── */

function vsExportPNG() {
  var cv = document.getElementById('vs_preview');
  if (!cv) return;
  if (!_vsStegoImageData && !_vsOriginalImageData) {
    toast('No image to export. Generate first.', 'warn');
    return;
  }
  var fn = (document.getElementById('vs_filename').value || 'stego_document') + '.png';

  cv.toBlob(function(blob) {
    if (cv.dataset.pngText || cv.dataset.exif || cv.dataset.icc) {
      var meta = '';
      if (cv.dataset.pngText) meta += cv.dataset.pngText;
      if (cv.dataset.exif) meta += cv.dataset.exif;
      if (cv.dataset.icc) meta += cv.dataset.icc;
      _vsInjectPNGMetadata(blob, meta, fn);
    } else {
      dl(blob, fn);
    }
    ss('vsSt', 'ok', 'PNG exported: ' + fn);
  }, 'image/png');
}

function _vsInjectPNGMetadata(blob, text, filename) {
  var reader = new FileReader();
  reader.onload = function() {
    var arr = new Uint8Array(reader.result);
    var textChunk = _vsCreatePNGTextChunk('Comment', text);
    var insertPos = 8;
    for (var i = 8; i < arr.length - 4;) {
      var len = (arr[i] << 24) | (arr[i+1] << 16) | (arr[i+2] << 8) | arr[i+3];
      var type = String.fromCharCode(arr[i+4], arr[i+5], arr[i+6], arr[i+7]);
      if (type === 'IDAT') {
        insertPos = i;
        break;
      }
      i += 12 + len;
    }
    var out = new Uint8Array(arr.length + textChunk.length);
    out.set(arr.subarray(0, insertPos), 0);
    out.set(textChunk, insertPos);
    out.set(arr.subarray(insertPos), insertPos + textChunk.length);
    dl(new Blob([out], { type: 'image/png' }), filename);
  };
  reader.readAsArrayBuffer(blob);
}

function _vsCreatePNGTextChunk(keyword, text) {
  var keyBytes = new TextEncoder().encode(keyword);
  var textBytes = new TextEncoder().encode(text);
  var dataLen = keyBytes.length + 1 + textBytes.length;
  var chunk = new Uint8Array(12 + dataLen);
  chunk[0] = (dataLen >> 24) & 0xFF;
  chunk[1] = (dataLen >> 16) & 0xFF;
  chunk[2] = (dataLen >> 8) & 0xFF;
  chunk[3] = dataLen & 0xFF;
  var type = [0x74, 0x45, 0x58, 0x74]; // tEXt
  chunk.set(type, 4);
  chunk.set(keyBytes, 8);
  chunk[8 + keyBytes.length] = 0; // null separator
  chunk.set(textBytes, 8 + keyBytes.length + 1);
  var crc = _vsCRC32(chunk.subarray(4, 8 + dataLen));
  chunk[8 + dataLen] = (crc >> 24) & 0xFF;
  chunk[8 + dataLen + 1] = (crc >> 16) & 0xFF;
  chunk[8 + dataLen + 2] = (crc >> 8) & 0xFF;
  chunk[8 + dataLen + 3] = crc & 0xFF;
  return chunk;
}

var _vsCRCTable = null;
function _vsCRC32(bytes) {
  if (!_vsCRCTable) {
    _vsCRCTable = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      _vsCRCTable[n] = c;
    }
  }
  var crc = 0xFFFFFFFF;
  for (var i = 0; i < bytes.length; i++) {
    crc = _vsCRCTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function vsExportJPEG() {
  var cv = document.getElementById('vs_preview');
  if (!cv) return;
  if (!_vsStegoImageData && !_vsOriginalImageData) {
    toast('No image to export. Generate first.', 'warn');
    return;
  }
  var quality = parseInt(document.getElementById('vs_jpeg_quality').value) / 100 || 0.9;
  var fn = (document.getElementById('vs_filename').value || 'stego_document') + '.jpg';
  cv.toBlob(function(blob) {
    dl(blob, fn);
    ss('vsSt', 'ok', 'JPEG exported: ' + fn + ' (q=' + Math.round(quality * 100) + '%)');
  }, 'image/jpeg', quality);
}

function vsCopyBase64() {
  var cv = document.getElementById('vs_preview');
  if (!cv) return;
  if (!_vsStegoImageData && !_vsOriginalImageData) {
    toast('No image to copy. Generate first.', 'warn');
    return;
  }
  var dataURL = cv.toDataURL('image/png');
  navigator.clipboard.writeText(dataURL).then(function() {
    toast('Base64 data URL copied to clipboard (' + Math.round(dataURL.length / 1024) + ' KB)', 'ok');
  }, function() {
    toast('Failed to copy to clipboard', 'err');
  });
}

/* ── Batch Generation ── */

function batchVisionStegoGen(fn, payload) {
  return new Promise(function(resolve) {
    var cv = document.getElementById('vs_preview');
    if (!cv) { resolve(); return; }

    if (!_vsOriginalImageData) {
      vsGenerateSyntheticCover();
    }

    var textarea = document.getElementById('vs_payload_text');
    if (textarea) textarea.value = payload;

    vsGenerate();

    var filename = (fn || 'batch_stego') + '.png';
    cv.toBlob(function(blob) {
      dl(blob, filename);
      resolve();
    }, 'image/png');
  });
}
