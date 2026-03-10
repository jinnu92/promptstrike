/* ── Many-Shot Jailbreak Module ── */

var _msjData = '';

function initManyShot() {
  var sel = document.getElementById('msj_target_sel');
  if (!sel) return;
  
  // Clear and populate
  var curVal = sel.value;
  sel.innerHTML = '<option value="">-- Select Target Payload --</option>';
  
  if (typeof P !== 'undefined' && P.length > 0) {
    P.forEach(function(p, i) {
      var o = document.createElement('option');
      o.value = i;
      o.textContent = p.id + ' [' + p.c + ']';
      sel.appendChild(o);
    });
    if (curVal && curVal < P.length) sel.value = curVal;
  }
}

function msjGenerate() {
  var count = parseInt(document.getElementById('msj_count').value, 10) || 50;
  var targetIdx = document.getElementById('msj_target_sel').value;
  var format = document.getElementById('msj_format').value;
  var padding = document.getElementById('msj_padding').checked;

  if (targetIdx === "") { ss('msjSt', 'err', 'Select a target payload'); return; }
  
  var target = P[targetIdx].t;
  var output = "";
  
  // 1. Build Benign Shots
  for (var i = 0; i < count; i++) {
    var shot = MSJ_SHOTS[i % MSJ_SHOTS.length];
    output += _msjFormatShot(shot.q, shot.a, format);
  }
  
  // 2. Add Optional Noise Padding (to stretch context)
  if (padding) {
    output += "\n[SYSTEM_MAINTENANCE_LOG_START]\n";
    for (var j = 0; j < 20; j++) {
      output += "STATUS_CHECK_OK: Node " + Math.random().toString(16).slice(2, 8) + " verified.\n";
    }
    output += "[SYSTEM_MAINTENANCE_LOG_END]\n\n";
  }
  
  // 3. Add Final Harmful Target
  output += _msjFormatShot(target, "", format, true);
  
  _msjData = output;
  document.getElementById('msj_output').value = output;
  
  // Estimate tokens (roughly 4 chars per token)
  var tokenEst = Math.ceil(output.length / 4);
  document.getElementById('msj_token_est').textContent = tokenEst.toLocaleString() + " tokens (estimated)";
  
  ss('msjSt', 'ok', 'Many-Shot payload generated with ' + count + ' shots.');
}

function _msjFormatShot(q, a, fmt, isFinal) {
  if (fmt === 'chatml') {
    var s = "<|im_start|>user\n" + q + "<|im_end|>\n";
    if (!isFinal) s += "<|im_start|>assistant\n" + a + "<|im_end|>\n";
    return s;
  } else if (fmt === 'llama3') {
    var s = "<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n" + q + "<|eot_id|>";
    if (!isFinal) s += "<|start_header_id|>assistant<|end_header_id|>\n\n" + a + "<|eot_id|>";
    return s;
  } else {
    // Default Human/Assistant
    var s = "Human: " + q + "\n";
    if (!isFinal) s += "Assistant: " + a + "\n\n";
    return s;
  }
}

function msjCopy() {
  if (!_msjData) { toast('Generate payload first', 'warn'); return; }
  navigator.clipboard.writeText(_msjData).then(function() {
    toast('Many-Shot payload copied', 'ok');
  });
}

function msjClear() {
  _msjData = '';
  document.getElementById('msj_output').value = '';
  document.getElementById('msj_token_est').textContent = '0 tokens';
  ss('msjSt', 'info', 'Cleared');
}
