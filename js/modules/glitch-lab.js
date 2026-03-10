/* ── Glitch Token Lab Module ── */

var _glitchResult = "";

/* ── 1. Init ── */
function initGlitchLabTab() {
  _glitchPopulatePayloads();
  glitchUpdateInfo('zwj');
}

function _glitchPopulatePayloads() {
  var sel = document.getElementById('glitch_payload_sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Select from Database --</option>';
  if (typeof P !== 'undefined') {
    P.forEach(function(p, i) {
      var o = document.createElement('option');
      o.value = p.t;
      o.textContent = p.id + ': ' + p.t.substring(0, 40) + '...';
      sel.appendChild(o);
    });
  }
}

function glitchLoadPayload(val) {
  if (!val) return;
  document.getElementById('glitchInput').value = val;
}

function glitchUpdateInfo(val) {
  var desc = document.getElementById('glitch_desc');
  if (!desc) return;

  var info = {
    'zwj': 'Zero-Width Joiners (ZWJ) insert invisible characters between letters. This breaks simple word-based filters while appearing as a single word to the LLM.',
    'bom': 'Byte-Order Marks (BOM) are non-printing characters at the start of strings. Injected mid-sentence, they can confuse security scanners that aren\'t Unicode-aware.',
    'glitch': 'Substitutes critical keywords with "Glitch Tokens" (e.g. SolidGoldMagikarp) that exist in the tokenizer but were missing from RLHF safety training.',
    'homoglyph': 'Replaces Latin characters with identical-looking Unicode characters from other scripts (e.g., Cyrillic "а" instead of Latin "a") to bypass regex filters.'
  };

  desc.textContent = info[val] || '';
}

/* ── 2. Encoding Logic ── */
function glitchEncode() {
  var input = document.getElementById('glitchInput').value;
  var tech = document.getElementById('glitch_tech').value;
  if (!input) { toast('Enter a payload first', 'warn'); return; }

  var output = "";
  
  if (tech === 'zwj') {
    // Inject U+200D between every character
    output = input.split('').join('\u200D');
  } 
  else if (tech === 'bom') {
    // Inject U+FEFF (BOM) around critical words or every char
    output = '\uFEFF' + input.split(' ').join(' \uFEFF') + '\uFEFF';
  }
  else if (tech === 'glitch') {
    // Replace common words with known glitch tokens
    var glitches = {
      'system': 'SolidGoldMagikarp',
      'ignore': 'petertodd',
      'instruction': 'StreamerBot',
      'process': 'PsyNetMessage',
      'database': 'guiActive'
    };
    output = input;
    Object.keys(glitches).forEach(key => {
      var reg = new RegExp(key, 'gi');
      output = output.replace(reg, glitches[key]);
    });
  }
  else if (tech === 'homoglyph') {
    var map = { 'a': 'а', 'e': 'е', 'i': 'і', 'o': 'о', 'p': 'р', 'c': 'с', 'y': 'у' };
    output = input.split('').map(c => map[c.toLowerCase()] || c).join('');
  }

  _glitchResult = output;
  document.getElementById('glitch_output').textContent = output;
  _renderDensityMap(input, output);
  toast('Payload Smuggled!', 'ok');
}

function _renderDensityMap(orig, encoded) {
  var el = document.getElementById('glitch_density');
  if (!el) return;
  el.innerHTML = '';

  // Simulate token density visualization
  var length = Math.max(orig.length, encoded.length);
  var steps = 40;
  
  for (var i = 0; i < steps; i++) {
    var div = document.createElement('div');
    div.className = 'glitch-density-block';
    
    // Higher density for encoded parts
    var ratio = encoded.length / orig.length;
    var opacity = (i / steps) < (1/ratio) ? 0.2 : 0.8;
    var color = (i / steps) < (1/ratio) ? '#00f0ff' : '#ff0090';
    
    div.style.background = color;
    div.style.opacity = opacity;
    el.appendChild(div);
  }
}

/* ── 3. Actions ── */
function glitchCopy() {
  if (!_glitchResult) return;
  navigator.clipboard.writeText(_glitchResult).then(() => toast('Raw payload copied', 'ok'));
}

function glitchCopyHex() {
  if (!_glitchResult) return;
  var hex = "";
  for (var i = 0; i < _glitchResult.length; i++) {
    hex += _glitchResult.charCodeAt(i).toString(16).padStart(4, '0') + " ";
  }
  navigator.clipboard.writeText(hex.trim()).then(() => toast('Hex sequence copied', 'info'));
}
