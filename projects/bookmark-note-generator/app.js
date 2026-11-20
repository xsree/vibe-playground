/* ---------- 这两个函数会原样嵌入到生成的笔记里 ---------- */
function md(s){
  var E=function(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')};
  var I=function(t){var k=[],P=function(h){k.push(h);return '\x01'+(k.length-1)+'\x02'};
    t=E(t).replace(/`([^`]+)`/g,function(_,x){return P('<code>'+x+'</code>')})
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,function(_,a,u){return P('<a href="'+u+'" target="_blank" rel="noopener">'+a+'</a>')})
      .replace(/https?:\/\/[^\s<>"\x01\x02]*[^\s<>"\x01\x02.,;:!?)\]'，。；：！？）]/g,function(u){return P('<a href="'+u+'" target="_blank" rel="noopener">'+u+'</a>')})
      .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/~~(.+?)~~/g,'<s>$1</s>');
    return t.replace(/\x01(\d+)\x02/g,function(_,i){return k[i]})};
  var L=s.replace(/\r/g,'').split('\n'),o='',p=[],l=null,i,x,m;
  function F(){if(p.length){o+='<p>'+p.map(I).join('<br>')+'</p>';p=[]}}
  function C(){if(l){o+='</'+l+'>';l=null}}
  for(i=0;i<L.length;i++){x=L[i];
    if(!x.trim()){F();C();continue}
    if(m=x.match(/^(#{1,4})\s+(.*)/)){F();C();o+='<h'+m[1].length+'>'+I(m[2])+'</h'+m[1].length+'>';continue}
    if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(x)){F();C();o+='<hr>';continue}
    if(m=x.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)/)){F();
      var t=/\d/.test(m[2])?'ol':'ul';if(l!==t){C();o+='<'+t+'>';l=t}
      var c=m[3],cb='',q=c.match(/^\[([ xX])\]\s+(.*)/);
      if(q){cb='<input type="checkbox" disabled'+(q[1]!==' '?' checked':'')+'> ';c=q[2]}
      var d=Math.floor(m[1].replace(/\t/g,'  ').length/2);
      o+='<li'+(d?' style="margin-left:'+d*1.4+'em"':'')+'>'+cb+I(c)+'</li>';continue}
    if(m=x.match(/^>\s?(.*)/)){F();C();o+='<blockquote>'+I(m[1])+'</blockquote>';continue}
    C();p.push(x)}
  F();C();return o}

var BOOT_PRE="data:text/html,<script>fetch('data:;base64,";
var BOOT_POST="').then(r=>new%20Response(r.body.pipeThrough(new%20DecompressionStream('deflate-raw'))).text()).then(h=>{with(document)write(h),close()})</"+"script>";
var BOOT_POST_SAFE=BOOT_POST.replace('</'+'script>','\\x3c/script>');

function enc(h,mode){
  var b=new TextEncoder().encode(h),s='',i;
  for(i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));
  var b64='data:text/html;charset=utf-8;base64,'+btoa(s);
  var pct='data:text/html;charset=utf-8,'+encodeURIComponent(h)
    .replace(/%(3[A-F]|2[246BCF]|5[BDE]|7[B-D]|40|60)/g,decodeURIComponent);
  if(mode==='b64')return b64;if(mode==='pct')return pct;
  return pct.length<=b64.length?pct:b64}

async function encZip(h){
  if(typeof CompressionStream==='undefined')return null;
  var buf=await new Response(new Response(h).body.pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
  var b=new Uint8Array(buf),s='',i;
  for(i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));
  return BOOT_PRE+btoa(s)+BOOT_POST}

async function decZip(b64){
  var bin=atob(b64),arr=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
  return new Response(new Response(arr).body.pipeThrough(new DecompressionStream('deflate-raw'))).text()}

/* ---------- 生成器（极限压缩版可编辑笔记模板） ---------- */
var NOTE_CSS=':root{color-scheme:light dark}body{font:16px/1.7 system-ui;max-width:740px;margin:auto;padding:20px 18px 80px}a{color:#38f;text-decoration:none}a:hover{text-decoration:underline}h1{border-bottom:1px solid #8884}ul,ol{padding-left:1.4em}li:has(>input){list-style:none;margin-left:-1.3em}code{background:#8882;padding:1px 4px;border-radius:4px}blockquote{margin:0;padding:0 1em;border-left:3px solid #8884;opacity:.8}hr{border:0;border-top:1px solid #8884}';
var EDIT_CSS='#b{position:fixed;right:16px;bottom:16px;display:flex;gap:8px}#b button{padding:6px 14px;border-radius:8px;border:1px solid #8884;background:Canvas;cursor:pointer}#s{width:100%;height:45vh;padding:8px;box-sizing:border-box;font:14px/1.5 monospace}';
var NOTE_JS='D=document;M=t=>{let k,P=h=>\'\\v\'+(k.push(h)-1)+\'\\f\',A=(u,a)=>P(`<a href="${u}" target=_blank>${a||u}</a>`),I=x=>(k=[],x.replace(/[&<>"]/g,c=>\'&#\'+c.charCodeAt()+\';\').replace(/`([^`]+)`/g,(_,a)=>P(`<code>${a}</code>`)).replace(/\\[([^\\]]+)\\]\\(([^)\\s]+)\\)/g,(_,a,u)=>A(u,a)).replace(/https?:\\/\\/[^\\s<>"\\v\\f]+(?<![.,;:!?)\\]\'\\u3000-\\u303f\\uff00-\\uffef])/g,u=>A(u)).replace(/\\*\\*(.+?)\\*\\*/g,\'<b>$1</b>\').replace(/~~(.+?)~~/g,\'<s>$1</s>\').replace(/\\v(\\d+)\\f/g,(_,i)=>k[i])),o=\'\',l=\'\',p=0,F=q=>{l!=q&&(l&&(o+=`</${l}>`),q&&(o+=`<${q}>`),l=q,p=0)},m;for(let x of t.split(/\\r?\\n/)){if(!x.trim())F(\'\');else if(m=x.match(/^(#{1,4}) +(.*)/))F(\'\'),o+=`<h${m[1].length}>${I(m[2])}</h${m[1].length}>`;else if(/^ *([-*_])( *\\1){2,} *$/.test(x))F(\'\'),o+=\'<hr>\';else if(m=x.match(/^(\\s*)([-*+]|\\d+[.)]) +(.*)/)){let u=/\\d/.test(m[2])?\'ol\':\'ul\',c=m[3],q=c.match(/^\\[([ xX])\\] +(.*)/),d=m[1].replace(/\\t/g,\'  \').length>>1;F(u);o+=`<li${d?` style=margin-left:${d*1.4}em`:\'\'}>${q?`<input type=checkbox disabled${q[1]>\' \'?\' checked\':\'\'}> `:\'\'}${I(q?q[2]:c)}</li>`}else if(m=x.match(/^> ?(.*)/))F(\'\'),o+=`<blockquote>${I(m[1])}</blockquote>`;else F(\'p\'),o+=(p?\'<br>\':\'\')+I(x),p=1}return F(\'\'),o};d=0;(R=_=>v.innerHTML=M(s.value))();e.onclick=_=>{s.hidden^=1;e.textContent=s.hidden?\'编辑\':\'完成\';s.hidden||s.focus()};s.oninput=_=>(d=1,R());S=async _=>{let h=s.hidden,a=s.value,y=scrollY,o;s.hidden=1;s.textContent=a;e.textContent=\'编辑\';v.innerHTML=\'\';let b=new Uint8Array(await new Response(new Response(\'<!doctype html>\'+D.documentElement.outerHTML).body.pipeThrough(new CompressionStream(\'deflate-raw\'))).arrayBuffer()),z=\'\';for(let x of b)z+=String.fromCharCode(x);let u="'+BOOT_PRE+'"+btoa(z)+"'+BOOT_POST_SAFE+'";R();s.hidden=0;s.value=u;s.select();try{o=D.execCommand(\'copy\')}catch{}s.value=a;s.hidden=h;e.textContent=h?\'编辑\':\'完成\';scrollTo(0,y);o?(d=0,alert(`已复制(${(u.length/1024).toFixed(1)}KB),请替换书签网址`)):prompt(\'复制\',u)};k.onclick=S;onkeydown=q=>{(q.ctrlKey||q.metaKey)&&q.key==\'s\'&&(q.preventDefault(),S())};onbeforeunload=q=>d?q.preventDefault()||\'\':void 0';

function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function buildNote(title,src,editable,keep){
  var h='<!doctype html><meta charset=utf-8><meta name=viewport content=width=device-width><title>'+esc(title||'笔记')+'</title><style>'+NOTE_CSS+(editable?EDIT_CSS:'')+'</style>';
  if(editable){
    h+='<textarea id=s hidden>'+esc(src)+'</textarea><main id=v></main><div id=b><button id=e>编辑</button><button id=k>保存</button></div><script>'+NOTE_JS+'</'+'script>';
  }else{
    h+=(keep?'<textarea id=s hidden>'+esc(src)+'</textarea>':'')+'<main>'+md(src)+'</main>';
  }
  return h}

var $=function(id){return document.getElementById(id)};
var SAMPLE=['# 跨平台框架','','## 移动端 / 全平台',
'- [Flutter](https://flutter.dev) — Dart，自绘引擎，iOS/Android/Web/桌面',
'- [React Native](https://reactnative.dev) — JS/TS，映射原生组件',
'- [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html) — 共享业务逻辑，UI 可选 Compose',
'- [.NET MAUI](https://dotnet.microsoft.com/apps/maui) — C#','',
'## 桌面','- [Tauri](https://tauri.app) — Rust + 系统 WebView，体积小',
'- [Electron](https://www.electronjs.org) — Chromium + Node，生态成熟','',
'## 小程序 / 多端','- [uni-app](https://uniapp.dcloud.net.cn) — Vue 语法','- [Taro](https://taro.zone) — React 语法','',
'> 选型备注：重视 UI 一致性选 Flutter；已有 Web 团队可以考虑 RN / Tauri。'].join('\n');
$('src').value=SAMPLE;


var curUrl='',curHtml='',timer,seq=0;
async function update(){
  var id=++seq,ed=$('editable').checked;
  $('keepWrap').style.opacity=ed?.4:1;$('keep').disabled=ed;
  var html=buildNote($('title').value.trim(),$('src').value,ed,$('keep').checked);
  curHtml=html;
  var mode=$('encMode').value,u64=enc(html,'b64'),upc=enc(html,'pct'),uzip=await encZip(html);
  if(id!==seq)return;
  if(mode==='b64')curUrl=u64;
  else if(mode==='pct')curUrl=upc;
  else if(mode==='zip')curUrl=uzip||(upc.length<=u64.length?upc:u64);
  else{curUrl=upc.length<=u64.length?upc:u64;if(uzip&&uzip.length<curUrl.length)curUrl=uzip}
  $('url').value=curUrl;
  var a=$('dragLink');a.href=curUrl;a.textContent='📌 '+($('title').value.trim()||'笔记');
  var n=curUrl.length,kb=(n/1024).toFixed(2)+' KB';$('len').textContent=n.toLocaleString()+' 字符 · '+kb;
  var b=$('badge');
  if(n<16384){b.className='badge g';b.textContent='很好'}
  else if(n<65536){b.className='badge y';b.textContent='可用，建议精简'}
  else{b.className='badge r';b.textContent='过大，可能同步失败'}
  $('alt').textContent=(uzip?'压缩 '+(uzip.length/1024).toFixed(2)+' KB / ':'')+'Base64 '+(u64.length/1024).toFixed(2)+' KB / 百分号 '+(upc.length/1024).toFixed(2)+' KB';
  clearTimeout(timer);timer=setTimeout(function(){$('preview').srcdoc=curHtml},150)}
['title','src'].forEach(function(id){$(id).addEventListener('input',update)});
['editable','keep','encMode'].forEach(function(id){$(id).addEventListener('change',update)});

function toast(t){var e=$('toast');e.textContent=t;e.classList.add('on');setTimeout(function(){e.classList.remove('on')},1800)}
function copyText(t){
  if(navigator.clipboard&&window.isSecureContext){return navigator.clipboard.writeText(t).then(function(){return true},fallback)}
  return Promise.resolve(fallback());
  function fallback(){var a=document.createElement('textarea'),ok=false;a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();try{ok=document.execCommand('copy')}catch(e){}a.remove();return ok}}
$('copy').onclick=function(){copyText(curUrl).then(function(ok){toast(ok?'已复制，去新建书签粘贴到网址吧':'复制失败，请在下方文本框手动复制')})};
$('dragLink').onclick=function(e){e.preventDefault();toast('请把这个按钮拖到书签栏')};
$('dl').onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([curHtml],{type:'text/html'}));a.download=($('title').value.trim()||'笔记')+'.html';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)};

