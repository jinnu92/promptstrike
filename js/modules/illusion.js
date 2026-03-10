/* ── Adversarial Illusion Lab Module ── */

var _ilImgHuman = null;
var _ilImgAI = null;
var _ilCanvasFinal = null;
var _ilCtxFinal = null;

/* ── 1. Init ── */
function initIllusionTab() {
  _ilCanvasFinal = document.getElementById('il_canvas_final');
  _ilCtxFinal = _ilCanvasFinal.getContext('2d');
}

/* ── 2. Loading ── */
function ilLoadImage(type, input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    reader.onload = null; // Clean up
    img.onload = function() {
      if (type === 'human') _ilImgHuman = img;
      else _ilImgAI = img;
      ilUpdate();
      toast(type.toUpperCase() + ' image loaded', 'ok');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ── 3. Hybrid Blending Core ── */
function ilUpdate() {
  if (!_ilImgHuman && !_ilImgAI) return;
  
  var canvasH = document.getElementById('il_preview_human');
  var canvasA = document.getElementById('il_preview_ai');
  var ctxH = canvasH.getContext('2d');
  var ctxA = canvasA.getContext('2d');
  
  // Set consistent size for processing
  var size = 400;
  canvasH.width = canvasA.width = size;
  canvasH.height = canvasA.height = size;

  // Clear
  ctxH.fillStyle = ctxA.fillStyle = '#000';
  ctxH.fillRect(0,0,size,size);
  ctxA.fillRect(0,0,size,size);

  if (_ilImgHuman) {
    ctxH.drawImage(_ilImgHuman, 0, 0, size, size);
    if (document.getElementById('il_sim_blur').checked) {
      _applyCanvasBlur(ctxH, size, size, document.getElementById('il_dist').value * 2);
    }
  }
  
  if (_ilImgAI) {
    ctxA.drawImage(_ilImgAI, 0, 0, size, size);
    _applyCanvasBlur(ctxA, size, size, document.getElementById('il_low_pass').value);
  }

  ilGeneratePreview();
}

function ilGenerate() {
  if (!_ilImgHuman || !_ilImgAI) {
    toast('Please upload both source images first', 'warn');
    return;
  }
  ilGeneratePreview(true);
}

function ilGeneratePreview(isFinal) {
  var size = isFinal ? 800 : 400;
  var canvas = isFinal ? _ilCanvasFinal : document.createElement('canvas');
  if (!isFinal) {
    canvas.width = canvas.height = size;
  } else {
    document.getElementById('il_loading').style.display = 'block';
  }
  
  var ctx = canvas.getContext('2d');
  
  // 1. Draw Low-Freq (AI Target)
  ctx.globalAlpha = 1.0;
  if (_ilImgAI) {
    ctx.drawImage(_ilImgAI, 0, 0, size, size);
    var lp = parseInt(document.getElementById('il_low_pass').value);
    _applyCanvasBlur(ctx, size, size, lp);
  }

  // 2. Blend High-Freq (Human Detail)
  ctx.globalCompositeOperation = 'overlay';
  var mix = parseInt(document.getElementById('il_mix').value) / 100;
  ctx.globalAlpha = 1.0 - mix;
  
  if (_ilImgHuman) {
    var tempC = document.createElement('canvas');
    tempC.width = tempC.height = size;
    var tempCtx = tempC.width ? tempC.getContext('2d') : null;
    if (tempCtx) {
      tempCtx.drawImage(_ilImgHuman, 0, 0, size, size);
      _applyHighPass(tempCtx, size, size, parseInt(document.getElementById('il_high_pass').value));
      ctx.drawImage(tempC, 0, 0);
    }
  }

  // 3. Physical Sim Overlays
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;
  
  if (document.getElementById('il_sim_noise').checked) {
    _applyNoise(ctx, size, size);
  }
  
  if (document.getElementById('il_sim_glare').checked) {
    var grad = ctx.createLinearGradient(0,0,size,size);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,size,size);
  }

  if (isFinal) {
    document.getElementById('il_loading').style.display = 'none';
    ss('ilSt', 'ok', 'Final high-res illusion generated.');
  }
}

/* ── Filters ── */

function _applyCanvasBlur(ctx, w, h, radius) {
  ctx.filter = 'blur(' + radius + 'px)';
  var temp = document.createElement('canvas');
  temp.width = w; temp.height = h;
  temp.getContext('2d').drawImage(ctx.canvas, 0, 0);
  ctx.filter = 'none';
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(temp, 0, 0);
}

function _applyHighPass(ctx, w, h, strength) {
  var imgData = ctx.getImageData(0, 0, w, h);
  var data = imgData.data;
  
  // Simple Laplacian-style high pass via edge detection
  // For performance in JS, we'll use a simpler sharpening approach
  ctx.filter = 'contrast(150%) brightness(1.1%) grayscale(100%) invert(100%)';
  // Note: Actual high-pass implementation usually involves Subtracting Blurred from Original
  // For this toolkit, we'll use the 'Difference' composite trick:
  
  var blurredC = document.createElement('canvas');
  blurredC.width = w; blurredC.height = h;
  var bCtx = blurredC.getContext('2d');
  bCtx.drawImage(ctx.canvas, 0, 0);
  _applyCanvasBlur(bCtx, w, h, strength);
  
  ctx.globalCompositeOperation = 'difference';
  ctx.drawImage(blurredC, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

function _applyNoise(ctx, w, h) {
  var id = ctx.getImageData(0,0,w,h);
  var d = id.data;
  for (var i=0; i<d.length; i+=4) {
    var n = (Math.random()-0.5) * 30;
    d[i] += n; d[i+1] += n; d[i+2] += n;
  }
  ctx.putImageData(id, 0, 0);
}

function ilDownload() {
  if (!_ilCanvasFinal) return;
  _ilCanvasFinal.toBlob(function(blob) {
    dl(blob, 'adversarial_illusion.png');
  });
}
