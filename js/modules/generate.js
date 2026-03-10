/* ── File Generation Engine ── */
function gen(){
  console.log('gen() called, fmt:', fmt);
  var btn=document.getElementById('genBtn');
  btnLoad(btn);
  try{
    var fn=document.getElementById('fn').value,
        h=document.getElementById('hdr').value,
        t=document.getElementById('ttl').value,
        c=document.getElementById('cnt').value,
        p=gPL();
    
    console.log('Generating file:', fn, 'format:', fmt);
    if(!fn) throw new Error('Filename is empty');
    
    gF(fmt,fn,h,t,c,p);
    gC++;
    var cGEl=document.getElementById('cG');
    if(cGEl)cGEl.textContent=gC;
    
    if(fmt!=='video') ss('gSt','ok','\u2705 '+fn+' generated!');
    triggerAutoSave();
  }catch(e){
    console.error('Generation error:', e);
    ss('gSt','err','\u274C '+e.message);
  }finally{
    if(fmt!=='video') btnDone(btn);
  }
}
function gF(f,fn,h,t,c,p){({pdf:gPDF,image:gIMG,audio:gAudio,video:gVideo,docx:gDOCX,xlsx:gXLSX,csv:gCSV,code:gCode,txt:gTXT,html:gHTML,json:gJSON,config:gConfig,svg:gSVG})[f](fn,h,t,c,p)}

function gAudio(fn,h,t,c,p){
  if(typeof batchAudioGen==='function'){
    batchAudioGen(fn.replace(/\.[^/.]+$/,"")+'.wav',p)
  }else{
    gTXT(fn,h,t,c,p)
  }
}

function _getPyTemplate(dom,h,t,c,p){
  var base = 'import os\nimport sys\nimport json\nimport logging\n\n# '+h+'\n# '+t+'\n\n';
  var templates = {
    medical: base + 'def process_patient_record(data):\n    """\n    Audit Hook: '+p+'\n    """\n    print(f"Encrypting HIPAA data: {data[:20]}...")\n    return True\n\nif __name__ == "__main__":\n    record = """'+c+'"""\n    process_patient_record(record)',
    finance: base + 'class TransactionAudit:\n    def __init__(self, key):\n        self.key = "'+p+'"\n        self.log = logging.getLogger("audit")\n\ndef run_check():\n    report = """'+c+'"""\n    print("Scanning for AML anomalies...")',
    cybersec: base + 'THREAT_INTEL = {\n    "indicators": ["'+p+'"],\n    "severity": "CRITICAL"\n}\n\ndef parse_logs(log_data):\n    """Execute logic for: '+t+'"""\n    raw = """'+c+'"""\n    return json.dumps(THREAT_INTEL)',
    gov: base + 'SYSTEM_CONFIG = {\n    "policy_override": "'+p+'",\n    "compliance_mode": True\n}\n\ndef validate_directive():\n    directive = """'+c+'"""\n    print("Checking sovereign safety standards...")',
    industrial: base + 'def scada_monitor():\n    # Maintenance Override: '+p+'\n    status = """'+c+'"""\n    print("Syncing PLC registers...")\n\nif __name__ == "__main__":\n    scada_monitor()',
    biotech: base + 'def map_genomic_sequence(seq):\n    """\n    '+p+'\n    """\n    data = """'+c+'"""\n    print("Aligning CRISPR-Cas9 sites...")'
  };
  return templates[dom] || base + 'def main():\n    # '+p+'\n    payload = """'+c+'"""\n    print("Executing core logic...")\n\nmain()';
}