/* tabs */
function showTab(p){document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('on',t.dataset.p===p)});document.querySelectorAll('.pane').forEach(function(x){x.classList.toggle('on',x.id===p)})}
document.querySelectorAll('.tab').forEach(function(t){t.onclick=function(){showTab(t.dataset.p)}});

/* 书签 HTML 导入 */
var folders=[];
function dlOf(h3){var n=h3.nextElementSibling;while(n&&n.tagName!=='DL')n=n.nextElementSibling;return n||(h3.parentElement&&h3.parentElement.querySelector(':scope > dl'))}
function cleanT(t){return (t||'').trim().replace(/\[/g,'［').replace(/\]/g,'］')}
function cleanU(u){return (u||'').replace(/\s/g,'%20').replace(/\)/g,'%29')}
function dlToMd(dl,depth,out){
  Array.prototype.forEach.call(dl.children,function(dt){
    if(dt.tagName!=='DT')return;
    var a=dt.querySelector(':scope > a'),h3=dt.querySelector(':scope > h3');
    if(a&&a.getAttribute('href')){out.push('- ['+(cleanT(a.textContent)||a.getAttribute('href'))+']('+cleanU(a.getAttribute('href'))+')')}
    else if(h3){var sub=dlOf(h3);out.push('',new Array(Math.min(depth+2,4)+1).join('#')+' '+h3.textContent.trim());if(sub)dlToMd(sub,depth+1,out);out.push('')}
  })}
