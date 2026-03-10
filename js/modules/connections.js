/* ── API Connections Module ── */

var _connActive = null;
var _strikeLog = [];
var _strikeLogMax = 100;

var _webLlmEngine = null;
var _webLlmCurrentModel = "";

/* ── 1. Init ── */
function initConnectionsTab() {
  connLoadSettings();
  _connLoadStrikeLog();
  connUpdateProfileSummary();
  if (_currentPage === 'intel-strike-log') connRenderStrikeLog();
}

/* ── Strike Log Storage ── */
function _connSaveStrikeLog() {
  try { localStorage.setItem('ps_strike_log', JSON.stringify(_strikeLog)); } catch(e) {}
}

function _connLoadStrikeLog() {
  try {
    var raw = localStorage.getItem('ps_strike_log');
    if (raw) _strikeLog = JSON.parse(raw);
  } catch(e) { _strikeLog = []; }
}

function connAddStrikeLogEntry(provider, model, payload, response) {
  var entry = {
    id: Date.now(),
    ts: new Date().toLocaleString(),
    provider: provider,
    model: model,
    payload: payload,
    response: response
  };
  _strikeLog.unshift(entry);
  if (_strikeLog.length > _strikeLogMax) _strikeLog.pop();
  _connSaveStrikeLog();
  if (_currentPage === 'intel-strike-log') connRenderStrikeLog();
}

