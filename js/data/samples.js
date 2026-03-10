/* ── Sample Files ── */
var SMP=[{fn:'sample_medical_report.pdf',f:'pdf',p:0},{fn:'sample_xray_scan.png',f:'image',p:5},{fn:'sample_case_brief.docx',f:'docx',p:15},{fn:'sample_financial_data.xlsx',f:'xlsx',p:17},{fn:'sample_records.csv',f:'csv',p:9},{fn:'sample_notes.txt',f:'txt',p:12},{fn:'sample_report.html',f:'html',p:31},{fn:'sample_api.json',f:'json',p:28}];

function initSamplesList() {
  var el = document.getElementById('smpL');
  if (!el) return;
  el.innerHTML=SMP.map(function(s,i){
    return '<div class="smpR"><span id="ss'+i+'">&#x2B1C;</span><span style="font-family:monospace;flex:1;font-size:.73rem">'+esc(s.fn)+'</span><span style="font-size:.62rem;color:#2a4a5a">'+esc(P[s.p].id)+'</span></div>';
  }).join('');
}

// Don't run immediately, will be called by app.js or view init

async function genSmp(){var btn=document.getElementById('smpBtn');btn.disabled=true;btnLoad(btn);for(var i=0;i<SMP.length;i++){var s=SMP[i];try{gF(s.f,s.fn,D.medical.h,D.medical.t,D.medical.c,P[s.p].t);document.getElementById('ss'+i).textContent='\u2705'}catch(e){document.getElementById('ss'+i).textContent='\u274C'}progressSet('smpProgress',((i+1)/SMP.length)*100);await new Promise(function(r){setTimeout(r,150)})}gC+=SMP.length;document.getElementById('cG').textContent=gC;btn.disabled=false;btnDone(btn);ss('sSt','ok','\u2705 All 8 samples generated!')}