function loadBm(text){
  var doc=new DOMParser().parseFromString(text,'text/html');folders=[];
  doc.querySelectorAll('h3').forEach(function(h3){
    var dl=dlOf(h3);if(!dl)return;var path=[h3.textContent.trim()],p=dl.parentElement;
    while(p){if(p.tagName==='DL'){var ph=p.previousElementSibling;while(ph&&ph.tagName!=='H3')ph=ph.previousElementSibling;if(ph)path.unshift(ph.textContent.trim())}p=p.parentElement}
    folders.push({name:h3.textContent.trim(),path:path.join(' / '),dl:dl,n:dl.querySelectorAll('a').length})});
  if(!folders.length){toast('没有在文件里找到书签文件夹');return}
  $('folders').innerHTML=folders.map(function(f,i){return '<option value="'+i+'">'+esc(f.path)+'（'+f.n+'）</option>'}).join('');
  $('bmPick').style.display='block'}
function readFile(f){if(!f)return;var r=new FileReader();r.onload=function(){loadBm(r.result)};r.readAsText(f)}
$('file').onchange=function(){readFile(this.files[0])};
var drop=$('drop');
drop.addEventListener('dragover',function(e){e.preventDefault();drop.classList.add('over')});
drop.addEventListener('dragleave',function(){drop.classList.remove('over')});
drop.addEventListener('drop',function(e){e.preventDefault();drop.classList.remove('over');readFile(e.dataTransfer.files[0])});
$('bmGo').onclick=function(){
  var f=folders[$('folders').value];if(!f)return;var out=['# '+f.name,''];dlToMd(f.dl,0,out);
  $('title').value=f.name;$('src').value=out.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
  showTab('p-md');update();toast('已转换「'+f.name+'」，可以继续添加备注')};