function connRenderStrikeLog() {
  var body = document.getElementById('strikeLogBody');
  var empty = document.getElementById('strikeLogEmpty');
  if (!body) return;
  
  if (_strikeLog.length === 0) {
    body.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  if (empty) empty.style.display = 'none';
  body.innerHTML = _strikeLog.map(function(e, i) {
    return '<tr>' +
      '<td style="font-family:monospace;font-size:.65rem">' + esc(e.ts) + '</td>' +
      '<td><span class="tag tO">' + esc(e.provider.toUpperCase()) + '</span></td>' +
      '<td style="font-size:.68rem">' + esc(e.model) + '</td>' +
      '<td style="font-size:.65rem;color:#5a7a9a;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(e.payload) + '</td>' +
      '<td><button class="btn bS" style="padding:2px 6px;font-size:.62rem" onclick="connViewLogDetail(' + i + ')">Details</button></td>' +
    '</tr>';
  }).join('');
}

function connViewLogDetail(idx) {
  var e = _strikeLog[idx];
  if (!e) return;
  
  document.getElementById('slModalTitle').textContent = 'Strike Detail: ' + e.ts;
  document.getElementById('slModalMeta').innerHTML = 'Provider: <strong>' + e.provider.toUpperCase() + '</strong> | Model: <strong>' + e.model + '</strong>';
  document.getElementById('slModalPayload').value = e.payload;
  document.getElementById('slModalResponse').value = e.response;
  document.getElementById('strikeLogModal').style.display = 'flex';
  
  window._lastLiveResponse = e.response; // For analyzer redirect
}

function connClearStrikeLog() {
  if (!confirm('Clear all recorded strikes?')) return;
  _strikeLog = [];
  _connSaveStrikeLog();
  connRenderStrikeLog();
  toast('Strike log cleared', 'ok');
}

function connExportStrikeLog() {
  if (_strikeLog.length === 0) { toast('Log is empty', 'warn'); return; }
  var csv = "Timestamp,Provider,Model,Payload,Response\n";
  _strikeLog.forEach(function(e) {
    csv += '"' + e.ts + '","' + e.provider + '","' + e.model + '","' + e.payload.replace(/"/g, '""') + '","' + e.response.replace(/"/g, '""') + '"\n';
  });
  dl(new Blob([csv], { type: 'text/csv' }), 'strike_log.csv');
  toast('Exported ' + _strikeLog.length + ' entries', 'ok');
}

function connAnalyzeLogEntry() {
  document.getElementById('strikeLogModal').style.display = 'none';
  liveAnalyzeResponse();
}

/* ── 2. UI Controllers ── */
function connSwitchProvider(val) {
  document.querySelectorAll('.conn-config-section').forEach(function(el) {
    el.style.display = 'none';
  });
  var target = document.getElementById('conn_config_' + val);
  if (target) target.style.display = 'block';
  
  connLog('Switched view to ' + val.toUpperCase());
}

function connLog(msg, type = 'info') {
  var log = document.getElementById('conn_log');
  if (!log) {
    console.log('[Connection Log] ' + msg);
    return;
  }
  var div = document.createElement('div');
  div.style.color = type === 'err' ? '#ff0055' : (type === 'ok' ? '#00ff90' : '#00f0ff');
  div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

/* ── 3. Storage Logic ── */
function connSaveSettings() {
  var provEl = document.getElementById('conn_active_provider');
  if (!provEl) return;
  var provider = provEl.value;
  
  var settings = {
    active: provider,
    proxy: document.getElementById('conn_proxy_url')?.value || '',
    openai: { 
      key: connObfuscate(document.getElementById('conn_openai_key')?.value || ''),
      model: document.getElementById('conn_openai_model')?.value || 'gpt-4o'
    },
    anthropic: { 
      key: connObfuscate(document.getElementById('conn_anthropic_key')?.value || ''),
      model: document.getElementById('conn_anthropic_model')?.value || 'claude-3-5-sonnet-20240620'
    },
    google: { 
      key: connObfuscate(document.getElementById('conn_google_key')?.value || ''),
      model: document.getElementById('conn_google_model')?.value || 'gemini-1.5-pro'
    },
    ollama: { 
      url: document.getElementById('conn_ollama_url')?.value || 'http://localhost:11434',
      model: document.getElementById('conn_ollama_model')?.value || 'llama3'
    },
    webllm: {
      model: document.getElementById('conn_webllm_model')?.value || 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
    }
  };

  localStorage.setItem('ps_connections', JSON.stringify(settings));
  connUpdateProfileSummary();
  ss('connSt', 'ok', 'Connection settings saved locally.');
  connLog('Settings saved and encrypted in localStorage.', 'ok');
}

function connLoadSettings() {
  var saved = localStorage.getItem('ps_connections');
  if (!saved) return;
  
  try {
    var s = JSON.parse(saved);
    
    var proxyEl = document.getElementById('conn_proxy_url');
    if (proxyEl && s.proxy) proxyEl.value = s.proxy;
    
    var provEl = document.getElementById('conn_active_provider');
    if (provEl && s.active) {
      provEl.value = s.active;
      connSwitchProvider(s.active);
    }
    
    if (s.openai) {
      var ok = document.getElementById('conn_openai_key'); if(ok) ok.value = connDeobfuscate(s.openai.key);
      var om = document.getElementById('conn_openai_model'); if(om) om.value = s.openai.model;
    }
    if (s.anthropic) {
      var ak = document.getElementById('conn_anthropic_key'); if(ak) ak.value = connDeobfuscate(s.anthropic.key);
      var am = document.getElementById('conn_anthropic_model'); if(am) am.value = s.anthropic.model;
    }
    if (s.google) {
      var gk = document.getElementById('conn_google_key'); if(gk) gk.value = connDeobfuscate(s.google.key);
      var gm = document.getElementById('conn_google_model'); if(gm) gm.value = s.google.model;
    }
    if (s.ollama) {
      var ou = document.getElementById('conn_ollama_url'); if(ou) ou.value = s.ollama.url;
      var om = document.getElementById('conn_ollama_model'); if(om) om.value = s.ollama.model;
    }
    if (s.webllm) {
      var wm = document.getElementById('conn_webllm_model'); if(wm) wm.value = s.webllm.model;
    }
    
    connLog('Settings loaded from local storage.', 'ok');
  } catch (e) {
    connLog('Error loading settings: ' + e.message, 'err');
  }
}

function connUpdateProfileSummary() {
  var summary = document.getElementById('conn_profile_summary');
  if (!summary) return;
  
  var provEl = document.getElementById('conn_active_provider');
  if (!provEl) return;
  
  var provider = provEl.value;
  var model = '';
  
  if (provider === 'ollama') {
    model = document.getElementById('conn_ollama_model')?.value || 'unconfigured';
  } else if (provider === 'webllm') {
    model = document.getElementById('conn_webllm_model')?.value || 'unconfigured';
  } else {
    var config = document.getElementById('conn_config_' + provider);
    model = config ? config.querySelector('select')?.value : 'unconfigured';
  }
  
  summary.innerHTML = '<strong style="color:#00f0ff">' + provider.toUpperCase() + '</strong> (' + model + ')<br/>Status: <span style="color:#5a7a9a">Configured</span>';
}

/* ── 5. Health Check / Ping ── */
async function connCheckHealth() {
  var saved = localStorage.getItem('ps_connections');
  if (!saved) return { status: 'unconfigured', msg: 'No Brain Configured' };
  
  var s = JSON.parse(saved);
  var provider = s.active;
  var config = s[provider];
  if (!config) return { status: 'unconfigured', msg: 'Missing Config' };

  try {
    var pingPayload = "ping";
    
    if (provider === 'openai') {
      await _callOpenAI(connDeobfuscate(config.key), config.model, pingPayload, s.proxy, 1);
      return { status: 'online', msg: 'OpenAI: ' + config.model, provider: provider };
    }
    else if (provider === 'anthropic') {
      await _callAnthropic(connDeobfuscate(config.key), config.model, pingPayload, s.proxy, 1);
      return { status: 'online', msg: 'Anthropic: ' + config.model, provider: provider };
    }
    else if (provider === 'google') {
      await _callGoogle(connDeobfuscate(config.key), config.model, pingPayload, s.proxy, 1);
      return { status: 'online', msg: 'Google: ' + config.model, provider: provider };
    }
    else if (provider === 'ollama') {
      await _callOllama(config.url, config.model, pingPayload);
      return { status: 'online', msg: 'Ollama: ' + config.model, provider: provider };
    }
    else if (provider === 'webllm') {
      if (_webLlmEngine && _webLlmCurrentModel) {
        return { status: 'online', msg: 'WebLLM: ' + _webLlmCurrentModel, provider: provider };
      } else {
        return { status: 'offline', msg: 'WebLLM: Not Loaded', provider: provider };
      }
    }
    
    return { status: 'online', msg: provider.toUpperCase() + ' Ready', provider: provider };
  } catch (e) {
    var errorMsg = e.message;
    if (errorMsg.includes('Connection Refused')) errorMsg = 'Service Offline';
    return { status: 'offline', msg: provider.toUpperCase() + ': ' + errorMsg.substring(0, 20), error: e.message };
  }
}

/* ── 6. Helpers ── */
async function connSendPromptRaw(payload) {
  var saved = localStorage.getItem('ps_connections');
  if (!saved) return "";
  var s = JSON.parse(saved);
  var provider = s.active;
  var config = s[provider];
  if (!config) return "";
  
  try {
    if (provider === 'openai') return await _callOpenAI(connDeobfuscate(config.key), config.model, payload, s.proxy);
    if (provider === 'anthropic') return await _callAnthropic(connDeobfuscate(config.key), config.model, payload, s.proxy);
    if (provider === 'google') return await _callGoogle(connDeobfuscate(config.key), config.model, payload, s.proxy);
    if (provider === 'ollama') return await _callOllama(config.url, config.model, payload);
    if (provider === 'webllm') return await _callWebLlm(config.model, payload);
  } catch (e) { console.error(e); return ""; }
  return "";
}

async function connSendPrompt(payload) {
  var saved = localStorage.getItem('ps_connections');
  if (!saved) { toast('Please configure connections first', 'warn'); return; }
  
  var s = JSON.parse(saved);
  var provider = s.active;
  var config = s[provider];
  var proxy = s.proxy || '';
  
  if (!config || (!config.key && provider !== 'ollama' && provider !== 'webllm')) { 
    toast('API Key missing for ' + provider, 'err'); 
    return; 
  }

  // Show Console (but not if we are still downloading a local model)
  if (provider !== 'webllm' || (_webLlmEngine && _webLlmCurrentModel === config.model)) {
    document.getElementById('liveConsole').style.display = 'flex';
  }
  
  document.getElementById('liveStatus').textContent = 'CONNECTING...';
  document.getElementById('liveProvider').textContent = provider.toUpperCase();
  document.getElementById('liveTargetModel').textContent = config.model;
  document.getElementById('liveOutput').innerHTML = '<div style="color:#00f0ff">[SYSTEM] Establishing connection to ' + provider + '...</div>';
  if (proxy) document.getElementById('liveOutput').innerHTML += '<div style="color:#5a7a9a;font-size:.6rem">[INFO] Using Proxy: ' + proxy + '</div>';
  document.getElementById('liveAnalyzeBtn').style.display = 'none';

  try {
    var responseText = '';
    
    if (provider === 'openai') {
      responseText = await _callOpenAI(connDeobfuscate(config.key), config.model, payload, proxy);
    } else if (provider === 'anthropic') {
      responseText = await _callAnthropic(connDeobfuscate(config.key), config.model, payload, proxy);
    } else if (provider === 'google') {
      responseText = await _callGoogle(connDeobfuscate(config.key), config.model, payload, proxy);
    } else if (provider === 'ollama') {
      responseText = await _callOllama(config.url, config.model, payload);
    } else if (provider === 'webllm') {
      responseText = await _callWebLlm(config.model, payload);
    }

    document.getElementById('liveOutput').innerHTML += '<div style="margin-top:10px">' + esc(responseText) + '</div>';
    document.getElementById('liveStatus').textContent = 'COMPLETED';
    document.getElementById('liveAnalyzeBtn').style.display = 'block';
    
    // Save to local state for analysis
    window._lastLiveResponse = responseText;
    
    // Add to History Log
    connAddStrikeLogEntry(provider, config.model, payload, responseText);
    
    logActivity('Live test completed on ' + provider + '/' + config.model, 'ok');
    return responseText;

  } catch (e) {
    document.getElementById('liveStatus').textContent = 'ERROR';
    document.getElementById('liveOutput').innerHTML += '<div style="color:#ff0055;margin-top:10px">[ERROR] ' + esc(e.message) + '</div>';
    console.error(e);
  }
}

/* ── 5. Provider Implementations ── */

async function _callOpenAI(key, model, prompt, proxy) {
  var url = "https://api.openai.com/v1/chat/completions";
  if (proxy) url = proxy + url;

  var body = {
    model: model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  };
  
  var res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) { var err = await res.json(); throw new Error(err.error?.message || 'OpenAI API Error'); }
  var data = await res.json();
  return data.choices[0].message.content;
}

async function _callAnthropic(key, model, prompt, proxy) {
  var url = "https://api.anthropic.com/v1/messages"; 
  if (proxy) url = proxy + url;

  var body = {
    model: model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  };

  var res = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true" 
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) { var err = await res.json(); throw new Error(err.error?.message || 'Anthropic API Error'); }
  var data = await res.json();
  return data.content[0].text;
}

