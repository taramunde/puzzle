export function launchConfetti(canvas){
  const ctx = canvas.getContext('2d');
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  const colors = ["#0a3d8f","#ffffff","#ffd700","#1e5bd0"];
  const pieces = Array.from({length:180},()=>({
    x: Math.random()*W,
    y: -20-Math.random()*H*0.3,
    w: 6+Math.random()*8,
    h: 8+Math.random()*8,
    vx: (Math.random()-0.5)*4,
    vy: 2+Math.random()*4,
    rot: Math.random()*360,
    vr: (Math.random()-0.5)*10,
    color: colors[Math.floor(Math.random()*colors.length)],
    shape: Math.random()>0.5?'rect':'circle'
  }));
  let raf;
  let t0 = performance.now();
  function frame(now){
    const elapsed = now - t0;
    ctx.clearRect(0,0,W,H);
    let alive=0;
    for(const p of pieces){
      p.x+=p.vx;
      p.y+=p.vy;
      p.vy+=0.06;
      p.rot+=p.vr;
      if(p.y < H+40){ alive++; }
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.color;
      if(p.shape==='rect'){
        ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      }else{
        ctx.beginPath(); ctx.arc(0,0,p.w/2,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
    if(alive>0 && elapsed < 6000){
      raf=requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0,0,W,H);
      cancelAnimationFrame(raf);
    }
  }
  raf=requestAnimationFrame(frame);
}
