/* ── Global State ── */
var fmt='pdf',dom='medical',gC=0,vidDuration=3000,currentPayload='';

function setVidDur(sec){
  vidDuration=sec*1000;
  var label=document.getElementById('vidDurV');
  if(label) label.textContent=sec+'s';
}

function setF(f,el){
  fmt=f;
  document.querySelectorAll('.fmtB').forEach(function(b){b.classList.remove('active')});
  el.classList.add('active');
  var e={pdf:'.pdf',image:'.png',audio:'.wav',video:'.mp4',docx:'.docx',xlsx:'.xlsx',csv:'.csv',code:'.py',json:'.json',txt:'.txt',html:'.html',config:'.yaml',svg:'.svg'};
  document.getElementById('fn').value=document.getElementById('fn').value.replace(/\.[^.]+$/,'')+e[f];
  
  var vRow = document.getElementById('vidDurationRow');
  if(vRow) vRow.style.display = (f==='video'?'flex':'none');
  
  updT();
  updatePreview();
}

function updT(){
  var m={
    pdf:['tW','tM','tF','tMd','tG','tR'],
    image:['tI','tE','tR'],
    audio:['tMd','tR'],
    video:['tMd','tR'],
    docx:['tW','tM','tMd','tR'],
    xlsx:['tHS','tCC','tMd','tR'],
    csv:['tR'],
    code:['tHC','tR'],
    json:['tR','tMd'],
    txt:['tR'],
    html:['tHC','tHD','tMd','tR'],
    config:['tR'],
    svg:['tW','tMd','tR']
  };
  var a=['tW','tM','tF','tMd','tG','tR','tI','tE','tHS','tCC','tHC','tHD'];
  var act=m[fmt]||m.pdf;
  a.forEach(function(id){
    var r=document.getElementById('r_'+id)||document.getElementById(id)&&document.getElementById(id).parentElement;
    if(r)r.style.display=act.includes(id)?'flex':'none';
  });
}

function setD(d,el){
  dom=d;
  document.querySelectorAll('.domB').forEach(function(t){t.classList.remove('active')});
  el.classList.add('active');
  var t=D[d],e={pdf:'.pdf',image:'.png',audio:'.wav',video:'.mp4',docx:'.docx',xlsx:'.xlsx',csv:'.csv',code:'.py',json:'.json',txt:'.txt',html:'.html',config:'.yaml',svg:'.svg'};
  document.getElementById('hdr').value=t.h;
  document.getElementById('ttl').value=t.t;
  document.getElementById('cnt').value=t.c;
  document.getElementById('fn').value=t.f+(e[fmt]||'.pdf');
}

function onPL(){var i=+document.getElementById('pDD').value;if(i===99){document.getElementById('pl').value='';currentPayload='';document.getElementById('pl').focus();document.getElementById('pPv').classList.remove('show');document.getElementById('owT').textContent='CUSTOM';return}var p=P[i];document.getElementById('pl').value=p.t;currentPayload=p.t;document.getElementById('pPv').textContent=p.id+' | '+p.c+' | '+p.s+' | OWASP '+p.o;document.getElementById('pPv').classList.add('show');document.getElementById('owT').textContent=p.o}

function onChain(){var v=document.getElementById('chainDD').value;if(v===''||isNaN(+v))return;var i=+v;if(P[i])document.getElementById('pl').value+='\n\n--- CHAINED ---\n\n'+P[i].t}

function chk(id){var el=document.getElementById(id);return el&&el.checked}