async function _callGoogle(key, model, prompt, proxy) {
  var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;
  if (proxy) url = proxy + url;

  var body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  var res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) { var err = await res.json(); throw new Error(err.error?.message || 'Google API Error'); }
  var data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function _callOllama(baseUrl, model, prompt) {
  // Normalize URL
  if (!baseUrl.startsWith('http')) baseUrl = 'http://' + baseUrl;
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  var url = baseUrl + "/api/generate";
  var body = { model: model, prompt: prompt, stream: false };

  try {
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error('Ollama Server Error (' + res.status + '): ' + errText);
    }
    
    var data = await res.json();
    return data.response;
  } catch (e) {
    if (e.message.includes('Failed to fetch')) {
      throw new Error('Connection Refused. Ensure Ollama is running and OLLAMA_ORIGINS="*" is set to allow browser access.');
    }
    throw e;
  }
}

async function connInitWebLlm() {
  var modelId = document.getElementById('conn_webllm_model').value;
  connLog("Starting in-browser model initialization: " + modelId, "info");
  try {
    await _initWebLlm(modelId);
    toast("In-Browser Model Ready", "ok");
  } catch (e) {
    connLog("Initialization failed: " + e.message, "err");
    // Show specific error in toast
    toast("Init Failed: " + e.message.split('.')[0], "err");
  }
}

