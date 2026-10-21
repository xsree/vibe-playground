/* Independent, original Canvas 2D drawing. No images, SVG, fonts or libraries. */
'use strict';
const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');
const W = 1440, H = 1080;
const C = {paper:'#f3efe3',ink:'#263f3d',soft:'#688278',sea:'#b8c7b7',seaLight:'#d4dcca',red:'#b84f36',redLight:'#dc7851',orange:'#db8b3f',gold:'#efb75e',white:'#fffbed',shade:'#d8ddca',tire:'#2c4240'};
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = motion.matches, elapsed = 0, last = null, request = null;

// Every path is expressed directly as Canvas drawing commands.
function path(commands, fill, stroke, width=2){
  ctx.beginPath();
  for(const [op,...args] of commands) ctx[op](...args);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function ellipse(x,y,rx,ry,fill,stroke,width=2,rotation=0){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function line(points,color,width=2){path(points.map(([x,y],i)=>[i?'lineTo':'moveTo',x,y]),null,color,width);}
function text(str,x,y,size,color,font='Georgia',align='left'){
  ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.fillText(str,x,y);
}
function landscape(t){
  ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);
  // Sun, offshore islands and a broad, calm strip of water.
  ellipse(1094,230,108,108,'#e7b064');
  path([['moveTo',0,546],['bezierCurveTo',170,523,224,559,355,541],['bezierCurveTo',514,510,620,535,762,527],['bezierCurveTo',933,513,1144,535,1440,499],['lineTo',1440,810],['lineTo',0,810],['closePath']],C.seaLight);
  path([['moveTo',812,533],['bezierCurveTo',889,503,938,504,986,490],['bezierCurveTo',1042,465,1072,489,1130,489],['bezierCurveTo',1218,468,1300,501,1440,469],['lineTo',1440,557],['closePath']],'#9eafa0');
  path([['moveTo',0,615],['bezierCurveTo',240,565,311,604,474,580],['bezierCurveTo',615,565,786,586,894,568],['bezierCurveTo',1116,545,1294,579,1440,558],['lineTo',1440,817],['lineTo',0,817],['closePath']],C.sea);
  for(let i=0;i<24;i++){
    const x=((i*193+t*(i%3+1)*5)%1600)-80,y=586+(i*71)%160;
    line([[x,y],[x+24+(i%5)*20,y]],i%3?'#e4e6d3':'#9cb3a4',1.5);
  }
  // Two distant sailboats, each an arrangement of quiet planes.
  for(const [x,y,s] of [[1203,594,.8],[259,649,.48]]){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    path([['moveTo',0,-65],['lineTo',0,0],['lineTo',-38,0],['closePath']],C.white);
    path([['moveTo',5,-44],['lineTo',28,0],['lineTo',5,0],['closePath']],'#e9d9b3');
    line([[0,-68],[0,10]],C.soft,2);path([['moveTo',-43,8],['lineTo',35,8],['lineTo',23,17],['lineTo',-27,17],['closePath']],C.soft);ctx.restore();
  }
  // Coastal path; a dark green headland frames the right edge.
  path([['moveTo',0,811],['bezierCurveTo',340,767,572,800,824,780],['bezierCurveTo',1138,756,1266,730,1440,716],['lineTo',1440,1080],['lineTo',0,1080],['closePath']],'#e6d9bb');
  path([['moveTo',0,858],['bezierCurveTo',350,824,590,848,883,826],['bezierCurveTo',1120,804,1292,781,1440,774]],null,'#f8f0d9',3);
  path([['moveTo',1210,770],['bezierCurveTo',1231,721,1277,685,1329,678],['bezierCurveTo',1372,636,1400,640,1440,625],['lineTo',1440,809],['closePath']],'#7e9680');
  // Scrolling road marks make forward travel readable without moving the rider.
  for(let i=0;i<8;i++){
    const x=((i*224-t*87)%1792+1792)%1792-180;
    line([[x,968],[x+73,963]],'#f7efdc',4);
  }
  // A few wind marks and tiny distant birds.
  line([[459,264],[542,264]],'#c8ceba',2);line([[487,277],[568,277]],'#c8ceba',1);
  for(const [x,y,s] of [[1247,354,1],[1184,374,.68],[417,374,.6]]){
    path([['moveTo',x-15*s,y+4*s],['quadraticCurveTo',x-6*s,y-8*s,x,y],['quadraticCurveTo',x+8*s,y-8*s,x+18*s,y-1*s]],null,'#6e8172',2);
  }
}
function wheel(x,y,a){
  ellipse(x,y,163,163,C.tire);
  ellipse(x,y,151,151,'#e5d7b5');
  ellipse(x,y,145,145,null,'#7f8e7a',2);
  for(let i=0;i<24;i++){
    const b=a+i*Math.PI/12;
    line([[x+Math.cos(b+.24)*12,y+Math.sin(b+.24)*12],[x+Math.cos(b)*144,y+Math.sin(b)*144]],'#86958a',1.35);
  }
  ellipse(x,y,13,13,C.ink);ellipse(x,y,5,5,'#dcdcc7');
  path([['arc',x,y,157,3.5,4.65]],null,'#758277',2);
  const r=a+.9;line([[x+Math.cos(r)*144,y+Math.sin(r)*144],[x+Math.cos(r)*151,y+Math.sin(r)*151]],C.redLight,5);
}
function wheels(t){
  const a=t*1.75;
  // Ground contact shadows and wheels.
  ellipse(510,948,178,13,'#b6ae8d');ellipse(1000,948,178,13,'#b6ae8d');
  wheel(510,780,a);wheel(1000,780,a);
  path([['arc',510,780,176,3.75,5.85]],null,C.red,7);
  path([['arc',1000,780,176,3.85,5.7]],null,C.red,7);
  line([[480,607],[470,633]],C.ink,3);line([[1047,613],[1063,654]],C.ink,3);
}
function frame(t){
  const a=t*1.75;
  // Chain stays and loop, behind the frame tubes.
  path([['moveTo',510,762],['lineTo',730,724],['arc',730,765,41,-Math.PI/2,Math.PI/2],['lineTo',510,798],['arc',510,780,18,Math.PI/2,Math.PI*1.5],['closePath']],null,C.ink,3);
  line([[510,780],[670,552],[730,765],[510,780]],C.red,12);
  line([[670,552],[916,573],[730,765]],C.red,12);
  line([[916,573],[947,657],[1000,780]],C.red,13);
  line([[672,557],[914,578]],'#e58c63',2);
  line([[672,557],[730,765]],'#e58c63',2);
  line([[667,548],[657,514]],C.ink,9);
  // Leather saddle.
  path([['moveTo',614,516],['bezierCurveTo',647,510,672,515,708,514],['bezierCurveTo',724,515,724,527,707,532],['bezierCurveTo',676,532,660,526,632,532],['quadraticCurveTo',609,534,614,516],['closePath']],C.ink);
  line([[627,519],[694,519]],'#7e8976',2);
  // Curved stem and drop handlebar, plus a loose brake cable.
  path([['moveTo',918,578],['lineTo',889,488],['quadraticCurveTo',887,473,902,472],['lineTo',944,470],['bezierCurveTo',978,468,990,492,974,509],['quadraticCurveTo',966,519,951,515]],null,C.ink,9);
  path([['moveTo',925,472],['lineTo',946,470],['bezierCurveTo',978,468,990,492,974,509]],null,'#ae7450',12);
  path([['moveTo',961,515],['bezierCurveTo',1006,548,943,585,948,650]],null,'#53665c',2);
  // Headlamp, with a cream glass face.
  line([[932,575],[971,563]],C.ink,4);ellipse(977,556,23,17,C.ink);ellipse(990,555,8,13,'#f8d58f',C.ink,2);
  text('SEABIRD',760,583,11,C.white,'Arial');
  ellipse(730,765,38,38,C.ink);ellipse(730,765,29,29,'#adbaab');
  for(let i=0;i<5;i++){
    const b=a+i*Math.PI*2/5;
    line([[730+Math.cos(b)*10,765+Math.sin(b)*10],[730+Math.cos(b)*25,765+Math.sin(b)*25]],C.ink,6);
  }
}
function foot(x,y,front){
  path([['moveTo',x-8,y-10],['lineTo',x+6,y-8],['quadraticCurveTo',x+14,y-5,x+37,y+5],['lineTo',x+35,y+11],['lineTo',x+14,y+7],['lineTo',x-2,y+13],['lineTo',x-18,y+8],['closePath']],front?C.orange:'#ac6c39',C.ink,2);
  line([[x+4,y],[x+29,y+7]],front?'#f1b760':'#d58c48',1.5);
}
function leg(t,front,bob){
  const a=t*1.75+(front?0:Math.PI);
  // Opposite ends of the crank spindle project onto opposite sides of the bike.
  // Keep that depth offset for the entire stroke, even when the legs cross.
  const spindle={x:front?742:718,y:front?773:757};
  const px=spindle.x+Math.cos(a)*59,py=spindle.y+Math.sin(a)*59;
  const hip={x:front?705:681,y:(front?510:502)+bob};
  // Solve the two segment leg so the ankle stays attached to its pedal.
  const dx=px-hip.x,dy=py-hip.y,d=Math.hypot(dx,dy),l1=165,l2=165;
  const along=(l1*l1-l2*l2+d*d)/(2*d);
  const height=Math.sqrt(Math.max(0,l1*l1-along*along));
  const knee={x:hip.x+dx/d*along+dy/d*height,y:hip.y+dy/d*along-dx/d*height};
  line([[hip.x,hip.y],[knee.x,knee.y],[px,py-5]],C.ink,15);
  line([[hip.x,hip.y],[knee.x,knee.y],[px,py-5]],front?C.orange:'#af713f',10);
  ellipse(knee.x,knee.y,6,6,front?'#e8a54e':'#c08343');
  line([[730,765],[spindle.x,spindle.y],[px,py]],front?'#ece8cf':'#78877b',6);
  line([[px-21,py+15],[px+25,py+15]],C.ink,8);
  foot(px,py,front);
}
function bird(t,bob){
  ctx.save();ctx.translate(0,bob);
  // Tail feathers, body and its cool underside.
  path([['moveTo',591,427],['quadraticCurveTo',531,403,491,414],['lineTo',530,446],['lineTo',499,446],['quadraticCurveTo',532,478,590,483],['closePath']],C.white,C.ink,3);
  line([[519,428],[574,451]],'#adb9a4',2);
  path([['moveTo',553,436],['bezierCurveTo',559,376,650,347,730,376],['bezierCurveTo',796,393,832,442,799,491],['bezierCurveTo',764,542,668,542,603,512],['bezierCurveTo',565,494,547,462,553,436],['closePath']],C.white,C.ink,3);
  path([['moveTo',565,471],['bezierCurveTo',621,510,722,512,792,471],['bezierCurveTo',802,509,742,533,679,528],['bezierCurveTo',617,528,583,512,565,471]],C.shade);
  // Long S-shaped neck, the defining pelican silhouette.
  path([['moveTo',741,421],['bezierCurveTo',789,400,790,365,790,331],['bezierCurveTo',786,282,807,232,850,216],['bezierCurveTo',882,201,920,209,933,233],['bezierCurveTo',945,254,932,278,907,284],['bezierCurveTo',873,289,854,305,852,337],['bezierCurveTo',853,397,845,456,796,481],['bezierCurveTo',780,467,758,446,741,421],['closePath']],C.white,C.ink,3);
  path([['moveTo',850,281],['bezierCurveTo',821,307,821,336,826,368],['bezierCurveTo',832,414,807,448,785,456]],null,C.shade,16);
  // Soft crown and a few trailing feathers.
  path([['moveTo',817,244],['quadraticCurveTo',805,226,812,218],['quadraticCurveTo',823,227,829,225],['quadraticCurveTo',822,209,826,205],['quadraticCurveTo',842,217,849,216]],C.white,C.ink,2);
  // Lower pouch droops beneath an exceptionally long bill.
  path([['moveTo',914,264],['lineTo',1147,272],['bezierCurveTo',1118,289,1080,323,1022,334],['bezierCurveTo',980,342,948,317,923,284],['closePath']],C.orange,C.ink,3);
  path([['moveTo',938,281],['bezierCurveTo',982,310,1015,324,1069,309]],null,'#efb265',2);
  path([['moveTo',917,239],['bezierCurveTo',990,235,1083,253,1162,274],['quadraticCurveTo',1170,278,1155,282],['lineTo',924,275],['quadraticCurveTo',911,259,917,239],['closePath']],C.gold,C.ink,3);
  line([[940,262],[1143,275]],'#bf7838',2);
  ellipse(931,249,3.5,2,C.ink);
  // Eye with a warm orbital patch, highlight and a relaxed eyebrow.
  ellipse(889,243,15,15,'#e9ba6c');ellipse(891,243,7,8,C.ink);ellipse(893,240,2,2,C.white);
  path([['moveTo',876,223],['quadraticCurveTo',888,218,899,224]],null,C.ink,2);
  // A vermilion scarf gives a single moving accent, tied around the neck.
  path([['moveTo',799,334],['quadraticCurveTo',826,347,851,336],['lineTo',851,353],['quadraticCurveTo',826,363,799,350],['closePath']],C.red,C.ink,2);
  const flap=Math.sin(t*4.3)*8;
  path([['moveTo',801,344],['bezierCurveTo',747,333+flap,717,315-flap,673,326+flap],['lineTo',686,345+flap],['lineTo',674,357+flap],['bezierCurveTo',725,344+flap,755,368-flap,806,356],['closePath']],C.red,C.ink,2);
  line([[694,335+flap],[773,349]],'#e18a62',2);
  ellipse(802,348,10,12,C.red,C.ink,2);
  // One wing reaches the handlebar. Layered feathers remain visible.
  path([['moveTo',607,415],['bezierCurveTo',638,389,686,403,724,426],['bezierCurveTo',787,463,827,478,885,476],['quadraticCurveTo',904,477,911,488],['bezierCurveTo',902,502,879,510,846,507],['bezierCurveTo',784,509,742,488,689,477],['bezierCurveTo',634,473,606,452,607,415],['closePath']],C.shade,C.ink,3);
  path([['moveTo',611,413],['bezierCurveTo',646,407,681,424,717,445],['bezierCurveTo',773,476,826,490,885,488],['bezierCurveTo',839,504,781,484,736,477],['bezierCurveTo',678,463,631,464,611,413]],C.white);
  for(let i=0;i<4;i++){
    const x=741+i*32,y=469+i*6;
    path([['moveTo',x,y],['quadraticCurveTo',x+22,y+12,x+41,y+9]],null,'#8d9e8c',1.8);
  }
  path([['moveTo',625,417],['quadraticCurveTo',654,418,680,434]],null,'#adb9a4',2);
  ctx.restore();
}
function foreground(t){
  // Sparse coastal fennel, rather than a dense decorative border.
  for(const [x,y,s] of [[1297,990,1],[1372,1022,.8],[167,950,.58]]){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);const sway=Math.sin(t*1.8+x)*3;
    path([['moveTo',0,28],['quadraticCurveTo',-9,-43,13+sway,-110]],null,'#617c64',3);
    line([[0,-10],[-27,-46],[-34,-52]],'#617c64',2);line([[2,-35],[32,-67]],'#617c64',2);
    for(const [fx,fy] of [[13+sway,-110],[-34,-52],[32,-67]]){
      for(let j=0;j<5;j++){
        const r=j*Math.PI/5+.5,dx=Math.cos(r)*15,dy=-Math.sin(r)*13;
        line([[fx,fy],[fx+dx,fy+dy]],'#617c64',1);ellipse(fx+dx,fy+dy,3.5,3.5,'#b58f43');
      }
    }
    ctx.restore();
  }
  // Small irregular flecks, deterministic and fixed to the paper.
  ctx.fillStyle='#4b624c';ctx.globalAlpha=.12;
  let seed=82;
  for(let i=0;i<2100;i++){
    seed=(seed*1664525+1013904223)>>>0;const x=seed/4294967296*W;
    seed=(seed*1664525+1013904223)>>>0;const y=seed/4294967296*H;
    ctx.fillRect(x,y,.65,.65);
  }
  ctx.globalAlpha=1;
}
function draw(){
  ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
  ctx.lineCap='round';ctx.lineJoin='round';
  const bob=Math.sin(elapsed*3.5)*2;
  landscape(elapsed);
  wheels(elapsed);
  // Far leg and crank are occluded by the frame and chainring; the near leg
  // covers them. Both hip joints are seated inside the bird's silhouette.
  leg(elapsed,false,bob);
  frame(elapsed);
  leg(elapsed,true,bob);
  bird(elapsed,bob);
  foreground(elapsed);
}
function resize(){
  const dpr=Math.min(devicePixelRatio||1,2),width=Math.max(1,canvas.getBoundingClientRect().width);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(width*H/W*dpr);draw();
}
function tick(now){
  request=null;
  if(paused)return;
  if(last!==null)elapsed+=Math.min((now-last)/1000,.05);
  last=now;draw();request=requestAnimationFrame(tick);
}
const pauseButton=document.querySelector('#pause');
function syncPlayback(){
  pauseButton.textContent=paused?'继续骑行':'暂停骑行';pauseButton.setAttribute('aria-pressed',String(paused));
  if(request!==null)cancelAnimationFrame(request);
  request=null;last=null;if(!paused&&!document.hidden)request=requestAnimationFrame(tick);
}
pauseButton.addEventListener('click',()=>{paused=!paused;syncPlayback();});
motion.addEventListener('change',()=>{paused=motion.matches;syncPlayback();});
document.addEventListener('visibilitychange',syncPlayback);
document.querySelector('#save').addEventListener('click',()=>{
  // Export the whole editorial plate, including its typography, at a stable resolution.
  const previous={width:canvas.width,height:canvas.height};
  canvas.width=W*2;canvas.height=H*2;draw();
  text('NO HURRY. JUST THE SEA.',52,100,11,C.soft,'Arial');
  text('顺风而行',52,178,68,C.ink,'"Songti SC", SimSun, serif');
  text('A pelican’s day off.',52,228,39,C.ink,'Georgia');
  text('把今天，交给海风。',52,280,14,C.soft,'"Songti SC", SimSun, serif');
  text('FIG. 001 / PELECANUS ON TWO WHEELS',52,1024,10,C.soft,'Arial');
  canvas.toBlob(blob=>{
    if(!blob)return;
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='pelican-a-day-off.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },'image/png');
  canvas.width=previous.width;canvas.height=previous.height;draw();
});
new ResizeObserver(resize).observe(canvas);
resize();syncPlayback();