/* 读取已有 data URL（兼容 deflate 压缩版与未压缩版） */
$('urlGo').onclick=async function(){
  var u=$('oldUrl').value.trim(),html;
  try{
    var ci=u.indexOf(',');if(!/^data:/i.test(u)||ci<0)throw 0;
    var meta=u.slice(0,ci),body=u.slice(ci+1);
    if(/;base64$/i.test(meta)){var bin=atob(decodeURIComponent(body)),arr=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);html=new TextDecoder().decode(arr)}
    else html=decodeURIComponent(body);
    var zm=html.match(/fetch\('data:;base64,([^']+)'\).*DecompressionStream\('deflate-raw'\)/);
    if(zm)html=await decZip(zm[1]);
  }catch(e){toast('这不是有效的 data: 地址');return}
  var doc=new DOMParser().parseFromString(html,'text/html'),s=doc.getElementById('s'),src;
  if(s&&s.tagName==='TEXTAREA')src=s.textContent;
  else{src=Array.prototype.map.call(doc.querySelectorAll('a[href]'),function(a){return '- ['+cleanT(a.textContent)+']('+cleanU(a.getAttribute('href'))+')'}).join('\n');toast('没有源文本，只提取出了链接')}
  $('title').value=(doc.title||'笔记').trim();$('src').value=src;$('editable').checked=!!doc.querySelector('script');
  showTab('p-md');update()};

update();