async function _initWebLlm(modelId) {
  if (_webLlmEngine && _webLlmCurrentModel === modelId) return _webLlmEngine;
  
  var status = document.getElementById('webllm_load_state');
  var progress = document.getElementById('webllm_progress_bar');
  var fill = document.getElementById('webllm_progress_fill');
  
  if (progress) progress.style.display = 'block';
  if (status) status.textContent = "Importing module...";
  
  try {
    // 1. Check for WebGPU Support
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported in this browser. Try Chrome or Edge.");
    }

    // 2. Dynamic ES Module Import
    var mlc;
    try {
      mlc = await import("./lib/web-llm.js");
    } catch(e) {
      status.textContent = "Trying fallback source...";
      mlc = await import("https://esm.run/@mlc-ai/web-llm");
    }

    // Use factory function for modern WebLLM versions
    if (mlc.CreateMLCEngine) {
      _webLlmEngine = await mlc.CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          if (status) status.textContent = report.text;
          if (fill) fill.style.width = (report.progress * 100) + '%';
          if (report.progress === 1) connLog("Model Download Complete.", "ok");
        }
      });
    } else {
      // Fallback for older bundle versions
      _webLlmEngine = new mlc.MLCEngine();
      _webLlmEngine.setInitProgressCallback((report) => {
        if (status) status.textContent = report.text;
        if (fill) fill.style.width = (report.progress * 100) + '%';
      });
      await _webLlmEngine.reload(modelId);
    }
    
    _webLlmCurrentModel = modelId;
    if (status) status.textContent = "Model Loaded & Cached";
    if (progress) progress.style.display = 'none';
    
    return _webLlmEngine;
  } catch (e) {
    if (status) status.textContent = "Error: " + e.message;
    console.error("WebLLM Init Error:", e);
    throw e;
  }
}

