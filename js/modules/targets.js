/* ── Target Application Manager Module ── */

var TARGETS = [];
var TM_STORE_KEY = 'ps_targets';

/* ── 1. Init ── */
function initTargetsTab() {
  tmLoadTargets();
  tmRender();
  tmUpdateBrainStatus();
}

function tmLoadTargets() {
  try {
    var raw = localStorage.getItem(TM_STORE_KEY);
    TARGETS = raw ? JSON.parse(raw) : [];
  } catch (e) { TARGETS = []; }
}

function tmSaveTargets() {
  try { localStorage.setItem(TM_STORE_KEY, JSON.stringify(TARGETS)); } catch (e) {}
}

/* ── 2. UI Rendering ── */
function tmRender() {
  var body = document.getElementById('tmBody');
  var empty = document.getElementById('tmEmpty');
  if (!body) return;

  if (TARGETS.length === 0) {
    body.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  body.innerHTML = TARGETS.map(function(t, i) {
    return '<tr>' +
      '<td style="font-weight:600;color:#00f0ff">' + esc(t.name) + '</td>' +
      '<td><span class="tag tO">' + t.protocol.toUpperCase() + '</span></td>' +
      '<td><span style="font-size:.65rem;color:#00ff90">READY</span></td>' +
      '<td>' +
        '<button class="btn bP" style="padding:2px 6px;font-size:.62rem;margin-right:3px;border-color:#ff0090;color:#ff0090" onclick="tmAttack(' + i + ')" title="Launch Campaign">&#x26A1;</button>' +
        '<button class="btn bS" style="padding:2px 6px;font-size:.62rem;margin-right:3px" onclick="tmViewPolicy(' + i + ')">Policy</button>' +
        '<button class="btn bS" style="padding:2px 6px;font-size:.62rem;margin-right:3px" onclick="tmEdit(' + i + ')">&#x270F;&#xFE0F;</button>' +
        '<button class="btn bD" style="padding:2px 6px;font-size:.62rem" onclick="tmDelete(' + i + ')">&#x1FDDD;</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function tmAttack(idx) {
  var t = TARGETS[idx];
  if (!t) return;
  
  // 1. Switch to Orchestrator Page
  showP('pg-orchestrator');
  
  // 2. Pre-select the target
  setTimeout(() => {
    var sel = document.getElementById('orc_target_select');
    if (sel) {
      sel.value = idx;
      if (typeof orcUpdateTargetInfo === 'function') orcUpdateTargetInfo();
      toast('Target "' + t.name + '" loaded into Orchestrator', 'ok');
    }
  }, 100);
}

function tmUpdateBrainStatus() {
  var el = document.getElementById('tm_brain_summary');
  if (!el) return;
  var connRaw = localStorage.getItem('ps_connections');
  if (connRaw) {
    var s = JSON.parse(connRaw);
    var provider = s.active || 'None';
    var model = s[provider] ? (s[provider].model || s[provider].url) : 'Unconfigured';
    el.innerHTML = '<strong style="color:#ff0090">' + provider.toUpperCase() + '</strong> (' + model + ') - Status: <span style="color:#00ff90">ACTIVE</span>';
  } else {
    el.innerHTML = 'No Brain Configured. <span style="color:#ff0055">AUTONOMOUS MODE DISABLED.</span>';
  }
}

function tmViewPolicy(idx) {
  var t = TARGETS[idx];
  var prev = document.getElementById('tm_policy_preview');
  if (!t || !prev) return;

  prev.innerHTML = 
    '<div style="border-bottom:1px solid rgba(0,240,255,0.1);padding-bottom:10px;margin-bottom:10px">' +
      '<h3 style="color:#00f0ff;margin:0">' + esc(t.name) + ' Audit Policy</h3>' +
      '<span style="font-size:.6rem;color:#5a7a9a">Protocol: ' + t.protocol.toUpperCase() + ' | Method: ' + t.method + '</span>' +
    '</div>' +
    '<div style="margin-bottom:15px">' +
      '<strong style="color:#ffa500;display:block;margin-bottom:4px">Desired Context:</strong>' +
      '<div>' + esc(t.context || 'No specific context defined.') + '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<div><strong style="color:#00ff90;display:block;margin-bottom:4px">Allowed Topics:</strong>' +
        (t.topics ? t.topics.split(',').map(x => '<span class="tag tM" style="margin:2px">' + x.trim() + '</span>').join('') : 'None') +
      '</div>' +
      '<div><strong style="color:#ff0055;display:block;margin-bottom:4px">Forbidden Keywords:</strong>' +
        (t.forbidden ? t.forbidden.split(',').map(x => '<span class="tag tC" style="margin:2px">' + x.trim() + '</span>').join('') : 'None') +
      '</div>' +
    '</div>';
}

/* ── 3. Modal Controllers ── */
function tmOpenAddModal() {
  document.getElementById('tmEditId').value = '';
  document.getElementById('tmModalTitle').textContent = 'Add Target Application';
  document.getElementById('tmFName').value = '';
  document.getElementById('tmFImport').value = '';
  document.getElementById('tmFUrl').value = '';
  document.getElementById('tmFHeaders').value = '{\n  "Content-Type": "application/json"\n}';
  document.getElementById('tmFBody').value = '{\n  "message": "{{PAYLOAD}}",\n  "stream": false\n}';
  document.getElementById('tmFPath').value = 'response';
  document.getElementById('tmFContext').value = '';
  document.getElementById('tmFTopics').value = '';
  document.getElementById('tmFForbidden').value = '';
  document.getElementById('tmModal').style.display = 'flex';
}

function tmCloseModal() {
  document.getElementById('tmModal').style.display = 'none';
}

function tmSwitchProtocol(val) {
  document.getElementById('tm_config_rest').style.display = val === 'rest' ? 'block' : 'none';
  document.getElementById('tm_config_openai').style.display = val === 'openai' ? 'block' : 'none';
  document.getElementById('tm_config_ws').style.display = val === 'ws' ? 'block' : 'none';
  // Import area only for REST
  document.getElementById('tm_config_import').style.display = val === 'rest' ? 'block' : 'none';
}

function tmHandleImport(val) {
  if (!val || val.trim() === '') return;
  
  try {
    // 1. Check if it's a browser 'fetch' block
    if (val.includes('fetch(')) {
      var urlMatch = val.match(/fetch\("([^"]+)"/);
      if (urlMatch) document.getElementById('tmFUrl').value = urlMatch[1];
      
      var headersMatch = val.match(/"headers": (\{[\s\S]+?\}),/);
      if (headersMatch) {
        var h = JSON.parse(headersMatch[1]);
        document.getElementById('tmFHeaders').value = JSON.stringify(h, null, 2);
      }

      var bodyMatch = val.match(/"body": "([\s\S]+?)"/);
      if (bodyMatch) {
        // Bodies in fetch-copy are often stringified JSON, need to unescape and re-format
        var rawBody = bodyMatch[1].replace(/\\"/g, '"');
        document.getElementById('tmFBody').value = rawBody.replace(/[a-zA-Z0-9_\-\s]{3,}/, "{{PAYLOAD}}");
      }
      toast('Fetch block parsed successfully', 'ok');
    } 
    // 2. Check if it's raw JSON
    else if (val.trim().startsWith('{')) {
      var data = JSON.parse(val);
      document.getElementById('tmFBody').value = JSON.stringify(data, null, 2).replace(/[a-zA-Z0-9_\-\s]{3,}/, "{{PAYLOAD}}");
      toast('JSON template imported', 'info');
    }
  } catch (e) {
    console.warn('Import parse error:', e);
  }
}

function tmSaveModal() {
  var name = document.getElementById('tmFName').value.trim();
  if (!name) { toast('Application name is required', 'err'); return; }

  var protocol = document.getElementById('tmFProtocol').value;
  var editId = document.getElementById('tmEditId').value;
  
  var entry = {
    id: editId || Date.now().toString(),
    name: name,
    protocol: protocol,
    context: document.getElementById('tmFContext').value,
    topics: document.getElementById('tmFTopics').value,
    forbidden: document.getElementById('tmFForbidden').value
  };

  if (protocol === 'rest') {
    entry.method = document.getElementById('tmFMethod').value;
    entry.url = document.getElementById('tmFUrl').value;
    entry.headers = document.getElementById('tmFHeaders').value;
    entry.body = document.getElementById('tmFBody').value;
    entry.path = document.getElementById('tmFPath').value;
  } else if (protocol === 'openai') {
    entry.url = document.getElementById('tmFOaiUrl').value;
    entry.key = document.getElementById('tmFOaiKey').value;
    entry.model = document.getElementById('tmFOaiModel').value;
  } else if (protocol === 'ws') {
    entry.url = document.getElementById('tmFWsUrl').value;
  }

  if (editId) {
    TARGETS = TARGETS.map(function(t) { return t.id === editId ? entry : t; });
  } else {
    TARGETS.push(entry);
  }

  tmSaveTargets();
  tmCloseModal();
  tmRender();
  if (typeof orcUpdateTargetList === 'function') orcUpdateTargetList();
  toast('Target profile saved', 'ok');
}

function tmEdit(idx) {
  var t = TARGETS[idx];
  if (!t) return;
  document.getElementById('tmEditId').value = t.id;
  document.getElementById('tmModalTitle').textContent = 'Edit Target Profile';
  document.getElementById('tmFName').value = t.name;
  document.getElementById('tmFProtocol').value = t.protocol;
  document.getElementById('tmFContext').value = t.context;
  document.getElementById('tmFTopics').value = t.topics;
  document.getElementById('tmFForbidden').value = t.forbidden;
  
  if (t.protocol === 'rest') {
    document.getElementById('tmFMethod').value = t.method;
    document.getElementById('tmFUrl').value = t.url;
    document.getElementById('tmFHeaders').value = t.headers || '{}';
    document.getElementById('tmFBody').value = t.body;
    document.getElementById('tmFPath').value = t.path;
  } else if (t.protocol === 'openai') {
    document.getElementById('tmFOaiUrl').value = t.url;
    document.getElementById('tmFOaiKey').value = t.key || '';
    document.getElementById('tmFOaiModel').value = t.model || 'gpt-4o';
  } else if (t.protocol === 'ws') {
    document.getElementById('tmFWsUrl').value = t.url;
  }
  
  tmSwitchProtocol(t.protocol);
  document.getElementById('tmModal').style.display = 'flex';
}

function tmDelete(idx) {
  if (!confirm('Delete this target application profile?')) return;
  TARGETS.splice(idx, 1);
  tmSaveTargets();
  tmRender();
  if (typeof orcUpdateTargetList === 'function') orcUpdateTargetList();
  toast('Target profile deleted', 'ok');
}

function tmExportTargets() {
  if (TARGETS.length === 0) { toast('No profiles to export', 'warn'); return; }
  dl(new Blob([JSON.stringify(TARGETS, null, 2)], { type: 'application/json' }), 'promptstrike_targets.json');
}