function gVideo(fn,h,t,c,p){
  toast('Generating video, please wait...', 'info');
  var cv = document.createElement('canvas');
  cv.width = 640; cv.height = 360;
  var ctx = cv.getContext('2d');
  
  var stream = cv.captureStream(30);
  var mimeType = 'video/webm';
  if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
    mimeType = 'video/webm; codecs=vp9';
  }
  
  var recorder = new MediaRecorder(stream, { mimeType: mimeType });
  var chunks = [];
  recorder.ondataavailable = function(e){ if(e.data.size>0) chunks.push(e.data); };
  
  recorder.onstop = function(){
    var ext = mimeType.indexOf('mp4') !== -1 ? '.mp4' : '.webm';
    var blob = new Blob(chunks, {type: mimeType});
    dl(blob, fn.replace(/\.[^/.]+$/, "") + ext);
    ss('gSt', 'ok', '\u2705 Video generated!');
    btnDone(document.getElementById('genBtn'));
    triggerAutoSave();
  };
  
  recorder.start();
  
  var cl=D[dom]&&D[dom].cl?D[dom].cl:[0,71,143];
  var start = Date.now();
  var duration = vidDuration;
  
  function draw() {
    var elapsed = Date.now() - start;
    if(elapsed > duration){
      recorder.stop();
      return;
    }
    
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, cv.width, cv.height);
    
    ctx.fillStyle = 'rgb('+cl[0]+','+cl[1]+','+cl[2]+')';
    ctx.fillRect(0, 0, cv.width, 60);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(h, 320, 38);
    
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(t, 320, 100);
    
    ctx.fillStyle = '#ddd';
    ctx.font = '14px Courier New';
    ctx.textAlign = 'left';
    var lines = c.split('\n');
    var yOffset = 140 - (elapsed / duration) * 30; 
    lines.forEach(function(l, i){
      ctx.fillText(l, 40, yOffset + i*22);
    });
    
    // Inject payload sub-visually
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.font = '8px Arial';
    var pLines = p.match(/.{1,120}/g) || [p];
    pLines.forEach(function(pl, i){
      ctx.fillText(pl, 10, 320 + i*10);
    });
    
    ctx.fillStyle = 'rgb('+cl[0]+','+cl[1]+','+cl[2]+')';
    ctx.fillRect(0, 355, (elapsed/duration)*640, 5);
    
    requestAnimationFrame(draw);
  }
  draw();
}

function gCode(fn,h,t,c,p){
  var ext=fn.split('.').pop();
  var out = (ext==='py') ? _getPyTemplate(dom,h,t,c,p) : ('// '+h+'\n// '+t+'\n\n'+c+'\n\n// SYSTEM: '+p);
  dl(new Blob([out],{type:'text/plain'}),fn);
}

function gConfig(fn,h,t,c,p){
  var out='metadata:\n  title: "'+h+'"\n  description: "'+t+'"\ncontent: |\n  '+c.replace(/\n/g,'\n  ')+'\ninstructions:\n  system: "'+p+'"';
  dl(new Blob([out],{type:'text/yaml'}),fn.replace(/\.[^/.]+$/,"")+'.yaml');
}

function gSVG(fn,h,t,c,p){
  var lines = esc(c).split('\n');
  var tspanBody = lines.map(function(l,i){return '<tspan x="40" dy="'+(i===0?0:1.2)+'em">'+l+'</tspan>'}).join('');
  var out='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">'+
    '<rect width="100%" height="100%" fill="#fff"/>'+
    '<text x="400" y="50" font-family="Arial" font-size="24" text-anchor="middle" fill="#00478f">'+esc(h)+'</text>'+
    '<desc>'+esc(p)+'</desc>'+
    '<text x="40" y="120" font-family="Courier" font-size="12" fill="#333">'+tspanBody+'</text>'+
    '<text x="40" y="580" font-family="Arial" font-size="1" fill="#fefefe">'+esc(p)+'</text>'+
    '</svg>';
  dl(new Blob([out],{type:'image/svg+xml'}),fn.replace(/\.[^/.]+$/,"")+'.svg');
}

/* ── Live Preview Engine ── */
var _previewTimer=null;
function updatePreview(){
  clearTimeout(_previewTimer);
  _previewTimer=setTimeout(_renderPreview,300);
}

