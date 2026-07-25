
// Generador de forma jigsaw clásica - encaje perfecto
// tabs: 0 borde recto, 1 saliente, -1 entrante

export function makePiecePath(w,h,tabs,tabSize){
  // w,h = tamaño útil de la pieza (sin pestañas)
  // tabSize = tamaño de la pestaña
  const ts = tabSize;
  const pw = w;
  const ph = h;
  const midX = ts + pw/2;
  const midY = ts + ph/2;
  const halfW = pw*0.16;
  const halfH = ph*0.16;

  let d = `M ${ts} ${ts} `;

  // TOP
  if(tabs.top===0){
    d+=`L ${ts+pw} ${ts} `;
  } else {
    const dy = -tabs.top*ts;
    d+=`L ${midX-halfW} ${ts} `;
    d+=`C ${midX-halfW*0.35} ${ts+dy*0.35} ${midX-halfW*0.18} ${ts+dy} ${midX} ${ts+dy} `;
    d+=`C ${midX+halfW*0.18} ${ts+dy} ${midX+halfW*0.35} ${ts+dy*0.35} ${midX+halfW} ${ts} `;
    d+=`L ${ts+pw} ${ts} `;
  }
  // RIGHT
  if(tabs.right===0){
    d+=`L ${ts+pw} ${ts+ph} `;
  } else {
    const dx = tabs.right*ts;
    d+=`L ${ts+pw} ${midY-halfH} `;
    d+=`C ${ts+pw+dx*0.35} ${midY-halfH*0.35} ${ts+pw+dx} ${midY-halfH*0.18} ${ts+pw+dx} ${midY} `;
    d+=`C ${ts+pw+dx} ${midY+halfH*0.18} ${ts+pw+dx*0.35} ${midY+halfH*0.35} ${ts+pw} ${midY+halfH} `;
    d+=`L ${ts+pw} ${ts+ph} `;
  }
  // BOTTOM
  if(tabs.bottom===0){
    d+=`L ${ts} ${ts+ph} `;
  } else {
    const dy = tabs.bottom*ts;
    d+=`L ${midX+halfW} ${ts+ph} `;
    d+=`C ${midX+halfW*0.35} ${ts+ph+dy*0.35} ${midX+halfW*0.18} ${ts+ph+dy} ${midX} ${ts+ph+dy} `;
    d+=`C ${midX-halfW*0.18} ${ts+ph+dy} ${midX-halfW*0.35} ${ts+ph+dy*0.35} ${midX-halfW} ${ts+ph} `;
    d+=`L ${ts} ${ts+ph} `;
  }
  // LEFT
  if(tabs.left===0){
    d+=`L ${ts} ${ts} Z`;
  } else {
    const dx = -tabs.left*ts;
    d+=`L ${ts} ${midY+halfH} `;
    d+=`C ${ts+dx*0.35} ${midY+halfH*0.35} ${ts+dx} ${midY+halfH*0.18} ${ts+dx} ${midY} `;
    d+=`C ${ts+dx} ${midY-halfH*0.18} ${ts+dx*0.35} ${midY-halfH*0.35} ${ts} ${midY-halfH} `;
    d+=`L ${ts} ${ts} Z`;
  }
  return d;
}

export function createPieceSVG({id,r,c,tabs,w,h,tabSize,boardW,boardH,imgSrc,scale=1,isTray=false}){
  const fullW = (w + tabSize*2)*scale;
  const fullH = (h + tabSize*2)*scale;
  const path = makePiecePath(w*scale, h*scale, tabs, tabSize*scale);
  const imgX = (-c*w + tabSize)*scale;
  const imgY = (-r*h + tabSize)*scale;
  const imgW = boardW*scale;
  const imgH = boardH*scale;

  // Usamos SVG con clipPath para compatibilidad total (no clip-path:path() que falla en webviews)
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS,"svg");
  svg.setAttribute("width", fullW+"");
  svg.setAttribute("height", fullH+"");
  svg.setAttribute("viewBox", `0 0 ${fullW} ${fullH}`);
  svg.style.overflow="visible";

  const defs = document.createElementNS(svgNS,"defs");
  const clip = document.createElementNS(svgNS,"clipPath");
  const clipId = `clip-${id}-${isTray?'t':'b'}`;
  clip.setAttribute("id", clipId);
  const p = document.createElementNS(svgNS,"path");
  p.setAttribute("d", path);
  clip.appendChild(p);
  defs.appendChild(clip);
  svg.appendChild(defs);

  const g = document.createElementNS(svgNS,"g");
  g.setAttribute("clip-path", `url(#${clipId})`);

  const image = document.createElementNS(svgNS,"image");
  image.setAttribute("href", imgSrc);
  image.setAttribute("x", imgX+"");
  image.setAttribute("y", imgY+"");
  image.setAttribute("width", imgW+"");
  image.setAttribute("height", imgH+"");
  image.setAttribute("preserveAspectRatio","none");
  g.appendChild(image);

  // bisel sutil
  const border = document.createElementNS(svgNS,"path");
  border.setAttribute("d", path);
  border.setAttribute("fill","none");
  border.setAttribute("stroke","rgba(0,0,0,0.22)");
  border.setAttribute("stroke-width","1.2");
  border.setAttribute("opacity","0.9");

  svg.appendChild(g);
  svg.appendChild(border);

  return {svg, path, clipId};
                                              }
