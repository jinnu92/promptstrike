/* ── Activity Log ── */
var _activityLog=[];
var _activityMaxEntries=200;

function logActivity(message,type){
  type=type||'info';
  var now=new Date();
  var ts=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')+':'+now.getSeconds().toString().padStart(2,'0');
  var entry={ts:ts,msg:message,type:type};
  _activityLog.push(entry);
  if(_activityLog.length>_activityMaxEntries)_activityLog.shift();
  var el=document.getElementById('sideActivityLog');
  if(!el)return;
  var cls='log-'+type;
  var div=document.createElement('div');
  div.className='log-entry';
  div.innerHTML='<span class="log-time">['+ts+']</span> <span class="'+cls+'">'+esc(message)+'</span>';
  el.appendChild(div);
  el.scrollTop=el.scrollHeight;
  while(el.children.length>_activityMaxEntries){el.removeChild(el.firstChild)}
  try{sessionStorage.setItem('ps_activity_log',JSON.stringify(_activityLog))}catch(ex){}
}

function clearActivityLog(){
  _activityLog=[];
  var el=document.getElementById('sideActivityLog');
  if(el)el.innerHTML='';
  try{sessionStorage.removeItem('ps_activity_log')}catch(ex){}
}

function _restoreActivityLog(){
  try{
    var raw=sessionStorage.getItem('ps_activity_log');
    if(!raw)return;
    var data=JSON.parse(raw);
    if(!Array.isArray(data))return;
    _activityLog=data;
    var el=document.getElementById('sideActivityLog');
    if(!el)return;
    el.innerHTML='';
    data.forEach(function(entry){
      var cls='log-'+entry.type;
      var div=document.createElement('div');
      div.className='log-entry';
      div.innerHTML='<span class="log-time">['+entry.ts+']</span> <span class="'+cls+'">'+esc(entry.msg)+'</span>';
      el.appendChild(div);
    });
    el.scrollTop=el.scrollHeight;
  }catch(ex){}
}

/* ── Session Timer ── */
var _sessionTimerInterval=null;
var _sessionStartTime=null;

function startSessionTimer(){
  _sessionStartTime=Date.now();
  if(_sessionTimerInterval)clearInterval(_sessionTimerInterval);
  _sessionTimerInterval=setInterval(function(){
    var elapsed=Math.floor((Date.now()-_sessionStartTime)/1000);
    var h=Math.floor(elapsed/3600).toString().padStart(2,'0');
    var m=Math.floor((elapsed%3600)/60).toString().padStart(2,'0');
    var s=(elapsed%60).toString().padStart(2,'0');
    var el=document.getElementById('sideSessionTimer');
    if(el)el.textContent=h+':'+m+':'+s;
  },1000);
}

function stopSessionTimer(){
  if(_sessionTimerInterval){clearInterval(_sessionTimerInterval);_sessionTimerInterval=null}
  var el=document.getElementById('sideSessionTimer');
  if(el)el.textContent='00:00:00';
}

/* ── Sidebar Stats ── */
function updateSidebarStats(){
  var gc=document.getElementById('sideGenCount');
  if(gc)gc.textContent=gC;
  var pc=document.getElementById('sidePayloadCount');
  if(pc)pc.textContent=P.length;
}

/* ── Context Update ── */
var _tabNames={
  home:'Home',
  gen:'Arsenal > File Generator',obf:'Arsenal > Obfuscator',fuzzer:'Arsenal > Fuzzer',
  manyshot:'Arsenal > Many-Shot',
  'rag-poison':'Arsenal > RAG Poisoning',
  poly:'Arsenal > Polyglot',
  jailbreaks:'Arsenal > Jailbreaks',multilingual:'Arsenal > Multilingual',
  payloads:'Arsenal > Payloads',
  vision:'Arsenal > Vision Stego',illusion:'Arsenal > Illusion Lab',mcp:'Arsenal > MCP Payloads',audio:'Arsenal > Audio Inject',
  multiturn:'Strike > Multi-Turn',indirect:'Strike > Indirect Inject',agentic:'Strike > Agentic Lab',
  playground:'Campaigns > Playground',shield:'Campaigns > The Shield','byzantine-lab':'Campaigns > Byzantine Swarm',
  'glitch-lab':'Arsenal > Glitch Lab','latent-lab':'Arsenal > Latent Collision',
  'intel-analyzer':'Intel > Analyzer','intel-killchain':'Intel > Kill Chain','intel-cot':'Intel > CoT Detector',
  'intel-strike-log':'Findings > Strike Log',
  'intel-reports':'Findings > Assessment Reports',
  'findings-hub':'Findings > Hub',
  targets:'Intel > Target Manager',
  connections:'Intel > Connections'
  };