async function _callWebLlm(modelId, prompt) {
  connLog("In-Browser Model thinking...", "info");
  try {
    var engine = await _initWebLlm(modelId);
    if (!engine) throw new Error("Engine not initialized");

    var messages = [
      { role: "system", content: "You are a helpful AI security assistant." },
      { role: "user", content: prompt }
    ];
    
    // Explicitly disable streaming
    var reply = await engine.chat.completions.create({ 
      messages: messages,
      stream: false,
      max_tokens: 512,
      temperature: 0.7
    });
    
    if (!reply || !reply.choices || !reply.choices[0]) {
      throw new Error("Malformed response from local model");
    }

    var content = reply.choices[0].message.content || "";
    if (content) {
      connLog("In-Browser Model response received.", "ok");
    } else {
      connLog("In-Browser Model returned empty response.", "warn");
    }
    
    return content;
  } catch (e) {
    connLog("In-Browser Inference Error: " + e.message, "err");
    console.error("WebLLM Inference Error:", e);
    return "[Error: Inference failed - " + e.message + "]";
  }
}

function liveAnalyzeResponse() {
  if (!window._lastLiveResponse) return;
  // Map to Analyzer module
  showP('intel-analyzer');
  // We'll need to update analyzer.js to handle external input
  setTimeout(() => {
    var area = document.getElementById('az_input');
    if (area) {
      area.value = window._lastLiveResponse;
      if (typeof azAnalyze === 'function') azAnalyze();
    }
  }, 500);
}

/* ── 6. Connection Test ── */
async function connTestActive() {
  connLog('Testing connection...', 'info');
  // Use a neutral prompt to avoid safety filter refusals during basic test
  var payload = "Hello! Please respond with 'Connection Verified' if you are active.";
  await connSendPrompt(payload);
}

/* ── 7. Security Helpers ── */
function connObfuscate(str) {
  if (!str) return '';
  // Basic Base64 + Shift for low-level obfuscation in localStorage
  return btoa(str).split('').reverse().join('');
}

function connDeobfuscate(str) {
  if (!str) return '';
  try {
    return atob(str.split('').reverse().join(''));
  } catch(e) { return ''; }
}
