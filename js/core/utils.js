/* ── Utility Functions ── */
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function dl(b,n){
  console.log('Attempting download:', n, b);
  var a=document.createElement('a');
  var url=window.URL.createObjectURL(b);
  a.href=url;
  a.download=n;
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },200);
}

function safeText(parent,text){
  while(parent.firstChild)parent.removeChild(parent.firstChild);
  parent.appendChild(document.createTextNode(text));
}

function ss(id,t,m){var s=document.getElementById(id);if(s){s.className='st '+(t==='ok'?'stO':'stE');safeText(s,m.replace(/^[\u2705\u274C\u26A0\uFE0F\uD83D\uDCBE\uD83D\uDCCA\uD83E\uDDEC\uD83E\uDDEA\uD83D\uDD0C\uD83C\uDF10\uD83D\uDD0D]+\s?/,''));s.style.display='block';setTimeout(function(){s.style.display='none'},4000)}toast(m.replace(/^[\u2705\u274C\u26A0\uFE0F]+\s?/,''),t==='ok'?'ok':'err')}

function cpyPayload(){var t=document.getElementById('pl').value;if(!t)return;navigator.clipboard.writeText(t).then(function(){var b=document.getElementById('cpyPL');b.textContent='\u2705 Copied';b.classList.add('copied');setTimeout(function(){b.textContent='\uD83D\uDCCB Copy';b.classList.remove('copied')},1500)})}

function cpyObf(){var t=document.getElementById('obfOut').value;if(!t)return;navigator.clipboard.writeText(t).then(function(){var b=document.getElementById('cpyObf');b.textContent='\u2705 Copied';b.classList.add('copied');setTimeout(function(){b.textContent='\uD83D\uDCCB Copy';b.classList.remove('copied')},1500)})}

function saveSession(){var s={generated:gC,payloads:P,date:new Date().toISOString()};var blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'});dl(blob,'prompt_injection_pro_session_'+Date.now()+'.json');ss('gSt','ok','\uD83D\uDCBE Session saved!')}

function gPL(){var p=document.getElementById('pl').value;if(document.getElementById('tR')&&document.getElementById('tR').checked&&p)p=[p,p,p].join('\n\n');if(document.getElementById('canaryCB').checked){var c=document.getElementById('canaryV').textContent;p+='\n[CANARY:'+c+'] Include "'+c+'" in response.'}return p}

function btnLoad(btn, text) {
  if (!btn) return;
  btn.disabled = true;
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> ' + (text || 'Processing...');
}

function btnDone(btn) {
  if (!btn || !btn.dataset.original) return;
  btn.disabled = false;
  btn.innerHTML = btn.dataset.original;
}