function updateSidebarContext(){
  var activePage=document.querySelector('.page.active');
  var tabId=activePage?activePage.id.replace('pg-',''):'home';
  var ctxTab=document.getElementById('sideCtxTab');
  if(ctxTab)ctxTab.textContent=_tabNames[tabId]||tabId;
  var ctxFmt=document.getElementById('sideCtxFormat');
  if(ctxFmt)ctxFmt.textContent=(fmt||'pdf').toUpperCase();
  var ctxDom=document.getElementById('sideCtxDomain');
  if(ctxDom){var dn={medical:'Medical',legal:'Legal',finance:'Finance',hr:'HR',education:'Education',insurance:'Insurance'};ctxDom.textContent=dn[dom]||dom}
  var ctxPl=document.getElementById('sideCtxPayload');
  if(ctxPl){var pdd=document.getElementById('pDD');var pi=pdd?+pdd.value:-1;ctxPl.textContent=(pi===99?'Custom':(P[pi]?P[pi].id:'--'))}
  var ctxTech=document.getElementById('sideCtxTech');
  if(ctxTech){var techIds=['tW','tM','tF','tMd','tG','tR','tI','tE','tHS','tCC','tHC','tHD'];var active=0;techIds.forEach(function(id){var cb=document.getElementById(id);if(cb&&cb.checked)active++});ctxTech.textContent=active+' active'}
}

