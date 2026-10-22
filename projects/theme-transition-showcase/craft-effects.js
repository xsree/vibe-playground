"use strict";

(() => {
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const phase = (start, end, value) => smooth((value - start) / (end - start));
  const n = value => Number(value.toFixed(3));
  const point = ([x, y]) => `${n(x)} ${n(y)}`;
  const polygon = points => `M${points.map(point).join('L')}Z`;
  const imageMask = (node, content, w, h) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${content}</svg>`;
    node.style.maskImage = node.style.webkitMaskImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    node.style.maskSize = node.style.webkitMaskSize = '100% 100%';
  };
  const rgb = (from, to, t) => from.map((value, index) => Math.round(value + (to[index] - value) * t));
  const ink = (demo, t, alpha = 1) => `rgba(${rgb(demo.palettes[demo.from]['--scene-ink'], demo.palettes[demo.to]['--scene-ink'], t).join(',')},${alpha})`;

  // Clip a rectangle by each seed's perpendicular bisectors to form a tessellation.
  function enamelCells(w, h) {
    const seeds = [[.1,.16],[.36,.12],[.63,.19],[.89,.1],[.15,.48],[.4,.43],[.67,.49],[.92,.46],[.08,.84],[.34,.87],[.61,.81],[.88,.88]].map(([x,y]) => [x*w,y*h]);
    return seeds.map((seed, index) => {
      let vertices = [[0,0],[w,0],[w,h],[0,h]];
      seeds.forEach((other, otherIndex) => {
        if (index === otherIndex) return;
        const a = other[0]-seed[0], b = other[1]-seed[1];
        const c = (other[0]**2+other[1]**2-seed[0]**2-seed[1]**2)/2;
        const output = [];
        vertices.forEach((start, i) => {
          const end = vertices[(i+1)%vertices.length];
          const ds = a*start[0]+b*start[1]-c, de = a*end[0]+b*end[1]-c;
          if (ds <= 1e-7) output.push(start);
          if ((ds < 0 && de > 0) || (ds > 0 && de < 0)) {
            const ratio = ds/(ds-de);
            output.push([start[0]+(end[0]-start[0])*ratio,start[1]+(end[1]-start[1])*ratio]);
          }
        });
        vertices = output;
      });
      return { seed, vertices };
    });
  }

  const cracks = [
    [[.61,.35],[.53,.47],[.43,.5],[.34,.64],[.23,.7],[.12,.9]],
    [[.61,.35],[.7,.46],[.74,.61],[.86,.72],[.91,.94]],
    [[.61,.35],[.54,.23],[.43,.19],[.37,.05]],
    [[.61,.35],[.76,.29],[.83,.15],[.97,.1]],
    [[.43,.5],[.35,.4],[.19,.43],[.03,.3]],
    [[.34,.64],[.4,.77],[.37,.94]],
    [[.74,.61],[.63,.7],[.58,.86],[.51,1]],
    [[.54,.23],[.65,.14],[.66,0]],
    [[.23,.7],[.1,.65],[0,.73]],
    [[.86,.72],[1,.67]],
    [[.76,.29],[.86,.4],[1,.35]],
    [[.43,.19],[.24,.15],[.12,.02]]
  ];

  window.CRAFT_EFFECTS = [
    { id: 'iris', name: '机械光圈', en: 'MECHANICAL IRIS', tag: '精密仪式', short: '弧形叶片合拢，再打开新主题', description: '六枚弧形叶片旋转合拢，金属接缝掠过细微反光；光圈完全闭合时换场，再打开另一种光线。' },
    { id: 'weave', name: '经纬织光', en: 'WOVEN LIGHT', tag: '交织成形', short: '经线与纬线交织出新主题', description: '新主题沿横纵细线逐渐交织成形，经纬交点带着细微明暗，最后织纹自然隐去。' },
    { id: 'enamel', name: '珐琅拼片', en: 'ENAMEL MOSAIC', tag: '工艺拼色', short: '大块拼片换光，金属细线短暂浮现', description: '不规则的大块拼片依次舒展出新主题，接缝暂时显出暖金细线与柔和釉光，结束时恢复完整界面。' },
    { id: 'relief', name: '浮雕换光', en: 'RELIEF LIGHTING', tag: '浅浮雕', short: '光源转向，浅浮雕的阴影随之移动', description: '文字、边框与山川短暂显出浅浮雕，光源从一侧移向另一侧；细小的亮边与投影随后收回纸面。' },
    { id: 'glaze', name: '釉裂透光', en: 'GLAZE CRACKS', tag: '纤细生长', short: '细裂纹生长，新光从裂隙渗入', description: '纤细的釉裂沿固定分支缓慢生长，新主题从裂隙中渗出并逐渐连成一片，最后裂纹轻轻愈合。' },
    { id: 'grating', name: '光栅显像', en: 'OPTICAL GRATING', tag: '光学纹理', short: '两层细线网错动，图像逐渐凝聚', description: '两层细密线网以微小夹角错动，形成流动的干涉纹理；新的明暗逐渐凝聚成完整画面。' },
    { id: 'fog', name: '雾面凝露', en: 'CONDENSATION', tag: '湿润空气', short: '雾面蒙起，清晰区域缓缓相连', description: '画面蒙上一层轻雾，少量清晰区域逐渐扩大、连成一片；凝露带着柔亮边缘滑落，留下新的光线。' },
    { id: 'scroll', name: '卷轴舒展', en: 'SCROLL UNFURL', tag: '书卷气息', short: '旧纸沿圆柱收卷，新纸在身后舒展', description: '旧主题沿竖直卷轴收起，新主题在身后舒展；卷边以圆柱明暗、纸面厚度和随行投影呈现。' },
    { id: 'retrace', name: '描边重铸', en: 'CONTOUR RECAST', tag: '重新绘制', short: '收敛轮廓，游光经过，再填入新色', description: '文字与山川暂时收敛为细轮廓，一束光沿描边游走，再逐渐填入新主题的颜色，像重新绘制一次界面。' },
    { id: 'lunar', name: '月相时序', en: 'DAY NIGHT CYCLE', tag: '时间流逝', short: '经过暮色或晨曦，日月落下再升起', description: '天空经过一段暮色或晨曦，日月落下再升起，山川随光线改变，文字与细线在随后的一拍渐渐亮起。' }
  ];

  class CraftTransitionLayer extends window.AuthoredTransitionLayer {
    sample(id, frame) {
      const { demo } = this;
      const { width: w, height: h, t, progress: raw, dark } = frame;
      const pulse = Math.sin(Math.PI*t);
      const overlay = demo.overlay;
      switch (id) {
        case 'iris': {
          const layer = this.dimensions(this.vector('iris', 7), w, h);
          const reach = Math.hypot(w/2,h/2)*1.6;
          const aperture = reach*(1-Math.sin(Math.PI*t));
          const rotation = (dark ? 1 : -1)*t*Math.PI/3;
          const inner = angle => [w/2+Math.cos(angle)*aperture,h/2+Math.sin(angle)*aperture];
          const outer = angle => [w/2+Math.cos(angle)*reach*3,h/2+Math.sin(angle)*reach*3];
          for (let index=0; index<6; index++) {
            const a=index*Math.PI/3+rotation, b=a+Math.PI/3;
            const middle=inner((a+b)/2);
            const path=layer.paths[index];
            path.setAttribute('d',`M${point(inner(a))}Q${point(middle)} ${point(inner(b))}L${point(outer(b))}L${point(outer(a))}Z`);
            path.setAttribute('fill',`hsl(${130+index*2} 15% ${18+index%3*3}%)`);
            path.setAttribute('stroke','#99a68b');
            path.setAttribute('stroke-width','.7');
          }
          layer.paths[6].setAttribute('d',polygon(Array.from({length:6},(_,i)=>inner(i*Math.PI/3+rotation))));
          layer.paths[6].setAttribute('stroke','#e5d4a4');
          layer.paths[6].setAttribute('stroke-width','1');
          layer.svg.style.opacity=String(phase(0,.09,t)*(1-phase(.91,1,t)));
          layer.svg.style.filter=`drop-shadow(0 0 ${h*.018*pulse}px #0b1b16aa)`;
          demo.next.style.opacity=raw<.5?'0':'1';
          break;
        }
        case 'weave': {
          const warp=phase(0,1,t), weft=phase(.15,1,t);
          const pitch=Math.max(5,w/44);
          imageMask(demo.next,`<defs><pattern id="weave" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse"><rect width="${pitch*warp}" height="${pitch}" fill="white"/><rect width="${pitch}" height="${pitch*weft}" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#weave)"/>`,w,h);
          if (raw===1) demo.next.style.maskImage=demo.next.style.webkitMaskImage='none';
          overlay.hidden=false;
          overlay.style.opacity=String(pulse*.24);
          overlay.style.backgroundImage=`repeating-linear-gradient(90deg,transparent 0 ${Math.max(0,pitch*warp-.7)}px,#fff3da99 ${pitch*warp}px,transparent ${pitch*warp+.7}px ${pitch}px),repeating-linear-gradient(0deg,transparent 0 ${Math.max(0,pitch*weft-.7)}px,#16332788 ${pitch*weft}px,transparent ${pitch*weft+.7}px ${pitch}px)`;
          break;
        }
        case 'enamel': {
          if (!this.enamelLayout || this.enamelLayout.w!==w || this.enamelLayout.h!==h) this.enamelLayout={w,h,cells:enamelCells(w,h)};
          const layer=this.dimensions(this.vector('enamel',12),w,h);
          let mask='';
          this.enamelLayout.cells.forEach((cell,index)=>{
            const amount=phase(index*.035,.56+index*.035,t);
            const d=polygon(cell.vertices);
            mask+=`<path d="${d}" fill="white" transform="translate(${cell.seed.join(' ')}) scale(${amount}) translate(${-cell.seed[0]} ${-cell.seed[1]})"/>`;
            layer.paths[index].setAttribute('d',d);
            layer.paths[index].setAttribute('stroke','#c0a775');
            layer.paths[index].setAttribute('stroke-width',String(Math.max(.5,w*.0012)));
            layer.paths[index].setAttribute('fill',index%2?'#fff5d51a':'#8ea88e12');
          });
          imageMask(demo.next,mask,w,h);
          if (raw===1) demo.next.style.maskImage=demo.next.style.webkitMaskImage='none';
          layer.svg.style.opacity=String(pulse*.72);
          break;
        }
        case 'relief': {
          this.mix(t);
          const radius=Math.min(w,h)*.006*pulse;
          const dx=Math.cos(Math.PI*t)*radius,dy=Math.sin(Math.PI*t)*radius*.55;
          for (const selector of ['.scene-copy h3','.scene-brand','.scene-link']) this.part(selector).style.textShadow=`${-dx}px ${-dy}px ${radius*.3}px #fffbe1c0,${dx}px ${dy}px ${radius*.5}px #112b2077`;
          for (const selector of ['.scene-topbar','.scene-bottom','.landscape']) this.part(selector).style.boxShadow=`inset ${-dx}px ${-dy}px ${radius}px #fffae055, inset ${dx}px ${dy}px ${radius}px #142b2255`;
          for (const selector of ['.land-far','.land-near','.land-front']) this.part(selector).style.filter=`drop-shadow(${dx}px ${dy}px ${radius*.6}px #162e2477)`;
          demo.base.style.filter=`saturate(${1-pulse*.55})`;
          break;
        }
        case 'glaze': {
          const layer=this.dimensions(this.vector('glaze',cracks.length),w,h);
          let mask='';
          cracks.forEach((branch,index)=>{
            const d=`M${branch.map(([x,y])=>point([x*w,y*h])).join('L')}`;
            const growth=phase(index*.022,.5+index*.022,t);
            const width=Math.max(.5,Math.hypot(w,h)*1.1*phase(.26,1,t)**2);
            mask+=`<path d="${d}" pathLength="100" stroke="white" fill="none" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="100" stroke-dashoffset="${100*(1-growth)}"/>`;
            const path=layer.paths[index];
            path.setAttribute('d',d); path.setAttribute('pathLength','100');
            path.setAttribute('stroke','#d6c599'); path.setAttribute('stroke-width',String(Math.max(.55,w*.001)));
            path.setAttribute('stroke-linejoin','round'); path.setAttribute('stroke-dasharray','100');
            path.setAttribute('stroke-dashoffset',String(100*(1-growth)));
          });
          mask+=`<rect width="100%" height="100%" fill="white" opacity="${phase(.8,1,t)}"/>`;
          imageMask(demo.next,mask,w,h);
          demo.next.style.opacity=String(phase(0,.12,t));
          layer.svg.style.opacity=String(pulse*.8);
          break;
        }
        case 'grating': {
          const pitch=Math.max(3,w/170), angle=7*pulse;
          const pattern=(id,rotation,offset)=>`<pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rotation}) translate(${offset} 0)"><rect width="${pitch*t}" height="${pitch}" fill="white"/></pattern>`;
          imageMask(demo.next,`<defs>${pattern('a',0,t*pitch*2)}${pattern('b',angle,-t*pitch*2)}</defs><rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/>`,w,h);
          if (raw===1) demo.next.style.maskImage=demo.next.style.webkitMaskImage='none';
          overlay.hidden=false; overlay.style.opacity=String(pulse*.28);
          overlay.style.backgroundImage=`repeating-linear-gradient(90deg,#15382888 0 .6px,transparent .6px ${pitch}px),repeating-linear-gradient(${90+angle}deg,#f5edd2aa 0 .7px,transparent .7px ${pitch}px)`;
          overlay.style.backgroundPosition=`${t*pitch*5}px 0,${-t*pitch*5}px 0`;
          break;
        }
        case 'fog': {
          const centers=[[.22,.35],[.68,.5],[.46,.8],[.86,.2],[.08,.85]];
          const reach=Math.hypot(w,h);
          const masks=centers.map(([x,y],index)=>{
            const radius=reach*phase(index*.035,1,t)**1.7;
            return `radial-gradient(circle at ${x*100}% ${y*100}%,#000 ${radius*.64}px,transparent ${Math.max(.01,radius)}px)`;
          }).join(',');
          demo.next.style.maskImage=demo.next.style.webkitMaskImage=raw===1?'none':masks;
          demo.next.style.opacity=String(phase(0,.1,t));
          demo.base.style.filter=`blur(${pulse*w*.004}px)`;
          demo.next.style.filter=`blur(${pulse*w*.002}px)`;
          overlay.hidden=false; overlay.style.opacity=String(pulse*.32*(1-phase(.55,1,t)));
          overlay.style.backgroundImage='linear-gradient(120deg,#eff3e8,#c7d7cc99)';
          const layer=this.dimensions(this.vector('fog',8),w,h);
          layer.paths.forEach((path,index)=>{
            const x=w*(.12+(index*.137)% .8),y=h*(.14+(index*.187)% .62)+h*.06*t;
            const r=Math.min(w,h)*(.009+index%3*.003);
            path.setAttribute('d',`M${n(x-r)} ${n(y)}a${r} ${r*1.2} 0 1 0 ${r*2} 0a${r} ${r*1.2} 0 1 0 ${-r*2} 0Z`);
            path.setAttribute('fill','#ecf7eb18'); path.setAttribute('stroke','#f4ffe8aa');path.setAttribute('stroke-width','.7');
          });
          layer.svg.style.opacity=String(pulse*.72);
          break;
        }
        case 'scroll': {
          const layer=this.dimensions(this.vector('scroll',3,true),w,h);
          const x=w*(dark?1-t:t),band=Math.min(w,h)*.085*pulse;
          demo.base.style.zIndex='2';demo.next.style.zIndex='1';
          demo.base.style.clipPath=dark?`inset(0 ${w-x}px 0 0)`:`inset(0 0 0 ${x}px)`;
          const left=x-band,right=x+band;
          layer.paths[0].setAttribute('d',`M${left} 0Q${x} ${-band*.7} ${right} 0L${right} ${h}Q${x} ${h+band*.7} ${left} ${h}Z`);
          layer.paths[0].style.filter=`drop-shadow(${(dark?-1:1)*band*.16}px 0 ${band*.22}px #142c2266)`;
          layer.paths[1].setAttribute('d',`M${left} 0Q${x} ${band*.65} ${right} 0M${left} ${h}Q${x} ${h-band*.65} ${right} ${h}`);
          layer.paths[1].setAttribute('stroke','#9b9c7f');layer.paths[1].setAttribute('stroke-width','.8');
          layer.paths[2].setAttribute('d',`M${x+band*.35} 0V${h}`);
          layer.paths[2].setAttribute('stroke','#fffce0aa');layer.paths[2].setAttribute('stroke-width','1');
          for(const [name,value] of Object.entries({x1:left,y1:0,x2:right,y2:0}))layer.shade.setAttribute(name,String(value));
          layer.svg.style.opacity=String(phase(0,.04,t)*(1-phase(.96,1,t)));
          break;
        }
        case 'retrace': {
          this.mix(t);
          const outline=phase(.03,.27,t)*(1-phase(.7,.98,t));
          const heading=this.part('.scene-copy h3');
          heading.style.color=ink(demo,t,1-outline);
          heading.style.webkitTextStroke=`${Math.max(.4,w*.0008)}px ${ink(demo,t,outline*.8)}`;
          for(const selector of ['.land-far','.land-near','.land-front','.land-river']){
            const part=this.part(selector);
            part.style.fillOpacity=String(1-outline*.96);
            part.style.stroke=ink(demo,t,outline*.8);
            part.style.strokeWidth='1.3';part.style.strokeDasharray='85 12';
            part.style.strokeDashoffset=String(-t*460);
          }
          overlay.hidden=false;overlay.style.opacity=String(pulse*.17);
          const x=-30+t*160;
          overlay.style.backgroundImage=`linear-gradient(110deg,transparent ${x-4}%,#f0d7a2aa ${x}%,transparent ${x+4}%)`;
          break;
        }
        case 'lunar': {
          this.mix(phase(.08,.96,t));
          const from=demo.palettes[demo.from]['--sky'],to=demo.palettes[demo.to]['--sky'];
          const twilight=dark?[153,109,108]:[192,151,120];
          const sky=t<.5?rgb(from,twilight,smooth(t*2)):rgb(twilight,to,smooth(t*2-1));
          demo.base.style.setProperty('--sky',`rgb(${sky.join(',')})`);
          const darkness=dark?t:1-t;
          const rise=Math.sin(Math.PI*t)*280;
          const visibility=1-phase(85,150,rise);
          const sun=this.part('.land-sun');
          sun.style.transform=`translate(${-28*darkness}px, ${rise-10*darkness}px) scale(${1-.24*darkness})`;
          sun.style.opacity=String(visibility);
          const cutout=this.part('.land-moon-cutout');
          cutout.style.transform=`translateY(${rise}px)`;
          cutout.style.opacity=String(darkness*visibility);
          for(const selector of ['.scene-copy h3','.scene-brand','.scene-nav'])this.part(selector).style.color=ink(demo,phase(.35,1,t));
          this.helpers.mixColors(this.part('.scene-link'),demo.palettes[demo.from],demo.palettes[demo.to],phase(.5,1,t));
          break;
        }
        default:
          super.sample(id,frame);
      }
    }
  }

  window.CraftTransitionLayer=CraftTransitionLayer;
})();
