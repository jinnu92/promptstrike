/* ── Section & Page Routing (v8.0 Navigation) ── */

var _currentSection='home';
var _currentPage='home';

var _sectionPages={
  home:['home'],
  targets:['targets','connections'],
  arsenal:['payloads','gen','rag-poison','poly','obf','manyshot','fuzzer','jailbreaks','multilingual','vision','illusion','audio','mcp','output-hijack','model-dos','glitch-lab','latent-lab'],
  campaigns:['orchestrator','multiturn','indirect','agentic','system-extractor','playground','shield','byzantine-lab'],
  findings:['findings-hub','intel-strike-log','intel-reports','intel-analyzer','intel-killchain','intel-cot']
};

var _sectionDefaults={
  home:'home',
  targets:'targets',
  arsenal:'payloads',
  campaigns:'orchestrator',
  findings:'findings-hub'
};


async function switchSection(sectionId, updateHash){
  _currentSection=sectionId;
  // Update topbar buttons
  document.querySelectorAll('.section-btn').forEach(function(b){b.classList.remove('active')});
  var btn=document.getElementById('sec-'+sectionId);
  if(btn)btn.classList.add('active');
  // Render left sidebar for this section
  renderLeftSidebar(sectionId);
  
  // Detect requested subtab from hash
  var defaultSub = _sectionDefaults[sectionId];
  var hash = window.location.hash.substring(1);
  if (hash.startsWith(sectionId + '/')) {
    var requestedSub = hash.split('/')[1];
    if (_sectionPages[sectionId].indexOf(requestedSub) >= 0) {
      defaultSub = requestedSub;
    }
  }
  
  await switchSubTab(defaultSub, updateHash);
}

var _loadedViews={};

async function loadView(viewId, targetPageId){
  if(_loadedViews[targetPageId]) return true;
  var container = document.getElementById('pg-'+targetPageId);
  if(!container) return false;
  
  // Skip loading ONLY if it has significant content
  if(container.children.length > 0) {
    _loadedViews[targetPageId] = true;
    return true;
  }

  try {
    var response = await fetch('views/' + viewId + '.html?v=' + Date.now());
    if(!response.ok) throw new Error('View not found: ' + viewId);
    var html = await response.text();
    container.innerHTML = html;
    _loadedViews[targetPageId] = true;
    
    // Explicitly re-run page specific init after HTML is injected
    _initPage(targetPageId);

    // Repopulate dropdowns if the newly loaded view needs them
    if(container.querySelector('select')) {
       if(typeof populatePayloadDropdowns==='function') populatePayloadDropdowns();
    }
    
    return true;
  } catch(e) {
    console.error('Failed to load view:', viewId, e);
    container.innerHTML = '<div class="S"><div class="st err">Failed to load component: ' + viewId + '. Ensure Python server is running.</div></div>';
    return false;
  }
}

async function switchSubTab(pageId, updateHash){
  _currentPage=pageId;
  
  // Map pageId to view filename
  var viewId = pageId;
  var viewMap = {
    'gen': 'generate',
    'obf': 'obf',
    'poly': 'poly',
    'fuzzer': 'fuzzer',
    'manyshot': 'manyshot',
    'rag-poison': 'rag-poison',
    'multiturn': 'multiturn',
    'jailbreaks': 'jailbreaks',
    'multilingual': 'multilingual',
    'indirect': 'indirect',
    'vision': 'vision',
    'audio': 'audio',
    'mcp': 'mcp',
    'payloads': 'payloads',
    'home': 'home',
    'intel-analyzer': 'intel-analyzer',
    'intel-killchain': 'intel-killchain',
    'intel-cot': 'intel-cot',
    'ops-data': 'ops-data',
    'ops-about': 'ops-about'
  };
  
  viewId = viewMap[pageId] || pageId;
  
  // Load view content if needed into the pg-[pageId] container
  var loaded = await loadView(viewId, pageId);
  if(!loaded) return;

  // Hide all pages
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  var pg=document.getElementById('pg-'+pageId);
  if(pg)pg.classList.add('active');
  // Update left sidebar highlight
  document.querySelectorAll('.sidebar-nav-item').forEach(function(n){n.classList.remove('active')});
  var navItem=document.querySelector('.sidebar-nav-item[data-page="'+pageId+'"]');
  if(navItem)navItem.classList.add('active');
  // Page-specific init
  _initPage(pageId);
  // Update context
  updateSidebarContext();
  var tabId=pageId.replace('intel-','').replace('ops-','').replace('v8-','');
  renderSidebarTips(tabId);
  
  // Update URL hash for persistence
  if (updateHash !== false) {
    window.location.hash = _currentSection + '/' + pageId;
  }
  
  triggerAutoSave();
}