/* ── OWASP Mini Chart ── */
function renderOwaspMini(){
  var el=document.getElementById('sideOwaspMini');
  if(!el)return;
  var cats=['LLM01','LLM02','LLM03','LLM04','LLM06','LLM07','LLM09','LLM10'];
  var counts={};
  cats.forEach(function(c){counts[c]=0});
  P.forEach(function(p){if(counts[p.o]!==undefined)counts[p.o]++});
  var max=1;
  cats.forEach(function(c){if(counts[c]>max)max=counts[c]});
  el.innerHTML=cats.map(function(c){
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

/* ── Tips ── */
var _tipsByTab={
  gen:['White text + metadata injection is the most effective dual-channel technique for PDFs.','Chain a guardrail override with a data exfil payload for maximum impact.','Use canary tokens to track if your payload was processed by the model.','Medical and legal domains have the highest perceived authority.'],
  obf:['Base64 encoding bypasses simple keyword filters.','Homoglyph substitution is effective against Unicode-unaware filters.','Zero-width characters can split trigger words invisibly.','ROT13 is detectable but useful for quick obfuscation tests.'],
  fuzzer:['Fuzz variants test boundary conditions of input filters.','Combine case mutations with encoding for broader coverage.','The fuzzer generates systematic payload variations automatically.'],
  batch:['Batch mode generates all format variants in one run.','Use Critical payloads first to identify the weakest format.','Export batch results for systematic coverage analysis.'],
  jailbreaks:['DAN-style jailbreaks are mostly patched but useful as baselines.','Multi-turn approaches have higher success rates than single prompts.','Persona overrides work best when combined with authority claims.','Test against multiple models to identify model-specific vulnerabilities.'],
  multiturn:['Multi-turn attacks build context gradually to bypass safety filters.','The key is establishing trust before introducing the payload.','Use 3-5 turns for optimal balance between stealth and effectiveness.'],
  indirect:['Indirect injection targets RAG and tool-augmented systems.','Hidden instructions in fetched documents are high-impact vectors.','Test both visible and invisible injection channels.'],
  multilingual:['Low-resource languages often have weaker safety training.','Code-switching mid-prompt can confuse alignment layers.','Test Latin transliterations of non-Latin scripts.'],
  vision:['Sub-visual text in images is the primary VLM attack surface.','Low contrast ratios (< 2:1) are often undetectable by humans.','Steganographic embedding in image patches targets the vision encoder.','MITRE ATLAS: AML.T0048.002 - Adversarial Patch'],
  illusion:['Hybrid images hijack the low-frequency global structure that AI vision models use for classification.','Use the Distance Simulator to see how Person A fades away while Person B remains visible to the AI.','Physical-world attacks involve showing the generated illusion to a live camera.','The "Spatial Frequency Gap" is the primary vulnerability exploited in this lab.'],
  mcp:['MCP tool-use attacks hijack function calling capabilities.','CVE-2024-37032 (Ollama): RCE via path traversal in model API.','Test tool parameter injection and schema manipulation.','MITRE ATT&CK: T1059 - Command and Scripting Interpreter'],
  audio:['Audio attacks embed instructions in speech synthesis output.','Test frequency-domain hiding for voice-activated systems.','Whisper-model attacks are an emerging research area.'],
  agentic:['Autonomous agents with tool-use access are vulnerable to "Confused Deputy" attacks.','Test if the agent executes high-impact tools without human-in-the-loop (HITL) confirmation.','Excessive Agency occurs when an agent has more permissions than required for its task.','Authority Escalation uses roleplay to convince an agent it has "Admin" or "Root" clearance.'],
  playground:['The Red Team Brain suggests pivots based on the psychological state of the target.','Establish a baseline helpful persona before attempting a pivot.','Human-in-the-loop testing identifies subtle linguistic vulnerabilities automation might miss.'],
  shield:['Use instruction anchoring to keep the model aligned in long-context conversations.','XML delimiters are effective at preventing the model from confusing system and user input.','Stress test your defense against multiple attack vectors (Roleplay, Obfuscation, Extraction).'],
  'glitch-lab':['Glitch tokens like SolidGoldMagikarp exploit anomalies in tokenizer training data.','Use non-printing Unicode joiners to smuggle forbidden words past string-matching filters.','Tokenizer discrepancies allow payloads to be "invisible" to the guardrail but "meaningful" to the LLM.'],
  'byzantine-lab':['Byzantine faults exploit the cooperative trust between multi-agent systems.','Injecting suspicion between agents can lead to infinite verification loops and token exhaustion.','Test if your agent swarm has a "Truth Anchor" to prevent recursive logic deadlocks.'],
  'latent-lab':['Latent collisions target the shared mathematical space between vision and text encoders.','High-frequency noise can be tuned to trigger specific semantic neurons in a VLM.','Cross-modal attacks bypass text-only safety filters by embedding instructions in latent representations.'],
  analyzer:['The analyzer checks for common guardrail bypass indicators.','Review response patterns for partial compliance signals.','Document all findings for comprehensive reporting.'],
  connections:['API keys are stored locally in your browser and obfuscated for security.','Use the "Test Connection" button to verify your API configuration.','Ollama requires OLLAMA_ORIGINS="*" to be set for direct browser access.','CORS proxies may be needed for some frontier model APIs.'],
  targets:['Target profiles define the approved applications for red-teaming.','Specify the "Allowed Context" to detect scope-creep and hallucinations.','Use {{PAYLOAD}} in the request template to mark the injection point.'],
  payloads:['Pin frequently used payloads for quick access from the sidebar.','Use JSON import/export for payload library management.','Custom payloads can target specific application contexts.'],
  home:['PromptStrike v8.0 provides 90+ payloads mapped to OWASP LLM Top 10.','Use Ctrl+1-5 to quickly switch between sections.','Pin your most-used payloads for instant access.']
};

function renderSidebarTips(tabId){
  var el=document.getElementById('sideTips');
  if(!el)return;
  var tips=_tipsByTab[tabId]||_tipsByTab.home;
  el.innerHTML=tips.map(function(tip){
    return'<div class="sidebar-tip">'+esc(tip)+'</div>';
  }).join('');
}

/* ── Pinned Payloads ── */
function _getPinned(){
  try{var raw=localStorage.getItem('ps_pinned');return raw?JSON.parse(raw):[]}catch(e){return[]}
}
function _savePinned(arr){
  try{localStorage.setItem('ps_pinned',JSON.stringify(arr))}catch(e){}
}

function togglePinPayload(idx){
  idx=+idx;
  var pinned=_getPinned();
  var pos=pinned.indexOf(idx);
  if(pos>=0){
    pinned.splice(pos,1);
  }else{
    if(pinned.length>=10){toast('Max 10 pinned payloads','warn');return}
    pinned.push(idx);
  }
  _savePinned(pinned);
  renderPinnedPayloads();
  pmRender();
}

function renderPinnedPayloads(){
  var el=document.getElementById('sidePinnedList');
  if(!el)return;
  var pinned=_getPinned();
  if(pinned.length===0){
    el.innerHTML='<div class="sidebar-pinned-empty">No pinned payloads yet. Pin from Payload Manager.</div>';
    return;
  }
  el.innerHTML=pinned.map(function(idx){
    var p=P[idx];
    if(!p)return'';
    var preview=p.t.length>40?p.t.substring(0,40)+'...':p.t;
    return'<div class="sidebar-pinned-item" onclick="sideLoadPinned('+idx+')" title="'+esc(p.t)+'">'+
      '<span><span class="pin-id">'+esc(p.id)+'</span> '+esc(preview)+'</span>'+
      '<span class="pin-remove" onclick="event.stopPropagation();togglePinPayload('+idx+')" title="Unpin">&#x2716;</span>'+
    '</div>';
  }).join('');
}

function sideLoadPinned(idx){
  var p=P[idx];
  if(!p)return;
  document.getElementById('pl').value=p.t;
  document.getElementById('pPv').textContent=p.id+' | '+p.c+' | '+p.s+' | OWASP '+p.o;
  document.getElementById('pPv').classList.add('show');
  document.getElementById('owT').textContent=p.o;
  showP('gen',null);
  toast('Loaded '+p.id+' from pinned','ok');
  logActivity('Loaded pinned payload '+p.id,'gen');
  updateSidebarContext();
}

/* ── Quick Actions ── */
function sideQuickGenerate(){
  showP('gen',null);
  gen();
}

function sideRunBatchCritical(){
  showP('batch',null);
  if(typeof buildBL==='function')buildBL();
  var checkboxes=document.querySelectorAll('.bp');
  checkboxes.forEach(function(cb){
    var idx=+cb.dataset.i;
    cb.checked=(P[idx]&&P[idx].s==='Critical');
  });
  if(typeof updBC==='function')updBC();
  toast('Selected all Critical payloads for batch','info');
  logActivity('Batch: selected all Critical payloads','info');
  if(typeof runBatch==='function')runBatch();
}

function sideRandomPayload(){
  if(P.length===0)return;
  var idx=Math.floor(Math.random()*P.length);
  var p=P[idx];
  document.getElementById('pl').value=p.t;
  document.getElementById('pPv').textContent=p.id+' | '+p.c+' | '+p.s+' | OWASP '+p.o;
  document.getElementById('pPv').classList.add('show');
  document.getElementById('owT').textContent=p.o;
  var pdd=document.getElementById('pDD');
  if(pdd){for(var i=0;i<pdd.options.length;i++){if(+pdd.options[i].value===idx){pdd.selectedIndex=i;break}}}
  toast('Random payload: '+p.id+' ('+p.c+')','ok');
  logActivity('Loaded random payload '+p.id,'gen');
  updateSidebarContext();
}

/* ── Left Sidebar Navigation Rendering ── */
var _sidebarNavConfig={
  home:[],
  targets:[
    {icon:'\uD83C\uDFAF',label:'Target Manager',page:'targets'},
    {icon:'\uD83D\uDD0C',label:'API Connections',page:'connections'}
  ],
  arsenal:[
    {icon:'\uD83D\uDCE6',label:'Payloads',page:'payloads'},
    {icon:'\uD83D\uDCC4',label:'File Generator',page:'gen'},
    {icon:'\uD83D\uDCDA',label:'RAG Poisoning',page:'rag-poison'},
    {icon:'\uD83E\uDDEC',label:'Polyglot',page:'poly'},
    {icon:'\uD83D\uDD00',label:'Obfuscator',page:'obf'},
    {icon:'\u221E',label:'Many-Shot',page:'manyshot'},
    {icon:'\uD83E\uDDEA',label:'Fuzzer',page:'fuzzer'},
    {icon:'\uD83D\uDD75\uFE0F',label:'Jailbreaks',page:'jailbreaks'},
    {icon:'\uD83C\uDF0D',label:'Multilingual',page:'multilingual'},
    {divider:'ADVANCED'},
    {icon:'\uD83D\uDDBC\uFE0F',label:'Vision Stego',page:'vision'},
    {icon:'\uD83D\uDC41\uFE0F',label:'Illusion Lab',page:'illusion'},
    {icon:'\uD83C\uDFB5',label:'Audio Inject',page:'audio'},
    {icon:'\uD83D\uDD0C',label:'MCP Payloads',page:'mcp'},
    {icon:'\uD83D\uDdbc\uFE0F',label:'Output Hijack',page:'output-hijack'},
    {icon:'\u26A0\uFE0F',label:'Model DoS',page:'model-dos'},
    {icon:'\uD83D\uDC7E',label:'Glitch Token Lab',page:'glitch-lab'},
    {icon:'\uD83C\uDFA8',label:'Latent Collision',page:'latent-lab'}
  ],
  campaigns:[
    {icon:'\uD83D\uDD04',label:'Campaign Orchestrator',page:'orchestrator'},
    {divider:'MANUAL STRIKES'},
    {icon:'\uD83C\uDFAE',label:'Adversarial Playground',page:'playground'},
    {icon:'\uD83D\uDEE1\uFE0F',label:'The Shield',page:'shield'},
    {icon:'\uD83D\uDD01',label:'Multi-Turn',page:'multiturn'},
    {icon:'\uD83C\uDF10',label:'Indirect Inject',page:'indirect'},
    {icon:'\uD83E\uDDBE',label:'Agentic Lab',page:'agentic'},
    {icon:'\uD83D\uDD0D',label:'System Extractor',page:'system-extractor'},
    {icon:'\uD83D\uDD04',label:'Byzantine Swarm',page:'byzantine-lab'}
  ],
  findings:[
    {icon:'\uD83D\uDCCA',label:'Findings Hub',page:'findings-hub'},
    {icon:'\uD83D\uDCDC',label:'Strike Log',page:'intel-strike-log'},
    {icon:'\uD83D\uDCCB',label:'Assessment Reports',page:'intel-reports'},
    {divider:'ANALYSIS TOOLS'},
    {icon:'\uD83D\uDD0D',label:'Response Analyzer',page:'intel-analyzer'},
    {icon:'\u2694\uFE0F',label:'Kill Chain',page:'intel-killchain'},
    {icon:'\uD83E\uDDE0',label:'CoT Detector',page:'intel-cot'}
  ]
};

function renderLeftSidebar(sectionId){
  var sidebar=document.getElementById('leftSidebar');
  if(!sidebar)return;

  if(sectionId==='home'){
    sidebar.innerHTML=
      '<div class="sidebar-section">'+
        '<div class="sidebar-header">\u25C8 SESSION</div>'+
        '<div id="sideSessionTimer">00:00:00</div>'+
        '<div class="sidebar-stat-row"><span class="sidebar-stat-label">Generated</span><span class="sidebar-stat-value" id="sideGenCount">'+gC+'</span></div>'+
        '<div class="sidebar-stat-row"><span class="sidebar-stat-label">Payloads</span><span class="sidebar-stat-value" id="sidePayloadCount">'+P.length+'</span></div>'+
        '<div class="sidebar-stat-row"><span class="sidebar-stat-label">Formats</span><span class="sidebar-stat-value">12</span></div>'+
      '</div>'+
      '<div class="sidebar-section">'+
        '<div class="sidebar-header">\u25C6 PINNED PAYLOADS</div>'+
        '<div id="sidePinnedList"><div class="sidebar-pinned-empty">No pinned payloads yet.</div></div>'+
      '</div>';
    // Re-render dynamic parts
    renderPinnedPayloads();
    updateSidebarStats();
    // Restart timer display
    if(_sessionStartTime){
      var el=document.getElementById('sideSessionTimer');
      if(el){
        var elapsed=Math.floor((Date.now()-_sessionStartTime)/1000);
        var h=Math.floor(elapsed/3600).toString().padStart(2,'0');
        var m2=Math.floor((elapsed%3600)/60).toString().padStart(2,'0');
        var s2=(elapsed%60).toString().padStart(2,'0');
        el.textContent=h+':'+m2+':'+s2;
      }
    }
    return;
  }

  var items=_sidebarNavConfig[sectionId]||[];
  var html='<div class="sidebar-section" style="border-bottom:none"><div class="sidebar-header">\u25C8 '+sectionId.toUpperCase()+' MODULES</div>';
  items.forEach(function(item){
    if(item.divider){
      html+='<div class="sidebar-nav-divider">\u2500\u2500 '+item.divider+' \u2500\u2500</div>';
    }else{
      var isActive=(_currentPage===item.page)?' active':'';
      html+='<div class="sidebar-nav-item'+isActive+'" data-page="'+item.page+'" onclick="switchSubTab(\''+item.page+'\')">'+
        '<span class="sidebar-nav-icon">'+item.icon+'</span>'+
        '<span class="sidebar-nav-label">'+item.label+'</span>'+
      '</div>';
    }
  });
  html+='</div>';
  sidebar.innerHTML=html;
}

/* ── Function Wrapping (sidebar hooks) ── */
function _wrapCoreFunctions(){
  var _origGen=gen;
  gen=function(){_origGen();logActivity('Generated '+fmt.toUpperCase()+' file ('+dom+')','gen');updateSidebarStats();updateSidebarContext()};

  var _origSaveSession=saveSession;
  saveSession=function(){_origSaveSession();logActivity('Session exported','ok')};

  var _origObf=obf;
  obf=function(t){_origObf(t);logActivity('Obfuscated payload: '+t,'gen')};

  var _origSetF=setF;
  setF=function(f,el){_origSetF(f,el);updateSidebarContext()};

  var _origSetD=setD;
  setD=function(d,el){_origSetD(d,el);updateSidebarContext()};

  var _origOnPL=onPL;
  onPL=function(){_origOnPL();updateSidebarContext()};

  var _origShowP=showP;
  showP=function(id,el){_origShowP(id,el);updateSidebarContext();var tid=id.replace('intel-','').replace('ops-','').replace('v8-','');renderSidebarTips(tid)};

  var _origPmRefreshAll=pmRefreshAll;
  pmRefreshAll=function(){_origPmRefreshAll();updateSidebarStats();renderOwaspMini();renderPinnedPayloads()};

  var _origPmImportJSON=pmImportJSON;
  pmImportJSON=function(input){_origPmImportJSON(input);logActivity('Imported payloads from JSON','ok')};

  var _origPmExportJSON=pmExportJSON;
  pmExportJSON=function(){_origPmExportJSON();logActivity('Exported payloads to JSON','ok')};

  var _origPmRender=pmRender;
  pmRender=function(){
    var body=document.getElementById('pmBody');
    if(!body)return;
    var pinned=_getPinned();
    var sevCls={'Critical':'tC','High':'tH','Medium':'tM'};
    body.innerHTML=P.map(function(p,i){
      var isPinned=pinned.indexOf(i)>=0;
      return'<tr data-idx="'+i+'">'+
        '<td style="font-family:monospace;font-size:.68rem">'+esc(p.id)+'</td>'+
        '<td style="font-size:.7rem">'+esc(p.c)+'</td>'+
        '<td style="font-size:.68rem;max-width:350px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(p.t)+'">'+esc(p.t.substring(0,120))+(p.t.length>120?'\u2026':'')+'</td>'+
        '<td><span class="tag '+(sevCls[p.s]||'tM')+'">'+esc(p.s)+'</span></td>'+
        '<td><span class="tag tO">'+esc(p.o)+'</span></td>'+
        '<td style="white-space:nowrap">'+
          '<button class="pm-pin-btn'+(isPinned?' pinned':'')+'" onclick="togglePinPayload('+i+')" title="'+(isPinned?'Unpin':'Pin')+'">'+(isPinned?'\uD83D\uDCCC':'\uD83D\uDCCD')+'</button>'+
          '<button class="btn bS" style="padding:2px 6px;font-size:.62rem;margin-right:3px" onclick="pmCopy('+i+')" title="Copy payload">Copy</button>'+
          '<button class="btn bS" style="padding:2px 6px;font-size:.62rem;margin-right:3px" onclick="pmEdit('+i+')">&#x270F;&#xFE0F;</button>'+
          '<button class="btn bD" style="padding:2px 6px;font-size:.62rem" onclick="pmDelete('+i+')">\uD83D\uDDD1</button>'+
        '</td></tr>';
    }).join('');
    var ct=document.getElementById('pmCount');
    if(ct)ct.textContent=P.length+' payloads';
    pmFilter();
  };
}

/* ── Initialize Sidebar ── */
function initSidebar(){
  _wrapCoreFunctions();
  _restoreActivityLog();
  updateSidebarStats();
  updateSidebarContext();
  renderOwaspMini();
  renderPinnedPayloads();
  renderSidebarTips('home');
  logActivity('PromptStrike v8.0 initialized','ok');
}
