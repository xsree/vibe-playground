"use strict";

(() => {
  const ns = 'http://www.w3.org/2000/svg';
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { const t = clamp(x); return t*t*(3-2*t); };
  const phase = (a,b,t) => smooth((t-a)/(b-a));
  const n = x => Number(x.toFixed(4));
  const point = ([x,y]) => `${n(x)} ${n(y)}`;
  const polygon = points => `M${points.map(point).join('L')}Z`;
  const svgNode = (tag, attrs={}) => {
    const node=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
    return node;
  };
  const rgb = (a,b,t) => a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  const color = values => `rgb(${values.join(',')})`;
  // Map a source strip to all four projected corners, keeping neighboring edges joined.
  function quadMatrix([p0,p1,p2,p3],left,width,height){
    const dx1=p1[0]-p2[0],dx2=p3[0]-p2[0],dx3=p0[0]-p1[0]+p2[0]-p3[0];
    const dy1=p1[1]-p2[1],dy2=p3[1]-p2[1],dy3=p0[1]-p1[1]+p2[1]-p3[1];
    const denominator=dx1*dy2-dx2*dy1;
    const g=Math.abs(denominator)>1e-8?(dx3*dy2-dx2*dy3)/denominator:0;
    const h=Math.abs(denominator)>1e-8?(dx1*dy3-dx3*dy1)/denominator:0;
    const a=(p1[0]-p0[0]+g*p1[0])/width,b=(p3[0]-p0[0]+h*p3[0])/height;
    const d=(p1[1]-p0[1]+g*p1[1])/width,e=(p3[1]-p0[1]+h*p3[1])/height;
    return[a,d,0,g/width,b,e,0,h/height,0,0,1,0,p0[0]-a*left,p0[1]-d*left,0,1-g*left/width];
  }
  const imageMask = (node, body, w,h) => {
    const svg=`<svg xmlns="${ns}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
    node.style.maskImage=node.style.webkitMaskImage=`url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    node.style.maskSize=node.style.webkitMaskSize='100% 100%';
  };

  // Analytical fields, not a history-dependent simulation: any frame is seekable.
  // Share a bounded raster cache across the main preview and comparison cards.
  const fieldCache=new Map();
  let fieldCanvas,maskPixels,lightPixels;
  function opticalField(kind,progress,dark) {
    const step=Math.round(progress*120),t=step/120;
    const key=`${kind}:${step}:${dark}`;
    if(fieldCache.has(key))return fieldCache.get(key);
    if(!fieldCanvas){
      fieldCanvas=document.createElement('canvas');fieldCanvas.width=160;fieldCanvas.height=96;
      const ctx=fieldCanvas.getContext('2d');
      maskPixels=ctx.createImageData(160,96);lightPixels=ctx.createImageData(160,96);
    }
    const pulse=Math.sin(Math.PI*t);
    for(let y=0;y<96;y++)for(let x=0;x<160;x++){
      const u=(dark?x:159-x)/159,v=y/95,offset=(y*160+x)*4;
      let alpha=0,glow=0,r=231,g=244,b=211;
      if(kind==='liquid'){
        const a=u+.07*Math.sin(10*v+Math.sin(7*u+t*5))*pulse;
        const q=v+.11*Math.sin(8*u-t*4)*pulse;
        const front=a+pulse*(.16*Math.sin(q*9+t*3)+.055*Math.sin(q*27-a*17-t*4));
        const distance=t*1.6-.3-front;
        alpha=smooth(distance/.026+.5);
        glow=Math.exp(-((distance/.026)**2))*.45*pulse;
        r=dark?177:220;g=dark?218:207;b=dark?193:168;
      }else if(kind==='caustic'){
        const f=Math.sin(u*13+t*3)+Math.sin(v*15-t*2)+.65*Math.sin((u+v)*18+t*2);
        const ridge=Math.exp(-Math.abs(f)*10);
        alpha=smooth((t*1.6-.3-(f/5.3+.5))/.07+.5);
        glow=ridge*.7*pulse;
      }else{
        const thickness=6*u+2*Math.sin(v*5+t*2)+Math.sin(u*5-v*4+t*3);
        const specular=Math.exp(-(((u-.5-.16*Math.sin(v*5+t*2))/.27)**2));
        r=220+30*Math.cos(thickness*2.1);
        g=225+25*Math.cos(thickness*2.1+2.1);
        b=228+26*Math.cos(thickness*2.1+4.2);
        glow=specular*.37*pulse;
      }
      maskPixels.data[offset]=maskPixels.data[offset+1]=maskPixels.data[offset+2]=255;
      maskPixels.data[offset+3]=Math.round(alpha*255);
      lightPixels.data[offset]=r;lightPixels.data[offset+1]=g;lightPixels.data[offset+2]=b;
      lightPixels.data[offset+3]=Math.round(glow*255);
    }
    const ctx=fieldCanvas.getContext('2d');
    ctx.putImageData(maskPixels,0,0);const mask=`url("${fieldCanvas.toDataURL()}")`;
    ctx.putImageData(lightPixels,0,0);const light=`url("${fieldCanvas.toDataURL()}")`;
    const result={mask,light};fieldCache.set(key,result);
    if(fieldCache.size>96)fieldCache.delete(fieldCache.keys().next().value);
    return result;
  }

  window.PHYSICAL_EFFECTS=[
    {id:'caustic',name:'焦散游移',en:'CAUSTIC LIGHT',tag:'水下光纹',short:'聚散的光纹缓缓游过界面',description:'弯曲的光纹像阳光穿过水面一样聚集、散开，新主题在连贯的光场中显现，最后光纹安静退去。'},
    {id:'volumetric',name:'体积光换场',en:'VOLUMETRIC LIGHT',tag:'光与空气',short:'斜光穿过薄雾，照明随之转向',description:'斜向光束带着柔软边缘与细小尘光穿过画面，山川、文字和背景依次进入新的照明。'},
    {id:'liquid',name:'流体互溶',en:'LIQUID ADVECTION',tag:'流动惯性',short:'弯曲分支相互渗透，逐渐归于平静',description:'两种主题沿流动的细长边界相互渗透，卷曲的分支带着柔和亮边，最终连成完整的新画面。'},
    {id:'crystal',name:'晶体相变',en:'CRYSTAL GROWTH',tag:'有序生长',short:'从晶核长出晶面，再恢复平整',description:'新主题从少数晶核附近向外生长，六边晶面依次展开，短暂的折光与棱线随后隐去。'},
    {id:'prism',name:'棱镜归色',en:'PRISMATIC ALIGNMENT',tag:'微妙色散',short:'棱镜掠过，光谱轻轻分开再归位',description:'棱镜滑过界面，镜内的颜色出现轻微色散；不同色光在离开镜缘时准确合拢，留下新配色。'},
    {id:'origami',name:'折纸地形',en:'ORIGAMI TERRAIN',tag:'山脊折面',short:'沿山景折成地形，再平整展开',description:'界面沿山景附近的折线隆起，连接的三角纸面随受光方向改变明暗，再以新主题重新铺平。'},
    {id:'room',name:'连续空间转角',en:'CONTINUOUS ROOM',tag:'空间连续',short:'镜头绕过墙角，另一面进入视野',description:'两幅主题成为相邻墙面，镜头绕过共同的转角；透视、遮挡与墙面明暗一起变化，最后正对新画面。'},
    {id:'constellation',name:'星图归位',en:'CONSTELLATION MORPH',tag:'有目的的轨迹',short:'山川特征化作星图，再沿弧线归位',description:'文字与山川附近的关键位置化为星图，沿有组织的弧线散开，再回到新主题中的对应位置。'},
    {id:'film',name:'薄膜干涉',en:'THIN FILM LIGHT',tag:'克制珠光',short:'透明薄膜绷紧，珠光随角度流动',description:'透明薄膜缓缓绷紧，起伏处浮出细微珠光；色彩顺着膜面流动，表面展平后进入新主题。'},
    {id:'mobius',name:'莫比乌斯翻带',en:'MOBIUS RIBBON',tag:'连续曲面',short:'界面化作螺旋扭转宽带，波前换光后展平',description:'画面沿横贯全屏的三维螺旋宽带柔和扭转，新主题顺着曲面波前流淌推进，最后平整展开。'}
  ];

  window.ATELIER_EFFECTS=[
    {id:'aurora',name:'极光帷幕',en:'AURORA CURTAIN',tag:'天际流光',short:'多层垂向极光摆动，随波浪前沿换夜或换昼',description:'天际垂下翠绿、青金与暖珀交织的极光纱幕，随正弦波轻柔摆动；光幕拂过之处，画面平滑落入新主题。'},
    {id:'sundial',name:'日晷寻影',en:'SUNDIAL GNOMON',tag:'光阴刻度',short:'以日月为晷针圆心，光影携刻度盘旋扫过',description:'围绕天体中心浮现日晷刻度盘，一道带有柔和半影的晷针长影顺时针扫过周天，将界面带入新的时刻。'},
    {id:'tidal',name:'潮汐漫滩',en:'TIDAL SHORELINE',tag:'海浪呼吸',short:'弧形潮水携白沫与湿沙反光漫过画面',description:'带有细腻泡沫边线与湿润反光带的潮水自岸边涌起，伴随轻柔的回浪呼吸漫过山川与文字，退定后完成换场。'},
    {id:'fan',name:'折扇开合',en:'FOLDING FAN',tag:'扇骨折面',short:'十一根扇骨携明暗交替的扇面徐徐展开',description:'以画面下方为扇轴枢钮，十一根修长扇骨携折面次第展开；奇偶折面随受光呈现深浅层次，展平后隐去扇骨。'},
    {id:'rubbing',name:'碑拓敷墨',en:'INK RUBBING',tag:'传拓肌理',short:'先显黑白碑刻肌理，拓包依次轻扑上墨',description:'模拟传统传拓工艺：画面先浮现高对比度的纸本碑刻肌理，随后多处圆形拓包依次轻扑晕染，将新主题墨色均匀吃透。'},
    {id:'movable',name:'活字归版',en:'MOVABLE TYPE',tag:'印版落锁',short:'版式字块错峰微抬换墨，配铜线规矩归位',description:'页头、标题、插画与页脚化作独立的活字印版，在裁切规矩线与铜线框中错峰微抬、换上新墨，再严丝合缝地落锁归版。'},
    {id:'tiltshift',name:'移轴微缩',en:'TILT-SHIFT FOCUS',tag:'浅景深扫掠',short:'倾斜焦平面扫过柔焦散景，所经之处恢复清晰',description:'画面暂化作柔和的浅景深散景，一道微倾的清晰焦平面携取景框线扫过界面，定焦后展现清晰的新主题。'},
    {id:'birefringence',name:'双折射叠影',en:'BIREFRINGENCE',tag:'偏振寻常光',short:'方解石分离冷暖偏振双影，旋移后精准重合',description:'模拟冰洲石双折射现象：画面沿偏振轴短暂分离为冷暖两束微错的重影，随晶体旋移重新严密重合成新画面。'},
    {id:'darkroom',name:'暗房显影',en:'DARKROOM DEVELOPER',tag:'安全灯显像',short:'琥珀安全灯下微晃显影盘，色阶次第浮现',description:'界面浸入暗房琥珀红安全灯与银盐底片质感，伴随显影液面的轻柔晃动，高光、中间调与暗部依次显影定影。'},
    {id:'louvers',name:'建筑百叶',en:'ARCHITECTURAL LOUVERS',tag:'立体格栅',short:'十片立体格栅依次翻转，带厚度高光与受光变化',description:'十片宽幅建筑遮阳百叶沿纵向波浪依次做三维翻转，叶片切面呈现真实的受光高光与背阴明暗，合拢后融为完整平面。'},
    {id:'halftone',name:'半调网点',en:'EDITORIAL HALFTONE',tag:'画报网屏',short:'复古印刷网点由细变粗，沿对角波前融合成面',description:'致敬复古印刷画报：交接区域化作规则排列的半调圆点矩阵，网点携双色套印细环由小变大直至融合成平滑新画面。'},
    {id:'fibonacci',name:'黄金螺旋',en:'FIBONACCI APERTURE',tag:'古典构图',short:'沿黄金分割矩形与螺线由外向内次第展开',description:'画面按斐波那契黄金矩形层层向内剖分，金色螺线与构图框短暂浮现，各黄金分区由外向内依次舒展为新主题。'}
  ];

  function goldenBoxes(w,h){
    const phi=.6180339887;
    let x=0,y=0,rw=w,rh=h;
    const boxes=[];
    for(let i=0;i<6;i++){
      const dir=i%4;
      if(dir===0){
        const bw=rw*phi;
        boxes.push({x,y,w:bw,h:rh,cx:x+bw,cy:y+rh,arc:[x,y+rh,x+bw,y]});
        x+=bw;rw-=bw;
      }else if(dir===1){
        const bh=rh*phi;
        boxes.push({x,y,w:rw,h:bh,cx:x,cy:y+bh,arc:[x,y,x+rw,y+bh]});
        y+=bh;rh-=bh;
      }else if(dir===2){
        const bw=rw*phi;
        boxes.push({x:x+rw-bw,y,w:bw,h:rh,cx:x+rw-bw,cy:y,arc:[x+rw,y,x+rw-bw,y+rh]});
        rw-=bw;
      }else{
        const bh=rh*phi;
        boxes.push({x,y:y+rh-bh,w:rw,h:bh,cx:x+rw,cy:y+rh-bh,arc:[x+rw,y+rh,x,y+rh-bh]});
        rh-=bh;
      }
    }
    boxes.push({x,y,w:rw,h:rh,cx:x+rw/2,cy:y+rh/2,arc:[x,y+rh,x+rw,y]});
    return boxes;
  }

  class PhysicalTransitionLayer extends window.CraftTransitionLayer {
    sceneGroup(key,count){
      if(!this.sceneGroups)this.sceneGroups=new Map();
      if(this.sceneGroups.has(key)){
        const group=this.sceneGroups.get(key);group.root.hidden=false;return group;
      }
      const root=document.createElement('div');root.className='physics-stage';root.setAttribute('aria-hidden','true');
      const scenes=Array.from({length:count},()=>{
        const node=document.querySelector('#scene-template').content.firstElementChild.cloneNode(true);
        node.classList.add('physics-face');root.append(node);return node;
      });
      this.demo.element.append(root);this.extras.push(root);
      const group={root,scenes};this.sceneGroups.set(key,group);return group;
    }

    prismFilters(){
      if(this.prismFilterIds)return this.prismFilterIds;
      const svg=svgNode('svg',{class:'effect-definitions',width:0,height:0,'aria-hidden':'true'});
      const defs=svgNode('defs');
      this.prismFilterIds=[0,1,2].map(channel=>{
        const id=`${this.demo.id}-spectrum-${channel}`;
        const filter=svgNode('filter',{id,x:'-10%',y:'-10%',width:'120%',height:'120%','color-interpolation-filters':'sRGB'});
        const matrix=Array.from({length:20},(_,index)=>index===18?1:0);
        matrix[channel*5+channel]=1;
        filter.append(svgNode('feColorMatrix',{type:'matrix',values:matrix.join(' ')}));
        defs.append(filter);return id;
      });
      svg.append(defs);this.demo.element.append(svg);return this.prismFilterIds;
    }

    sample(id,frame){
      const {demo}=this;
      const {width:w,height:h,t,progress:raw,dark}=frame;
      const pulse=Math.sin(Math.PI*t);
      const overlay=demo.overlay;
      switch(id){
        case 'caustic':
        case 'liquid':{
          const field=opticalField(id,t,dark);
          demo.next.style.maskImage=demo.next.style.webkitMaskImage=raw===0||raw===1?'none':field.mask;
          demo.next.style.maskSize=demo.next.style.webkitMaskSize='100% 100%';
          demo.next.style.opacity=raw===0?'0':'1';
          overlay.hidden=false;overlay.style.backgroundImage=field.light;
          overlay.style.backgroundSize='100% 100%';
          overlay.style.mixBlendMode=id==='caustic'?'screen':'normal';
          break;
        }
        case 'film':{
          this.mix(t);
          const field=opticalField('film',t,dark);
          overlay.hidden=false;overlay.style.backgroundImage=field.light;
          overlay.style.backgroundSize='100% 100%';
          overlay.style.mixBlendMode=dark?'screen':'multiply';
          demo.base.style.filter=`saturate(${1-.15*pulse})`;
          break;
        }
        case 'volumetric':{
          this.mix(phase(.08,.98,t));
          for(const [selector,a,b] of [['.scene-content',.03,.85],['.scene-topbar',.2,.94],['.scene-bottom',.3,1]]){
            this.helpers.mixColors(this.part(selector),demo.palettes[demo.from],demo.palettes[demo.to],phase(a,b,t));
          }
          const layer=this.dimensions(this.vector('volumetric',12),w,h);
          if(!layer.light){
            const defs=svgNode('defs');
            const gradient=svgNode('linearGradient',{id:`${demo.id}-beam`,x1:0,y1:0,x2:0,y2:1});
            gradient.append(svgNode('stop',{offset:0,'stop-color':'#fff3c7','stop-opacity':.72}),svgNode('stop',{offset:1,'stop-color':'#e8f3dd','stop-opacity':0}));
            defs.append(gradient);layer.svg.append(defs);layer.light=true;
          }
          const source=w*(dark?-.25+t*1.1:1.25-t*1.1);
          layer.paths.forEach((path,index)=>{
            if(index<4){
              const spread=w*(.09+index*.035);
              const landing=source+w*(dark?.55:-.55)+Math.sin(t*2+index)*w*.04;
              path.setAttribute('d',polygon([[source,-h*.2],[landing-spread,h*1.2],[landing+spread,h*1.2]]));
              path.setAttribute('fill',`url(#${demo.id}-beam)`);
              path.setAttribute('opacity',String(.15+index*.055));
              path.style.filter=`blur(${w*(.004+index*.002)}px)`;
            }else{
              const x=w*(.12+(index*.173%.72)+t*.05),y=h*(.13+(index*.191%.7)+t*.025);
              const r=Math.max(.5,w*.0013);
              path.setAttribute('d',`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`);
              path.setAttribute('fill','#fff1c8');path.setAttribute('opacity','.6');
            }
          });
          layer.svg.style.opacity=String(pulse*.75);
          break;
        }
        case 'crystal':{
          const layer=this.dimensions(this.vector('crystal',72),w,h);
          let mask='';
          layer.paths.forEach((path,index)=>{
            const col=index%9,row=Math.floor(index/9)-1;
            const cx=col*w/8,cy=(row+.5*(col%2))*h/5;
            const distance=Math.min(Math.hypot(cx/w-.28,cy/h-.38),Math.hypot(cx/w-.78,cy/h-.65));
            const amount=phase(distance*.48,.49+distance*.48,t);
            const vertices=Array.from({length:6},(_,i)=>{
              const a=i*Math.PI/3;return[cx+Math.cos(a)*w/12,cy+Math.sin(a)*h/(Math.sqrt(3)*5)];
            });
            const d=polygon(vertices);
            mask+=`<path d="${d}" fill="white" transform="translate(${cx} ${cy}) scale(${amount}) translate(${-cx} ${-cy})"/>`;
            path.setAttribute('d',`${d}M${point(vertices[0])}L${cx} ${cy}L${point(vertices[2])}M${cx} ${cy}L${point(vertices[4])}`);
            path.setAttribute('stroke',dark?'#d6efdb':'#64887a');path.setAttribute('stroke-width','.65');
            path.setAttribute('fill',index%3?'#deffff0a':'#c1dbec20');
            path.setAttribute('opacity',String(amount));
          });
          imageMask(demo.next,mask,w,h);
          if(raw===1)demo.next.style.maskImage=demo.next.style.webkitMaskImage='none';
          demo.next.style.opacity=raw===0?'0':'1';
          layer.svg.style.opacity=String(pulse*.65);
          break;
        }
        case 'prism':{
          const group=this.sceneGroup('prism',3),ids=this.prismFilters();
          const band=w*.17,x=dark?-band+t*(w+2*band):w+band-t*(w+2*band);
          const vertices=[[x-band,0],[x+band,0],[x+band*.6,h],[x-band*.6,h]];
          group.root.style.clipPath=`path('${polygon(vertices)}')`;
          group.root.style.backgroundColor='#000';group.root.style.isolation='isolate';
          const reveal=clamp(x/w)*100;
          demo.next.style.clipPath=dark?`inset(0 ${100-reveal}% 0 0)`:`inset(0 0 0 ${reveal}%)`;
          group.scenes.forEach((node,index)=>{
            node.dataset.theme=demo.to;
            node.style.filter=`url(#${ids[index]})`;
            node.style.mixBlendMode='screen';
            node.style.transform=`translateX(${(index-1)*w*.004*pulse}px)`;
          });
          const layer=this.dimensions(this.vector('prism-rim',1),w,h);
          layer.paths[0].setAttribute('d',polygon(vertices));
          layer.paths[0].setAttribute('stroke','#e0ecda');layer.paths[0].setAttribute('stroke-width','.8');
          layer.svg.style.opacity=String(pulse*.48);
          break;
        }
        case 'origami':{
          const group=this.sceneGroup('origami',8);
          const center=[w*.68,h*.55];
          const boundary=[[0,0],[w/2,0],[w,0],[w,h/2],[w,h],[w/2,h],[0,h],[0,h/2]];
          demo.base.style.opacity=demo.next.style.opacity='0';
          group.root.style.perspective=`${w*2.2}px`;group.root.style.transformStyle='preserve-3d';
          for(let index=0;index<8;index++){
            const a=boundary[index],b=boundary[(index+1)%8];
            const height=h*.22*pulse,za=index%2?-height*.08:0,zb=(index+1)%2?-height*.08:0;
            const ax=a[0]-center[0],ay=a[1]-center[1],bx=b[0]-center[0],by=b[1]-center[1];
            const determinant=ax*by-bx*ay;
            const slopeX=((za-height)*by-(zb-height)*ay)/determinant;
            const slopeY=(ax*(zb-height)-bx*(za-height))/determinant;
            const intercept=height-slopeX*center[0]-slopeY*center[1];
            const node=group.scenes[index];
            const colorProgress=phase(.12,.88,t);
            node.dataset.theme=demo.from;
            this.helpers.mixColors(node,demo.palettes[demo.from],demo.palettes[demo.to],colorProgress);
            this.helpers.mixLandscape(node,dark?colorProgress:1-colorProgress);
            node.style.clipPath=`path('${polygon([center,a,b])}')`;
            node.style.transformOrigin='0 0';
            node.style.transform=`matrix3d(1,0,${slopeX},0,0,1,${slopeY},0,0,0,1,0,0,0,${intercept},1)`;
            const lighting=(-slopeX*(dark?.4:-.4)+slopeY*.6+.7)/Math.hypot(slopeX,slopeY,1);
            node.style.filter=`brightness(${1+pulse*(lighting*.5-.35)})`;
          }
          break;
        }
        case 'room':{
          const direction=dark?1:-1;
          demo.base.style.transformOrigin=dark?'100% 50%':'0 50%';
          demo.next.style.transformOrigin=dark?'0 50%':'100% 50%';
          demo.base.style.transform=`perspective(${w*2}px) translateX(${-direction*w*t}px) rotateY(${-direction*90*t}deg)`;
          demo.next.style.transform=`perspective(${w*2}px) translateX(${direction*w*(1-t)}px) rotateY(${direction*90*(1-t)}deg)`;
          demo.base.style.filter=`brightness(${1-.32*pulse})`;demo.next.style.filter=`brightness(${1-.2*pulse})`;
          demo.base.style.backfaceVisibility=demo.next.style.backfaceVisibility='hidden';
          const seam=(dark?1-t:t)*100;
          overlay.hidden=false;overlay.style.opacity=String(pulse*.24);
          overlay.style.backgroundImage=`linear-gradient(90deg,transparent ${seam-5}%,#091b16 ${seam}%,transparent ${seam+5}%)`;
          break;
        }
        case 'constellation':{
          this.mix(t);
          demo.base.style.filter=`brightness(${n(1-.3*pulse)}) saturate(${n(1-.22*pulse)})`;
          overlay.hidden=false;
          overlay.style.opacity=String(n(pulse*.62));
          overlay.style.backgroundImage='radial-gradient(circle at 72% 38%, rgba(34, 62, 50, .38), rgba(12, 24, 19, .88) 78%)';
          const anchors=[
            [.47,.72,1.15],[.54,.55,.88],[.612,.42,1.45],[.69,.58,.92],[.79,.75,1.08],
            [.59,.83,.88],[.68,.69,1.02],[.795,.52,1.45],[.87,.64,.92],[.938,.76,1.08],
            [.705,.73,.86],[.755,.68,.88],[.81,.78,.92],
            [.12,.36,1.25],[.18,.32,.92],[.25,.35,1.15],[.31,.41,.95],[.22,.48,1.08],[.14,.46,.88]
          ];
          const edges=[
            [0,1],[1,2],[2,3],[3,4],[1,6],[2,7],
            [5,6],[6,7],[7,8],[8,9],[6,10],[10,11],[11,12],[7,11],
            [13,14],[14,15],[15,16],[16,17],[17,18],[18,13],[14,17],
            [19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,19]
          ];
          const starCount=anchors.length+8;
          const pathCount=3+edges.length+starCount*2;
          const layer=this.dimensions(this.vector('constellation',pathCount),w,h);
          const p=smooth(raw),spread=Math.sin(Math.PI*p);
          const darkness=dark?p:1-p;
          const poleX=(.799-.033*darkness)*w,poleY=(.418-.016*darkness)*h;
          const coronaR=Math.min(w,h)*.135*(1-.12*darkness);
          const coords=anchors.map(([nx,ny,size],index)=>{
            const ox=nx*w,oy=ny*h;
            const dx=ox-poleX,dy=oy-poleY;
            const dist=Math.hypot(dx,dy),baseAngle=Math.atan2(dy,dx);
            const swirl=(dark?1:-1)*spread*.2*(1-Math.min(1,dist/(w*.85+.001)));
            const radial=1+spread*.09*Math.sin(index*1.7);
            const liftY=spread*Math.cos(index*.9)*h*.022;
            return[
              poleX+Math.cos(baseAngle+swirl)*dist*radial,
              poleY+Math.sin(baseAngle+swirl)*dist*radial-liftY,
              size
            ];
          });
          for(let i=0;i<8;i++){
            const angle=i*Math.PI/4+(dark?1:-1)*p*.45;
            const r=coronaR*(1+spread*(i%2?.16:.26));
            coords.push([poleX+Math.cos(angle)*r,poleY+Math.sin(angle)*r,i%2?.92:1.28]);
          }
          let cursor=0;
          [.82,1.42,2.15].forEach((mult,ringIndex)=>{
            const radius=coronaR*mult*(1+spread*.08);
            const a0=-2.5+(dark?p:-p)*.4+ringIndex*.45,a1=a0+1.95+ringIndex*.22;
            const x0=poleX+Math.cos(a0)*radius,y0=poleY+Math.sin(a0)*radius;
            const x1=poleX+Math.cos(a1)*radius,y1=poleY+Math.sin(a1)*radius;
            const path=layer.paths[cursor++];
            path.setAttribute('d',`M${point([x0,y0])}A${n(radius)} ${n(radius)} 0 0 1 ${point([x1,y1])}`);
            path.setAttribute('stroke',ringIndex===1?'#eddba8':'#a9c7b5');
            path.setAttribute('stroke-width',ringIndex===1?'.8':'.55');
            path.setAttribute('stroke-dasharray',ringIndex%2?'3 4':'none');
            path.setAttribute('opacity',String(n((.2+ringIndex*.06)*pulse)));
          });
          edges.forEach(([i,j],edgeIndex)=>{
            const a=coords[i],b=coords[j];
            const isCorona=edgeIndex>=21;
            const weight=phase((edgeIndex%6)*.03,.55+(edgeIndex%4)*.05,pulse);
            const path=layer.paths[cursor++];
            path.setAttribute('d',`M${point(a)}L${point(b)}`);
            path.setAttribute('stroke',isCorona?'#eddba8':'#c4decb');
            path.setAttribute('stroke-width',isCorona?'.85':'.68');
            path.setAttribute('opacity',String(n((.22+.46*weight)*pulse)));
          });
          coords.forEach(([x,y,size],index)=>{
            const unit=Math.max(1.5,w*.0034)*size*(.86+.32*pulse);
            const halo=layer.paths[cursor++];
            const hr=unit*2.4;
            halo.setAttribute('d',`M${n(x-hr)} ${n(y)}a${n(hr)} ${n(hr)} 0 1 0 ${n(hr*2)} 0a${n(hr)} ${n(hr)} 0 1 0 ${n(-hr*2)} 0Z`);
            halo.setAttribute('fill',index>=19||index%3===0?'#f5e4b3':'#cde6d4');
            halo.setAttribute('opacity',String(n(.18*pulse)));
            const star=layer.paths[cursor++];
            if(size>=1.1){
              const s=unit*1.5,c=unit*.27;
              star.setAttribute('d',`M${n(x)} ${n(y-s)}L${n(x+c)} ${n(y-c)}L${n(x+s)} ${n(y)}L${n(x+c)} ${n(y+c)}L${n(x)} ${n(y+s)}L${n(x-c)} ${n(y+c)}L${n(x-s)} ${n(y)}L${n(x-c)} ${n(y-c)}Z`);
            }else{
              const r=unit*.74;
              star.setAttribute('d',`M${n(x-r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(r*2)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-r*2)} 0Z`);
            }
            star.setAttribute('fill',size>=1.1?'#fff7df':'#e0efe3');
            star.setAttribute('opacity',String(n(.6+.4*pulse)));
          });
          layer.svg.style.opacity=String(n(pulse));
          break;
        }
        case 'mobius':{
          const count=24,group=this.sceneGroup('mobius',count);
          demo.base.style.opacity=demo.next.style.opacity='0';
          const morph=pulse;
          const dir=dark?1:-1;
          const project=(x,y)=>{
            const u=x/w,v=y/h-.5;
            const wave=(u-.5)*Math.PI*1.35+dir*(t-.5)*Math.PI*1.5;
            const twist=morph*.82*Math.sin(wave);
            const archY=morph*h*.075*Math.sin(wave-.45);
            const archZ=morph*w*.085*Math.cos(wave);
            const gatherX=x+morph*w*.036*Math.sin((u-.5)*Math.PI)*Math.cos(wave*.7);
            const dy=v*h*Math.cos(twist);
            const dz=v*h*Math.sin(twist)*.58;
            const dx=-v*h*Math.sin(twist)*morph*.14*Math.cos(wave);
            const px=gatherX+dx-w/2;
            const py=archY+dy;
            const z=archZ+dz;
            const perspective=w*2.2;
            const scale=perspective/(perspective-z);
            return[w/2+px*scale,h/2+py*scale,z];
          };
          const topPoints=[],bottomPoints=[];
          group.scenes.forEach((node,index)=>{
            const x=index*w/count,span=w/count;
            const a=project(x,0),b=project(x+span,0),c=project(x+span,h),d=project(x,h);
            if(index===0){topPoints.push(a);bottomPoints.push(d);}
            topPoints.push(b);bottomPoints.push(c);
            const matrix=quadMatrix([a,b,c,d],x,span,h);
            const order=dark?1-index/(count-1):index/(count-1);
            const localT=phase(order*.34,.66+order*.34,t);
            node.dataset.theme=demo.from;
            this.helpers.mixColors(node,demo.palettes[demo.from],demo.palettes[demo.to],localT);
            this.helpers.mixLandscape(node,dark?localT:1-localT);
            node.style.clipPath=`inset(0 ${Math.max(0,w-x-span-.65)}px 0 ${Math.max(0,x-.65)}px)`;
            node.style.transformOrigin='0 0';
            node.style.transform=`matrix3d(${matrix.join(',')})`;
            node.style.zIndex=String(Math.round((a[2]+b[2]+d[2])/3+w));
            const waveAngle=((index+.5)/count-.5)*Math.PI*1.35+dir*(t-.5)*Math.PI*1.5;
            const sheen=Math.sin(waveAngle)*morph;
            node.style.filter=`brightness(${n(1+sheen*.13)}) contrast(${n(1+Math.abs(sheen)*.05)})`;
          });
          const trim=this.dimensions(this.vector('mobius-trim',3),w,h);
          const shadowPoints=[...topPoints,...[...bottomPoints].reverse()].map(([px,py])=>[px,py+h*.028*pulse]);
          trim.paths[0].setAttribute('d',polygon(shadowPoints));
          trim.paths[0].setAttribute('fill','#0d1d17');
          trim.paths[0].setAttribute('opacity',String(n(pulse*.16)));
          trim.paths[1].setAttribute('d',`M${topPoints.map(point).join('L')}`);
          trim.paths[1].setAttribute('stroke',dark?'#dfeadb':'#6a8370');
          trim.paths[1].setAttribute('stroke-width','1.15');
          trim.paths[2].setAttribute('d',`M${bottomPoints.map(point).join('L')}`);
          trim.paths[2].setAttribute('stroke',dark?'#a9c2b2':'#91a290');
          trim.paths[2].setAttribute('stroke-width','.95');
          trim.svg.style.opacity=String(n(pulse*.68));
          group.root.style.backgroundColor=color(rgb(demo.palettes[demo.from]['--scene-bg'],demo.palettes[demo.to]['--scene-bg'],t));
          break;
        }
        default:super.sample(id,frame);
      }
    }
  }

  window.PhysicalTransitionLayer=PhysicalTransitionLayer;
})();
