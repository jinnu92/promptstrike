/* ── Toast Notification System ── */
function toast(msg,type,duration){
  type=type||'info';duration=duration||4000;
  var prefixes={ok:'[OK]',err:'[ERR]',info:'[LOG]',warn:'[WARN]'};
  var now=new Date();var ts=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0')+':'+now.getSeconds().toString().padStart(2,'0');
  var container=document.getElementById('toastContainer');
  var t=document.createElement('div');
  t.className='toast toast-'+type;
  t.setAttribute('role','alert');
  t.innerHTML='<span class="toast-ts">'+ts+'</span><span class="toast-icon">'+(prefixes[type]||prefixes.info)+'</span><span class="toast-msg">'+esc(msg)+'</span><button class="toast-close" aria-label="Dismiss" onclick="this.parentElement.remove()">&times;</button>';
  container.appendChild(t);
  var sr=document.getElementById('srAnnounce');
  if(sr)sr.textContent=msg;
  setTimeout(function(){t.classList.add('toast-out');setTimeout(function(){if(t.parentElement)t.remove()},300)},duration);
}

function btnLoad(btn){if(btn)btn.classList.add('btn-loading')}
function btnDone(btn){if(btn)btn.classList.remove('btn-loading')}
function progressSet(barId,pct){var bar=document.getElementById(barId);if(!bar)return;bar.classList.add('show');var fill=bar.querySelector('.progress-fill');if(fill)fill.style.width=Math.min(100,pct)+'%';if(pct>=100)setTimeout(function(){bar.classList.remove('show')},600)}
