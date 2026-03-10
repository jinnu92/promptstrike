/* ── Payload Manager ── */
var pmInitialized=false;
function initPayloadManager(){
  if(!pmInitialized){
    pmBuildCatFilter();
    pmInitialized=true;
  }
  pmRender();
}

function pmBuildCatFilter(){
  var cats={};
  P.forEach(function(p){cats[p.c]=1});
  var sel=document.getElementById('pmFilterCat');
  if(!sel)return;
  sel.innerHTML='<option value="">All Categories</option>';
  Object.keys(cats).sort().forEach(function(c){
    var o=document.createElement('option');
    o.value=c;o.textContent=c;sel.appendChild(o);
  });
}

function pmFilter(){
  var q=(document.getElementById('pmSearch').value||'').toLowerCase();
  var fS=document.getElementById('pmFilterSev').value;
  var fC=document.getElementById('pmFilterCat').value;
  var fO=document.getElementById('pmFilterOwasp').value;
  var rows=document.querySelectorAll('#pmBody tr');
  var shown=0;
  rows.forEach(function(tr){
    var idx=+tr.dataset.idx;
    var p=P[idx];
    if(!p){tr.style.display='none';return}
    var matchQ=!q||p.t.toLowerCase().indexOf(q)!==-1||p.id.toLowerCase().indexOf(q)!==-1||p.c.toLowerCase().indexOf(q)!==-1;
    var matchS=!fS||p.s===fS;
    var matchC=!fC||p.c===fC;
    var matchO=!fO||p.o===fO;
    var show=matchQ&&matchS&&matchC&&matchO;
    tr.style.display=show?'':'none';
    if(show)shown++;
  });
  var ct=document.getElementById('pmCount');
  if(ct)ct.textContent=shown+' of '+P.length+' payloads';
}

function pmRender(){
  var body=document.getElementById('pmBody');
  if(!body)return;
  var sevCls={'Critical':'tC','High':'tH','Medium':'tM'};
  body.innerHTML=P.map(function(p,i){
    return'<tr data-idx="'+i+'">'+
      '<td style="font-family:monospace;font-size:.68rem">'+esc(p.id)+'</td>'+
      '<td style="font-size:.7rem">'+esc(p.c)+'</td>'+
      '<td style="font-size:.68rem;max-width:350px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(p.t)+'">'+esc(p.t.substring(0,120))+(p.t.length>120?'\u2026':'')+'</td>'+
      '<td><span class="tag '+(sevCls[p.s]||'tM')+'">'+esc(p.s)+'</span></td>'+
      '<td><span class="tag tO">'+esc(p.o)+'</span></td>'+
      '<td style="white-space:nowrap">'+
        '<button class="btn bS" style="padding:2px 6px;font-size:.62rem;margin-right:3px" onclick="pmCopy('+i+')" title="Copy payload">Copy</button>'+
        '<button class="btn bS" style="padding:2px 6px;font-size:.62rem;margin-right:3px" onclick="pmEdit('+i+')" title="Edit">&#x270F;&#xFE0F;</button>'+
        '<button class="btn bD" style="padding:2px 6px;font-size:.62rem" onclick="pmDelete('+i+')" title="Delete">\uD83D\uDDD1</button>'+
      '</td></tr>';
  }).join('');
  var ct=document.getElementById('pmCount');
  if(ct)ct.textContent=P.length+' payloads';
  pmFilter();
}

function pmCopy(idx){
  var p=P[idx];
  if(!p)return;
  navigator.clipboard.writeText(p.t).then(function(){
    toast('Payload '+p.id+' copied','ok');
  }).catch(function(){
    toast('Copy failed \u2014 use HTTPS or localhost','warn');
  });
}

function pmAddNew(){
  document.getElementById('pmEditIdx').value='-1';
  document.getElementById('pmModalTitle').textContent='Add New Payload';
  document.getElementById('pmFId').value='P-'+(3000+P.length);
  document.getElementById('pmFCat').value='';
  document.getElementById('pmFText').value='';
  document.getElementById('pmFSev').value='High';
  document.getElementById('pmFOwasp').value='LLM01';
  document.getElementById('pmModal').style.display='flex';
}

function pmEdit(idx){
  var p=P[idx];
  if(!p)return;
  document.getElementById('pmEditIdx').value=idx;
  document.getElementById('pmModalTitle').textContent='Edit Payload: '+p.id;
  document.getElementById('pmFId').value=p.id;
  document.getElementById('pmFCat').value=p.c;
  document.getElementById('pmFText').value=p.t;
  document.getElementById('pmFSev').value=p.s;
  document.getElementById('pmFOwasp').value=p.o;
  document.getElementById('pmModal').style.display='flex';
}

