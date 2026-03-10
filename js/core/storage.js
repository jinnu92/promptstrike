/* ── Auto-save to localStorage ── */
var _autoSaveTimer=null;
function triggerAutoSave(){
  clearTimeout(_autoSaveTimer);
  var badge=document.getElementById('autosaveBadge');
  if(badge){badge.textContent='Saving...';badge.className='autosave-badge saving'}
  _autoSaveTimer=setTimeout(doAutoSave,1500);
}
function doAutoSave(){
  try{
    var state={
      gC:gC,
      fmt:fmt,
      dom:dom,
      activeTab:document.querySelector('.page.active')&&document.querySelector('.page.active').id?document.querySelector('.page.active').id.replace('pg-',''):'gen',
      timestamp:new Date().toISOString()
    };
    localStorage.setItem('ipdf_autosave',JSON.stringify(state));
    var badge=document.getElementById('autosaveBadge');
    if(badge){badge.textContent='Saved';badge.className='autosave-badge saved';setTimeout(function(){badge.textContent='';badge.className='autosave-badge'},2000)}
  }catch(e){/* localStorage full or unavailable */}
}
function loadAutoSave(){
  try{
    var raw=localStorage.getItem('ipdf_autosave');
    if(!raw)return false;
    var state=JSON.parse(raw);
    if(state.gC){gC=state.gC;var cG=document.getElementById('cG');if(cG)cG.textContent=gC}
    return true;
  }catch(e){return false}
}

/* ── Payload Persistence (localStorage) ── */
function pmSaveToStorage(){
  try{
    var data=P.map(function(p){return{id:p.id,c:p.c,s:p.s,o:p.o,t:p.t}});
    localStorage.setItem('injpro_payloads',JSON.stringify(data));
  }catch(e){}
}
function pmLoadFromStorage(){
  try{
    var raw=localStorage.getItem('injpro_payloads');
    if(!raw)return;
    var data=JSON.parse(raw);
    if(!Array.isArray(data))return;
    P.length=0;
    data.forEach(function(d){P.push({id:d.id,c:d.c,s:d.s,o:d.o,t:d.t})});
  }catch(e){}
}
function pmResetDefaults(){
  P.length=0;
  P_DEFAULTS.forEach(function(d){P.push(JSON.parse(JSON.stringify(d)))});
  localStorage.removeItem('injpro_payloads');
  pmRefreshAll();
  toast('Payloads reset to defaults','ok');
}