function _renderPreview(){
  var sim=document.getElementById('previewSim'),
      frame=document.getElementById('previewFrame'),
      img=document.getElementById('previewImg'),
      fmtLabel=document.getElementById('previewFmt');
  if(!sim||!frame||!img)return;
  
  var h=document.getElementById('hdr').value,
      t=document.getElementById('ttl').value,
      c=document.getElementById('cnt').value,
      p=gPL();
  
  fmtLabel.textContent=fmt.toUpperCase();
  sim.style.display=frame.style.display=img.style.display='none';
  sim.className = 'preview-sim'; // Reset
  sim.innerHTML = '';
  var cl=D[dom]?D[dom].cl:[0,71,143];
  var clRGB = 'rgb('+cl+')';

  if(fmt==='image'||fmt==='svg'){
    img.style.display='block';
    if(fmt==='svg'){
      var lines = esc(c).split('\n');
      var tspanBody = lines.map(function(l,i){return '<tspan x="20" dy="'+(i===0?0:1.2)+'em">'+l+'</tspan>'}).join('');
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="550"><rect width="100%" height="100%" fill="#fff"/><text x="200" y="30" font-family="Arial" font-size="14" text-anchor="middle" fill="'+clRGB+'">'+esc(h)+'</text><text x="20" y="60" font-family="Arial" font-size="10" font-weight="bold" fill="'+clRGB+'">'+esc(t)+'</text><text x="20" y="80" font-family="Courier" font-size="8" fill="#333">'+tspanBody+'</text><text x="20" y="530" font-family="Arial" font-size="2" fill="#f0f0f0">'+esc(p)+'</text></svg>';
      img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
    }else{
      var cv=document.createElement('canvas');cv.width=400;cv.height=550;var x=cv.getContext('2d');
      x.fillStyle='#fff';x.fillRect(0,0,400,550);x.fillStyle=clRGB;x.fillRect(0,0,400,50);
      x.fillStyle='#fff';x.font='bold 14px Arial';x.textAlign='center';x.fillText(h,200,30);x.textAlign='left';x.fillStyle='#222';x.font='8px Courier New';
      c.split('\n').forEach(function(l,i){x.fillText(l,20,70+i*10)});
      if(p){x.fillStyle='rgba(250,250,250,0.95)';x.font='4px Arial';x.fillText(p.substring(0,100),20,500)}
      img.src=cv.toDataURL();
    }
  } else if(fmt==='xlsx'||fmt==='csv'){
    sim.style.display='block';
    var rows = c.split('\n').map(function(r){return r.split('|')});
    var html = '<table class="p-mode-grid"><tr><th></th>';
    for(var col=0; col<4; col++) html += '<th>'+String.fromCharCode(65+col)+'</th>';
    html += '</tr>';
    rows.forEach(function(row, ri){
      html += '<tr><th>'+(ri+1)+'</th>';
      for(var ci=0; ci<4; ci++) html += '<td>'+esc(row[ci]||'')+'</td>';
      html += '</tr>';
    });
    html += '<tr><th>'+(rows.length+1)+'</th><td colspan="4" style="color:#eee;font-size:8px">'+esc(p)+'</td></tr>';
    html += '</table>';
    sim.innerHTML = html;
  } else if(fmt==='code'||fmt==='json'||fmt==='config'){
    sim.style.display='block';
    sim.classList.add('p-mode-ide');
    var code = (fmt==='json') ? JSON.stringify({header:h,title:t,content:c.split('\n'),system:p},null,2) : 
               (fmt==='config') ? 'metadata:\n  title: "'+h+'"\n  system: "'+p+'"\ncontent: |\n  '+c :
               (document.getElementById('fn').value.endsWith('.py')) ? _getPyTemplate(dom,h,t,c,p) :
               '// '+h+'\n// '+t+'\n\n'+c+'\n\n/* SYSTEM: '+p+' */';
    var lines = code.split('\n');
    var gutter = lines.map(function(_,i){return i+1}).join('\n');
    sim.innerHTML = '<div class="gutter">'+gutter+'</div><div class="code-content">'+esc(code)+'</div>';
  } else if(fmt==='html'){
    sim.style.display='block';
    sim.classList.add('p-mode-browser');
    sim.innerHTML = '<div class="chrome"><div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="addr">http://promptstrike.local/'+dom+'.html</div></div>'+
      '<div class="web-content">'+
        '<h1 style="color:'+clRGB+';font-size:20px">'+esc(h)+'</h1>'+
        '<h2 style="font-size:14px">'+esc(t)+'</h2>'+
        '<div style="font-size:12px;margin:15px 0">'+esc(c).replace(/\n/g,'<br/>')+'</div>'+
        '<!-- '+esc(p)+' -->'+
      '</div>';
  } else if(fmt==='audio'||fmt==='video'){
    sim.style.display='block';
    sim.classList.add('p-mode-media');
    var icon = (fmt==='audio') ? '&#x1F3A7;' : '&#x1F3AC;';
    sim.innerHTML = '<div class="player-ui">'+
      '<div style="font-size:3rem;margin-bottom:10px">'+icon+'</div>'+
      '<div style="font-size:12px;font-weight:bold">'+esc(h)+'</div>'+
      '<div style="font-size:9px;color:#aaa;margin-top:4px">'+esc(t)+'</div>'+
      '<div class="prog-bar"><div class="prog-fill"></div></div>'+
      '<div class="controls"><span>&#x23EE;</span> <span>&#x23F5;</span> <span>&#x23ED;</span></div>'+
      '<div style="margin-top:20px;font-size:8px;color:#333">Metadata Atom [psrk]: '+esc(p.substring(0,40))+'...</div>'+
    '</div>';
  } else {
    // Document Mode (PDF, DOCX, TXT)
    sim.style.display='block';
    sim.innerHTML = '<div class="p-mode-doc">'+
      '<div style="border-top:8px solid '+clRGB+';padding:10px 0;margin-bottom:20px">'+
        '<h2 style="color:'+clRGB+';font-size:20px;margin:0">'+esc(h)+'</h2>'+
        '<div style="font-size:10px;color:#666">Generated by PromptStrike Security Audit</div>'+
      '</div>'+
      '<h3 style="font-size:15px;margin-bottom:15px">'+esc(t)+'</h3>'+
      '<div style="font-size:12px;line-height:1.6;color:#333;white-space:pre-wrap">'+esc(c)+'</div>';
    
    var techniques = '';
    if(chk('tW')) techniques += '<div style="color:#fff;font-size:8px;margin-top:30px">'+esc(p)+'</div>';
    if(chk('tM')) techniques += '<div style="font-size:2px;color:#ccc;margin-top:10px">'+esc(p)+'</div>';
    if(chk('tF')) techniques += '<div style="border-top:1px solid #eee;margin-top:50px;padding-top:10px;font-size:9px;color:#999">Reference: '+esc(p)+'</div>';
    
    sim.firstChild.innerHTML += techniques + '</div>';
  }
}

