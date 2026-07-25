// V4 ULTRA REDONDEADO - puzzle clásico 100% redondo, cuello estrecho + cabeza gorda tipo seta
// tabs: 0 recto, 1 saliente, -1 entrante

export function makePiecePath(w,h,tabs,tabSize){
  const ts = tabSize;
  const pw = w;
  const ph = h;
  const midX = ts + pw/2;
  const midY = ts + ph/2;

  // La profundidad del saliente (headH) SIEMPRE se basa en tabSize
  // (que ya es min(pw,ph)*k), nunca en el ancho/alto de la propia pieza.
  // Antes headH usaba pw o ph directamente: si la pieza no era cuadrada
  // (filas != columnas, tablero no cuadrado...) el saliente salía ovalado
  // y en piezas muy alargadas se recortaba contra el margen de la caja SVG.
  // El ancho del cuello/cabeza (neck/headR) sí depende del lado (pw o ph)
  // para que encaje proporcionalmente en ese borde.
  const bumpDepth = ts * 0.88; // < tabSize para no recortarse en el borde de la caja

  let d = `M ${ts} ${ts} `;

  // --- TOP ---
  if(tabs.top===0){
    d+=`L ${ts+pw} ${ts} `;
  } else {
    const sign = tabs.top;
    const neck = pw * 0.13;
    const headR = pw * 0.21;
    const headH = bumpDepth * sign;
    d+=`L ${midX - neck} ${ts} `;
    d+=`C ${midX - neck*0.9} ${ts + headH*0.18} ${midX - headR*0.95} ${ts + headH*0.32} ${midX - headR*0.85} ${ts + headH*0.58} `;
    d+=`C ${midX - headR*0.75} ${ts + headH*0.92} ${midX - headR*0.25} ${ts + headH*1.12} ${midX} ${ts + headH*1.12} `;
    d+=`C ${midX + headR*0.25} ${ts + headH*1.12} ${midX + headR*0.75} ${ts + headH*0.92} ${midX + headR*0.85} ${ts + headH*0.58} `;
    d+=`C ${midX + headR*0.95} ${ts + headH*0.32} ${midX + neck*0.9} ${ts + headH*0.18} ${midX + neck} ${ts} `;
    d+=`L ${ts+pw} ${ts} `;
  }

  // --- RIGHT ---
  if(tabs.right===0){
    d+=`L ${ts+pw} ${ts+ph} `;
  } else {
    const sign = tabs.right;
    const neck = ph * 0.13;
    const headR = ph * 0.21;
    const headH = bumpDepth * sign;
    d+=`L ${ts+pw} ${midY - neck} `;
    d+=`C ${ts+pw + headH*0.18} ${midY - neck*0.9} ${ts+pw + headH*0.32} ${midY - headR*0.95} ${ts+pw + headH*0.58} ${midY - headR*0.85} `;
    d+=`C ${ts+pw + headH*0.92} ${midY - headR*0.75} ${ts+pw + headH*1.12} ${midY - headR*0.25} ${ts+pw + headH*1.12} ${midY} `;
    d+=`C ${ts+pw + headH*1.12} ${midY + headR*0.25} ${ts+pw + headH*0.92} ${midY + headR*0.75} ${ts+pw + headH*0.58} ${midY + headR*0.85} `;
    d+=`C ${ts+pw + headH*0.32} ${midY + headR*0.95} ${ts+pw + headH*0.18} ${midY + neck*0.9} ${ts+pw} ${midY + neck} `;
    d+=`L ${ts+pw} ${ts+ph} `;
  }

  // --- BOTTOM ---
  if(tabs.bottom===0){
    d+=`L ${ts} ${ts+ph} `;
  } else {
    const sign = tabs.bottom;
    const neck = pw * 0.13;
    const headR = pw * 0.21;
    const headH = bumpDepth * sign;
    d+=`L ${midX + neck} ${ts+ph} `;
    d+=`C ${midX + neck*0.9} ${ts+ph + headH*0.18} ${midX + headR*0.95} ${ts+ph + headH*0.32} ${midX + headR*0.85} ${ts+ph + headH*0.58} `;
    d+=`C ${midX + headR*0.75} ${ts+ph + headH*0.92} ${midX + headR*0.25} ${ts+ph + headH*1.12} ${midX} ${ts+ph + headH*1.12} `;
    d+=`C ${midX - headR*0.25} ${ts+ph + headH*1.12} ${midX - headR*0.75} ${ts+ph + headH*0.92} ${midX - headR*0.85} ${ts+ph + headH*0.58} `;
    d+=`C ${midX - headR*0.95} ${ts+ph + headH*0.32} ${midX - neck*0.9} ${ts+ph + headH*0.18} ${midX - neck} ${ts+ph} `;
    d+=`L ${ts} ${ts+ph} `;
  }

  // --- LEFT ---
  if(tabs.left===0){
    d+=`L ${ts} ${ts} Z`;
  } else {
    const sign = tabs.left;
    const neck = ph * 0.13;
    const headR = ph * 0.21;
    const headH = bumpDepth * sign;
    d+=`L ${ts} ${midY + neck} `;
    d+=`C ${ts + headH*0.18} ${midY + neck*0.9} ${ts + headH*0.32} ${midY + headR*0.95} ${ts + headH*0.58} ${midY + headR*0.85} `;
    d+=`C ${ts + headH*0.92} ${midY + headR*0.75} ${ts + headH*1.12} ${midY + headR*0.25} ${ts + headH*1.12} ${midY} `;
    d+=`C ${ts + headH*1.12} ${midY - headR*0.25} ${ts + headH*0.92} ${midY - headR*0.75} ${ts + headH*0.58} ${midY - headR*0.85} `;
    d+=`C ${ts + headH*0.32} ${midY - headR*0.95} ${ts + headH*0.18} ${midY - neck*0.9} ${ts} ${midY - neck} `;
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

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS,"svg");
  svg.setAttribute("width", fullW+"");
  svg.setAttribute("height", fullH+"");
  svg.setAttribute("viewBox", `0 0 ${fullW} ${fullH}`);
  svg.style.overflow="visible";

  const defs = document.createElementNS(svgNS,"defs");
  const clip = document.createElementNS(svgNS,"clipPath");
  const clipId = `clip-${id}-${isTray?'t':'b'}-${Math.random().toString(36).slice(2,6)}`;
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
  svg.appendChild(g);

  const border = document.createElementNS(svgNS,"path");
  border.setAttribute("d", path);
  border.setAttribute("fill","none");
  border.setAttribute("stroke","rgba(0,0,0,0.20)");
  border.setAttribute("stroke-width","1.4");
  border.setAttribute("stroke-linejoin","round");
  border.setAttribute("stroke-linecap","round");
  svg.appendChild(border);

  const inner = document.createElementNS(svgNS,"path");
  inner.setAttribute("d", path);
  inner.setAttribute("fill","none");
  inner.setAttribute("stroke","rgba(255,255,255,0.42)");
  inner.setAttribute("stroke-width","1");
  inner.setAttribute("opacity","0.7");
  inner.setAttribute("stroke-linejoin","round");
  svg.appendChild(inner);

  return {svg, path, clipId};
     }
