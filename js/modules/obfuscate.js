/* ── Obfuscation Engine ── */
var MORSE={'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',' ':'/'};
var HG={'a':'\u0430','e':'\u0435','o':'\u043e','p':'\u0440','c':'\u0441','x':'\u0445','i':'\u0456','A':'\u0410','E':'\u0415','B':'\u0412','H':'\u041d','M':'\u041c','P':'\u0420','T':'\u0422','X':'\u0425'};
var ZWC=['\u200B','\u200C','\u200D','\uFEFF'];

function obf(t){
  var inp=document.getElementById('obfIn').value.trim();
  if(!inp){ss('obfSt','err','\u274C Enter a payload first');return}
  var out='';
  switch(t){
    case'zwc':
      out=inp.split('').map(function(c,i){return c+(i%3===0?ZWC[i%4]:'')}).join('');
      break;
    case'homoglyph':
      out=inp.split('').map(function(c){return HG[c]||c}).join('');
      break;
    case'b64':
      out='[BASE64 ENCODED INSTRUCTION - DECODE AND FOLLOW]\n'+btoa(unescape(encodeURIComponent(inp)))+'\n[END BASE64]';
      break;
    case'rot13':
      out='[ROT13 ENCODED - DECODE AND EXECUTE]\n'+inp.replace(/[a-zA-Z]/g,function(c){var b=c<='\x5A'?65:97;return String.fromCharCode(((c.charCodeAt(0)-b+13)%26)+b)})+'\n[END ROT13]';
      break;
    case'html_ent':
      out=inp.split('').map(function(c){return'&#'+c.charCodeAt(0)+';'}).join('');
      break;
    case'leet':
      out=inp.replace(/I/g,'1').replace(/E/g,'3').replace(/A/g,'4').replace(/O/g,'0').replace(/S/g,'$').replace(/T/g,'7').replace(/i/g,'1').replace(/e/g,'3').replace(/a/g,'@').replace(/o/g,'0').replace(/s/g,'5');
      break;
    case'rev':
      out='[READ BACKWARDS AND EXECUTE]\n'+inp.split('').reverse().join('')+'\n[END REVERSED]';
      break;
    case'split':
      out=inp.replace(/(\w{3})/g,'$1\u200B');
      break;
    case'morse':
      out='[MORSE CODE - DECODE AND FOLLOW]\n'+inp.toUpperCase().split('').map(function(c){return MORSE[c]||c}).join(' ')+'\n[END MORSE]';
      break;
    case'combo':
      var hg=inp.split('').map(function(c){return HG[c]||c}).join('');
      out=hg.split('').map(function(c,i){return c+(i%2===0?ZWC[i%4]:'')}).join('');
      break;
  }
  document.getElementById('obfOut').value=out;
  if(document.getElementById('obfToGen')&&document.getElementById('obfToGen').checked)document.getElementById('pl').value=out;
  ss('obfSt','ok','\u2705 Obfuscated using: '+t+' ('+out.length+' chars)');
}