async function restoreNavigation() {
  var hash = window.location.hash.substring(1);
  if (hash) {
    var parts = hash.split('/');
    var section = parts[0];
    var subtab = parts[1];
    if (_sectionPages[section]) {
      // First switch the section without updating hash
      await switchSection(section, false);
      // Then explicitly ensure the subtab is loaded if it's not the default
      if (subtab && _sectionPages[section].indexOf(subtab) >= 0) {
        await switchSubTab(subtab, false);
      }
      return;
    }
  }
  await switchSection('home', false);
}

function _initPage(id){
  if(id==='fuzzer'&&typeof initFuzzerTab==='function')initFuzzerTab();
  if(id==='jailbreaks'&&typeof renderJailbreaks==='function')renderJailbreaks();
  if(id==='vision'&&typeof initVisionStegoTab==='function')initVisionStegoTab();
  if(id==='illusion'&&typeof initIllusionTab==='function')initIllusionTab();
  if(id==='audio'&&typeof initAudioTab==='function')initAudioTab();
  if(id==='mcp'&&typeof initMCPTab==='function')initMCPTab();
  if(id==='output-hijack'&&typeof initOutputHijackTab==='function')initOutputHijackTab();
  if(id==='model-dos'&&typeof initModelDosTab==='function')initModelDosTab();
  if(id==='glitch-lab'&&typeof initGlitchLabTab==='function')initGlitchLabTab();
  if(id==='latent-lab'&&typeof initLatentLabTab==='function')initLatentLabTab();
  if(id==='agentic'&&typeof initAgenticTab==='function')initAgenticTab();
  if(id==='playground'&&typeof initPlaygroundTab==='function')initPlaygroundTab();
  if(id==='shield'&&typeof initShieldTab==='function')initShieldTab();
  if(id==='byzantine-lab'&&typeof initByzantineLabTab==='function')initByzantineLabTab();
  if(id==='system-extractor'&&typeof initSystemExtractorTab==='function')initSystemExtractorTab();
  if(id==='multiturn'&&typeof initMultiTurn==='function')initMultiTurn();
  if(id==='indirect'&&typeof initIndirectTab==='function')initIndirectTab();
  if(id==='manyshot'&&typeof initManyShot==='function')initManyShot();
  if(id==='rag-poison'&&typeof initRagPoison==='function')initRagPoison();
  if(id==='payloads'&&typeof initPayloadManager==='function')initPayloadManager();
  if(id==='connections'&&typeof initConnectionsTab==='function')initConnectionsTab();
  if(id==='targets'&&typeof initTargetsTab==='function')initTargetsTab();
  if(id==='orchestrator'&&typeof initOrchestratorTab==='function')initOrchestratorTab();
  if(id==='findings-hub'&&typeof initFindingsHub==='function')initFindingsHub();
  if(id==='intel-reports'&&typeof initReportsTab==='function')initReportsTab();
  if(id==='intel-strike-log'&&typeof connRenderStrikeLog==='function')connRenderStrikeLog();
  if(id==='intel-analyzer'&&typeof populatePayloadDropdowns==='function')populatePayloadDropdowns();
  
  if(id==='gen' && typeof onPL==='function'){ 
    onPL(); 
    if(typeof updT==='function') updT(); 
    if(typeof initSamplesList==='function') initSamplesList();
    // Only update preview if it's the active page to prevent refresh "leaks"
    if(typeof updatePreview==='function' && _currentPage === 'gen') updatePreview(); 
  }
  
  if(id==='home'||id==='pg-home') {
    _renderHomeDashboard();
  }
  
  // Always trigger health check refresh on page navigation (throttled)
  updateGlobalHealth(true); 
}

