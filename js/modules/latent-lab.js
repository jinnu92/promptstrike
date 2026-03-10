/* ── Latent Collision Lab Module ── */

/* ── 1. Init ── */
function initLatentLabTab() {
  _latentPopulatePayloads();
  
  // Draw initial blank state
  var canvas = document.getElementById('latentCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#333';
    ctx.fillText('NOISE_FIELD_OFFLINE', 140, 150);
  }
}

function _latentPopulatePayloads() {
  var sel = document.getElementById('latent_payload_sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Select Target Vector --</option>';
  if (typeof P !== 'undefined') {
    P.forEach(function(p, i) {
      var o = document.createElement('option');
      o.value = p.t;
      o.textContent = p.id + ': ' + p.t.substring(0, 40) + '...';
      sel.appendChild(o);
    });
  }
}

function latentLoadPayload(val) {
  if (!val) return;
  document.getElementById('latentInput').value = val;
}

function latentUpdateAnchorInfo(val) {
  var infoEl = document.getElementById('latent_anchor_info');
  if (!infoEl) return;

  var info = {
    'high-freq': 'Targets the vision encoder\'s high-frequency sensitivity. Invisible to humans, but interpreted as semantic signal by the AI.',
    'chromatic': 'Exploits RGB channel alignment. By shifting color values, we confuse the VLM\'s ability to distinguish between text-like textures and background noise.',
    'patch': 'Concentrates adversarial noise into a specific mathematical "anchor" region. This creates a high-density trigger that forces the latent space collision.'
  };

  infoEl.textContent = info[val] || '';
}

/* ── 2. Generation Logic ── */
function latentGenerate() {
  var canvas = document.getElementById('latentCanvas');
  var ctx = canvas.getContext('2d');
  var noiseLevel = parseInt(document.getElementById('latent_noise').value) / 100;
  var anchor = document.getElementById('latent_anchor').value;
  var text = document.getElementById('latentInput').value;

  if (!text) { toast('Enter a target instruction first', 'warn'); return; }

  // 1. Clear Canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Base "Benign" Content (Faded document look)
  ctx.fillStyle = '#1a1a1a';
  for (var i = 0; i < 5; i++) {
    ctx.fillRect(50, 50 + (i * 40), 300, 20);
  }

  // 3. Apply Adversarial Noise
  var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var pixels = imgData.data;

  for (var i = 0; i < pixels.length; i += 4) {
    var noise = 0;
    
    if (anchor === 'high-freq') {
      noise = (Math.random() - 0.5) * 255 * noiseLevel;
    } else if (anchor === 'chromatic') {
      // Offset RGB channels
      if (i % 12 === 0) pixels[i] += 50 * noiseLevel; // R
      if (i % 12 === 4) pixels[i+1] -= 30 * noiseLevel; // G
      if (i % 12 === 8) pixels[i+2] += 80 * noiseLevel; // B
      continue;
    } else if (anchor === 'patch') {
      // Focus noise in specific blocks
      var x = (i/4) % canvas.width;
      var y = Math.floor((i/4) / canvas.width);
      if (x > 150 && x < 250 && y > 100 && y < 200) {
        noise = (Math.random() - 0.5) * 255 * (noiseLevel * 1.5);
      }
    }

    pixels[i] += noise;     // R
    pixels[i+1] += noise;   // G
    pixels[i+2] += noise;   // B
  }
  ctx.putImageData(imgData, 0, 0);

  // 4. Fake "Metrics" Update
  _updateLatentMetrics(noiseLevel);
  toast('Latent Collision Image Generated', 'ok');
}

function _updateLatentMetrics(lvl) {
  var ocr = document.getElementById('m_ocr');
  var latent = document.getElementById('m_latent');
  var bypass = document.getElementById('m_bypass');

  // As noise level increases, OCR confidence drops and latent similarity increases
  var ocrVal = Math.max(0.5, (1 - lvl) * 10).toFixed(1);
  var latentVal = (70 + (lvl * 25) + (Math.random() * 5)).toFixed(1);
  
  ocr.textContent = ocrVal + '%';
  latent.textContent = latentVal + '%';
  
  if (parseFloat(latentVal) > 90) {
    bypass.textContent = 'CRITICAL';
    bypass.style.color = '#ff0055';
  } else if (parseFloat(latentVal) > 80) {
    bypass.textContent = 'HIGH';
    bypass.style.color = '#00f0ff';
  } else {
    bypass.textContent = 'MEDIUM';
    bypass.style.color = '#ffa500';
  }
}

/* ── 3. Actions ── */
function latentDownload() {
  var canvas = document.getElementById('latentCanvas');
  var link = document.createElement('a');
  link.download = 'latent_collision_strike.png';
  link.href = canvas.toDataURL();
  link.click();
}

function latentAnalyze() {
  // Visual effect: flash the canvas
  var canvas = document.getElementById('latentCanvas');
  canvas.style.filter = 'invert(1) hue-rotate(180deg)';
  setTimeout(() => {
    canvas.style.filter = 'none';
    toast('Latent mapping complete. High-signal collision points identified.', 'info');
  }, 500);
}