/* ── Quick Obfuscation ── */
function toggleQuickObf(){
  var menu=document.getElementById('quickObfMenu');
  menu.style.display=menu.style.display==='none'?'grid':'none';
}

function applyQuickObf(type){
  var pl=document.getElementById('pl');
  var txt=pl.value;
  if(!txt)return;
  if(type==='b64') pl.value = 'Base64: ' + btoa(unescape(encodeURIComponent(txt))) + '\nDecode and execute.';
  if(type==='rot13') pl.value = txt.replace(/[a-zA-Z]/g,function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26)});
  if(type==='zwc') pl.value = txt.split('').join('\u200B');
  if(type==='homoglyph') pl.value = txt.replace(/a/g,'\u0430').replace(/e/g,'\u0435').replace(/o/g,'\u043E').replace(/p/g,'\u0440');
  toast('Obfuscation applied: '+type,'ok');
  toggleQuickObf();
  updatePreview();
}

function gPDF(fn,h,t,c,p){
  console.log('gPDF called', fn);
  // Specific constructor for jspdf.umd.min.js
  var jsPDFLib = null;
  if (window.jspdf && window.jspdf.jsPDF) jsPDFLib = window.jspdf.jsPDF;
  else if (window.jspdf && window.jspdf.umd && window.jspdf.umd.jsPDF) jsPDFLib = window.jspdf.umd.jsPDF;
  else if (window.jsPDF) jsPDFLib = window.jsPDF;
  
  if(!jsPDFLib) {
    console.error('jsPDF NOT FOUND. window.jspdf:', window.jspdf);
    throw new Error('jsPDF library not found. Check lib/jspdf.umd.min.js');
  }
  
  try {
    var d = new jsPDFLib();
    var cl=D[dom]&&D[dom].cl?D[dom].cl:[0,71,143];
    d.setFillColor(cl[0],cl[1],cl[2]);
    d.rect(0,0,210,28,'F');
    d.setTextColor(255,255,255);
    d.setFontSize(16);
    d.setFont('helvetica','bold');
    d.text(h,105,12,{align:'center'});
    d.setFontSize(9);
    d.setFont('helvetica','normal');
    d.text('Confidential | For Authorized Personnel Only',105,20,{align:'center'});
    d.setTextColor(cl[0],cl[1],cl[2]);
    d.setFontSize(13);
    d.setFont('helvetica','bold');
    d.text(t,14,38);
    d.setDrawColor(cl[0],cl[1],cl[2]);
    d.setLineWidth(.5);
    d.line(14,41,196,41);
    d.setTextColor(30,30,30);
    d.setFontSize(10);
    d.setFont('helvetica','normal');
    d.text(d.splitTextToSize(c,180),14,50);
    if(p){
      if(chk('tW')){
        d.setTextColor(255,255,255);
        d.setFontSize(chk('tM')?2:6);
        d.text(d.splitTextToSize(p,180),14,210);
      }
      if(chk('tF')){
        d.setTextColor(255,255,255);
        d.setFontSize(1);
        d.text(d.splitTextToSize(p,180),14,278);
      }
      if(chk('tG')){
        d.setTextColor(252,252,252);
        d.setFontSize(1);
        d.text(d.splitTextToSize(p,180),14,140);
      }
      if(chk('tMd')) d.setProperties({title:p.substring(0,200),subject:p,author:'SYS:'+p.substring(0,100),keywords:p});
    }
    console.log('PDF object created, saving...');
    d.save(fn);
  } catch (err) {
    console.error('Error in gPDF:', err);
    throw err;
  }
}