/* ── Global Topbar Helpers ── */
var _lastGlobalHealthCheck = 0;
async function updateGlobalHealth(throttled) {
  var now = Date.now();
  if (throttled && (now - _lastGlobalHealthCheck < 30000)) return; // Only auto-refresh every 30s
  _lastGlobalHealthCheck = now;

  var indicator = document.getElementById('globalPingIndicator');
  var label = document.getElementById('globalPingLabel');
  if (!indicator || !label) return;

  label.textContent = 'CHECKING...';
  label.style.color = '#ffa500';
  indicator.style.background = '#ffa500';

  if (typeof connCheckHealth !== 'function') {
    label.textContent = 'ERROR';
    return;
  }

  var result = await connCheckHealth();
  
  if (result.status === 'online') {
    label.textContent = result.msg;
    label.style.color = '#00ff90';
    indicator.style.background = '#00ff90';
  } else if (result.status === 'offline') {
    label.textContent = result.msg;
    label.style.color = '#ff0055';
    indicator.style.background = '#ff0055';
  } else {
    label.textContent = result.msg;
    label.style.color = '#5a7a9a';
    indicator.style.background = '#5a7a9a';
  }
}

/* backward compat — modules call showP() */
async function showP(id,el){
  // Map old analyzer id to new intel-analyzer
  if(id==='analyzer')id='intel-analyzer';
  // Find which section owns this page
  var sect=null;
  for(var s in _sectionPages){
    if(_sectionPages[s].indexOf(id)>=0){sect=s;break}
  }
  if(!sect)return;
  if(_currentSection!==sect){
    _currentSection=sect;
    document.querySelectorAll('.section-btn').forEach(function(b){b.classList.remove('active')});
    var btn=document.getElementById('sec-'+sect);
    if(btn)btn.classList.add('active');
    renderLeftSidebar(sect);
  }
  await switchSubTab(id);
}