function pmCloseModal(){
  document.getElementById('pmModal').style.display='none';
}

function pmSaveModal(){
  var idx=+document.getElementById('pmEditIdx').value;
  var id=document.getElementById('pmFId').value.trim();
  var cat=document.getElementById('pmFCat').value.trim();
  var text=document.getElementById('pmFText').value.trim();
  var sev=document.getElementById('pmFSev').value;
  var owasp=document.getElementById('pmFOwasp').value;
  if(!id||!cat||!text){
    toast('Please fill all required fields','err');return;
  }
  var payload={id:id,c:cat,s:sev,o:owasp,t:text};
  if(idx>=0&&idx<P.length){
    P[idx]=payload;
    toast('Payload '+id+' updated','ok');
  }else{
    P.push(payload);
    toast('Payload '+id+' added','ok');
  }
  pmCloseModal();
  pmSaveToStorage();
  pmRefreshAll();
}

function pmDelete(idx){
  if(!confirm('Delete payload '+P[idx].id+'?'))return;
  var id=P[idx].id;
  P.splice(idx,1);
  toast('Payload '+id+' deleted','ok');
  pmSaveToStorage();
  pmRefreshAll();
}

function pmRefreshAll(){
  pmBuildCatFilter();
  pmRender();
  populatePayloadDropdowns();
  if(typeof initVisionStegoTab==='function'){
    var sel=document.getElementById('vs_payload_sel');
    if(sel){sel.innerHTML='';P.forEach(function(p,i){var o=document.createElement('option');o.value=i;o.textContent=p.id+' '+p.c;sel.appendChild(o)})}
  }
  if(typeof initMCPTab==='function'){
    var mcpSel=document.getElementById('mcp_payload_sel');
    if(mcpSel){mcpSel.innerHTML='';P.forEach(function(p,i){var o=document.createElement('option');o.value=i;o.textContent=p.id+' '+p.c;mcpSel.appendChild(o)})}
  }
  if(typeof buildBL==='function')buildBL();
}

function pmExportJSON(){
  var data=P.map(function(p){return{id:p.id,category:p.c,severity:p.s,owasp:p.o,text:p.t}});
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  dl(blob,'payloads_export_'+Date.now()+'.json');
  toast('Exported '+P.length+' payloads','ok');
}

function pmImportJSON(input){
  if(!input.files||!input.files[0])return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(!Array.isArray(data)){toast('Invalid format: expected JSON array','err');return}
      var skipDup=document.getElementById('pmSkipDuplicates')&&document.getElementById('pmSkipDuplicates').checked;
      var seen={};
      var deduped=[];
      for(var i=data.length-1;i>=0;i--){
        var raw=data[i];
        var rid=(raw.id||'').toString().trim();
        if(rid&&seen[rid])continue;
        if(rid)seen[rid]=true;
        deduped.unshift(raw);
      }
      var added=0,updated=0,skipped=0;
      deduped.forEach(function(d){
        var txt=(d.text||d.t||'').toString().trim();
        if(!txt){skipped++;return}
        var id=(d.id||'').toString().trim()||'P-'+(3000+P.length);
        var cat=(d.category||d.c||'Custom').toString().trim();
        var sev=(d.severity||d.s||'Medium').toString().trim();
        var ow=(d.owasp||d.o||'LLM01').toString().trim();
        var entry={id:id,c:cat,s:sev,o:ow,t:txt};
        var idx=-1;
        for(var j=0;j<P.length;j++){if(P[j].id===id){idx=j;break}}
        if(idx>=0){
          if(skipDup){skipped++;return}
          P[idx]=entry;
          updated++;
        }else{
          P.push(entry);
          added++;
        }
      });
      toast('Imported: '+added+' new, '+updated+' updated, '+skipped+' skipped (empty/dup)','ok');
      pmSaveToStorage();
      pmRefreshAll();
    }catch(err){toast('Import failed: '+err.message,'err')}
  };
  reader.readAsText(input.files[0]);
  input.value='';
}

function pmDedup(){
  var seen={};
  var removed=0;
  var clean=[];
  P.forEach(function(p){
    if(seen[p.id]){removed++;return}
    seen[p.id]=true;
    clean.push(p);
  });
  P.length=0;
  clean.forEach(function(p){P.push(p)});
  if(removed>0){
    pmSaveToStorage();
    pmRefreshAll();
  }
  toast('Removed '+removed+' duplicate payloads','ok');
}