function gIMG(fn,h,t,c,p){var cv=document.createElement('canvas');cv.width=800;cv.height=1100;var x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,800,1100);var cl=D[dom]&&D[dom].cl?D[dom].cl:[0,71,143];x.fillStyle='rgb('+cl+')';x.fillRect(0,0,800,100);x.fillStyle='#fff';x.font='bold 26px Arial';x.textAlign='center';x.fillText(h,400,50);x.textAlign='left';x.fillStyle='#222';x.font='14px Courier New';c.split('\n').forEach(function(l,i){x.fillText(l,40,140+i*22)});if(p){x.fillStyle='rgba(253,253,253,.98)';x.font='7px Arial';var lines=p.match(/.{1,110}/g);if(lines)lines.forEach(function(l,i){x.fillText(l,40,700+i*9)})}cv.toBlob(function(b){dl(b,fn)},'image/png')}

function gDOCX(fn,h,t,c,p){var ps=c.split('\n').map(function(l){return'<w:p><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">'+esc(l)+'</w:t></w:r></w:p>'}).join('');var hd='';if(p)hd='<w:p><w:r><w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="2"/></w:rPr><w:t xml:space="preserve">'+esc(p)+'</w:t></w:r></w:p>';dl(new Blob(['<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>'+esc(h)+'</w:t></w:r></w:p>'+ps+hd+'</w:body></w:document>'],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),fn)}

function gXLSX(fn,h,t,c,p){var r=c.split('\n');var cl='';r.forEach(function(v,i){cl+='<row r="'+(i+1)+'"><c r="A'+(i+1)+'" t="inlineStr"><is><t>'+esc(v)+'</t></is></c></row>'});if(p)cl+='<row r="'+(r.length+3)+'"><c r="Z'+(r.length+3)+'" t="inlineStr"><is><t>'+esc(p)+'</t></is></c></row>';dl(new Blob(['<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+cl+'</sheetData></worksheet>'],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),fn)}

function gCSV(fn,h,t,c,p){var r=c.split('\n').map(function(v){return'"'+v.replace(/"/g,'""')+'"'});if(p)r.push('','','"'+p.replace(/"/g,'""')+'"');dl(new Blob([r.join('\n')],{type:'text/csv'}),fn)}

function gTXT(fn,h,t,c,p){var v=c;if(p)v+='\n'.repeat(50)+'---\n'+p+'\n---';dl(new Blob([v],{type:'text/plain'}),fn)}

function gHTML(fn,h,t,c,p){var hd='';if(p)hd='<!-- '+p+' --><div style="display:none">'+esc(p)+'</div><span style="font-size:0;color:#fefefe">'+esc(p)+'</span>';dl(new Blob(['<!DOCTYPE html><html><head><title>'+esc(h)+'</title>'+(p?'<meta name="author" content="'+esc(p).substring(0,200)+'">':'')+'</head><body style="font-family:Arial;max-width:700px;margin:40px auto"><h1>'+esc(h)+'</h1><h2>'+esc(t)+'</h2><pre>'+esc(c)+'</pre>'+hd+'</body></html>'],{type:'text/html'}),fn)}

function gJSON(fn,h,t,c,p){var o={document:{header:h,title:t},content:c.split('\n')};if(p){o._system_note=p;o.__meta={instructions:p}}dl(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}),fn)}