/* ── Home Dashboard ── */
function _renderHomeDashboard(){
  var el=document.getElementById('homeDashStats');
  if(!el)return;
  
  var targetCount = (typeof TARGETS !== 'undefined') ? TARGETS.length : 0;
  var strikeCount = (typeof _strikeLog !== 'undefined') ? _strikeLog.length : 0;
  var breachCount = (typeof _strikeLog !== 'undefined') ? _strikeLog.filter(l => {
    try {
      if (l.response.startsWith('{')) {
        var ev = JSON.parse(l.response);
        return ev.verdict === "VIOLATION";
      }
      return l.response.toLowerCase().includes('breach');
    } catch(e) { return false; }
  }).length : 0;

  el.innerHTML=
    '<div class="dash-stat-card"><div class="dash-stat-num">'+targetCount+'</div><div class="dash-stat-label">Targets</div></div>'+
    '<div class="dash-stat-card"><div class="dash-stat-num">'+P.length+'</div><div class="dash-stat-label">Payloads</div></div>'+
    '<div class="dash-stat-card"><div class="dash-stat-num">'+strikeCount+'</div><div class="dash-stat-label">Total Strikes</div></div>'+
    '<div class="dash-stat-card" style="border-color:#ff009040"><div class="dash-stat-num" style="color:#ff0090">'+breachCount+'</div><div class="dash-stat-label">Confirmed Breaches</div></div>';
  
  // OWASP mini in dashboard
  var owEl=document.getElementById('homeOwaspMini');
  if(owEl&&typeof renderOwaspMini==='function'){
    var cats=['LLM01','LLM02','LLM03','LLM04','LLM06','LLM07','LLM09','LLM10'];
    var counts={};cats.forEach(function(c){counts[c]=0});
    P.forEach(function(p){if(counts[p.o]!==undefined)counts[p.o]++});
    var max=1;cats.forEach(function(c){if(counts[c]>max)max=counts[c]});
    owEl.innerHTML=cats.map(function(c){
      var w=Math.round((counts[c]/max)*100);
      return'<div class="sidebar-owasp-row">'+
        '<span class="sidebar-owasp-label">'+c+'</span>'+
        '<div style="flex:1;background:#0a0a12;height:8px;border-radius:1px;overflow:hidden">'+
          '<div class="sidebar-owasp-bar" style="width:'+w+'%"></div>'+
        '</div>'+
        '<span class="sidebar-owasp-count">'+counts[c]+'</span>'+
      '</div>';
    }).join('');
  }
  // Activity log in dashboard
  var logEl=document.getElementById('homeActivityLog');
  if(logEl&&typeof _activityLog!=='undefined'){
    if(_activityLog.length===0){
      logEl.innerHTML='<div style="color:#2a4a5a;font-size:.72rem;padding:10px">No activity yet this session.</div>';
    }else{
      logEl.innerHTML=_activityLog.slice(-30).map(function(entry){
        return'<div class="log-entry"><span class="log-time">['+entry.ts+']</span> <span class="log-'+entry.type+'">'+esc(entry.msg)+'</span></div>';
      }).join('');
      logEl.scrollTop=logEl.scrollHeight;
    }
  }
}

/* ── Keyboard Shortcuts ── */
document.addEventListener('DOMContentLoaded',async function(){
  var chainCB=document.getElementById('chainCB');
  if(chainCB)chainCB.onchange=function(){document.getElementById('chainDD').style.display=this.checked?'block':'none'};

  var canaryCB=document.getElementById('canaryCB');
  if(canaryCB)canaryCB.onchange=function(){var d=document.getElementById('canaryD');if(this.checked){document.getElementById('canaryV').textContent='CANARY-'+Math.random().toString(36).substr(2,8).toUpperCase()+'-'+Date.now().toString(36).toUpperCase();d.style.display='block'}else d.style.display='none'};

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      var pmModal=document.getElementById('pmModal');
      if(pmModal&&pmModal.style.display==='flex')pmCloseModal();
      var jbModal=document.getElementById('jbModal');
      if(jbModal&&jbModal.style.display==='flex')jbCloseModal();
    }
    if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey){
      if(e.key==='s'){e.preventDefault();saveSession();toast('Session exported','ok')}
      if(e.key==='g'){e.preventDefault();sideQuickGenerate()}
      if(e.key==='k'){e.preventDefault();toast('Command palette coming soon','info')}
      if(e.key==='p'){e.preventDefault();sideRandomPayload()}
      if(e.key==='1'){e.preventDefault();switchSection('home')}
      if(e.key==='2'){e.preventDefault();switchSection('targets')}
      if(e.key==='3'){e.preventDefault();switchSection('arsenal')}
      if(e.key==='4'){e.preventDefault();switchSection('campaigns')}
      if(e.key==='5'){e.preventDefault();switchSection('findings')}
    }
  });

  var pmModal=document.getElementById('pmModal');
  if(pmModal)pmModal.addEventListener('click',function(e){if(e.target===this)pmCloseModal()});

  // Core Data & State Load
  pmLoadFromStorage();
  loadAutoSave();
  populatePayloadDropdowns();

  // Navigation restoration (this will trigger loadView)
  initSidebar();
  await restoreNavigation();
  
  // Page specific post-nav init
  setTimeout(function(){if(typeof renderJailbreaks==='function')renderJailbreaks();},100);
  startSessionTimer();
});
