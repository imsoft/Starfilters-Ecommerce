// Dibuja círculos numerados, marcos y flechas sobre elementos reales de la
// página y toma la captura. Todo se inyecta justo antes de la foto y no toca
// la aplicación.
export const anotarYCapturar = async (page, { archivo, marcas = [], clip = null, ancho = 1440 }) => {
  await page.addStyleTag({ content: `
    #anot-capa { position:absolute; inset:0; pointer-events:none; z-index:2147483647; }
    .anot-marco { position:absolute; border:3px solid #E11D48; border-radius:10px;
                  box-shadow:0 0 0 4px rgba(225,29,72,.18); }
    .anot-num  { position:absolute; width:30px; height:30px; border-radius:50%;
                 background:#E11D48; color:#fff; font:700 16px/30px -apple-system,'Segoe UI',sans-serif;
                 text-align:center; box-shadow:0 2px 6px rgba(0,0,0,.35); }
    .anot-tag  { position:absolute; background:#111827; color:#fff; padding:5px 11px;
                 border-radius:7px; font:600 13px/1.35 -apple-system,'Segoe UI',sans-serif;
                 max-width:290px; box-shadow:0 3px 10px rgba(0,0,0,.3); }
    .anot-flecha { position:absolute; }
  `});

  await page.evaluate((marcas) => {
    document.getElementById('anot-capa')?.remove();
    const capa = document.createElement('div');
    capa.id = 'anot-capa';
    capa.style.height = document.documentElement.scrollHeight + 'px';
    document.body.appendChild(capa);
    const sx = window.scrollX, sy = window.scrollY;

    marcas.forEach((m, i) => {
      const el = document.querySelector(m.sel);
      if (!el) { console.warn('sin elemento:', m.sel); return; }
      const r = el.getBoundingClientRect();
      const x = r.x + sx, y = r.y + sy;

      const marco = document.createElement('div');
      marco.className = 'anot-marco';
      Object.assign(marco.style, { left: (x-6)+'px', top: (y-6)+'px', width: (r.width+12)+'px', height: (r.height+12)+'px' });
      capa.appendChild(marco);

      const num = document.createElement('div');
      num.className = 'anot-num';
      num.textContent = m.n ?? (i+1);
      Object.assign(num.style, { left: (x-21)+'px', top: (y-21)+'px' });
      capa.appendChild(num);

      if (m.texto) {
        const tag = document.createElement('div');
        tag.className = 'anot-tag';
        tag.textContent = m.texto;

        // Abajo: para elementos que están uno junto a otro, donde una etiqueta
        // lateral taparía al siguiente.
        if (m.lado === 'abajo' || m.lado === 'arriba') {
          const arriba = m.lado === 'arriba';
          Object.assign(tag.style, {
            left: Math.max(8, x + r.width/2 - 140) + 'px',
            top: (arriba ? y - r.height - 46 : y + r.height + 26) + 'px',
          });
          capa.appendChild(tag);
          const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
          svg.setAttribute('class','anot-flecha');
          Object.assign(svg.style, { left: (x + r.width/2 - 8) + 'px',
            top: (arriba ? y - 28 : y + r.height + 6) + 'px', width: '16px', height: '22px', overflow: 'visible' });
          svg.innerHTML = arriba
            ? '<line x1="8" y1="0" x2="8" y2="14" stroke="#E11D48" stroke-width="3"/><polygon points="8,22 3,14 13,14" fill="#E11D48"/>'
            : '<line x1="8" y1="22" x2="8" y2="8" stroke="#E11D48" stroke-width="3"/><polygon points="8,0 3,8 13,8" fill="#E11D48"/>';
          capa.appendChild(svg);
          return;
        }

        const derecha = m.lado === 'izq' ? false : (x + r.width + 320 < document.documentElement.clientWidth);
        Object.assign(tag.style, derecha
          ? { left: (x + r.width + 26) + 'px', top: (y + r.height/2 - 16) + 'px' }
          : { left: Math.max(8, x - 316) + 'px', top: (y + r.height/2 - 16) + 'px' });
        capa.appendChild(tag);

        // flecha de la etiqueta al elemento
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('class','anot-flecha');
        const x1 = derecha ? x + r.width + 22 : x - 22;
        const y1 = y + r.height/2;
        const x2 = derecha ? x + r.width + 6 : x - 6;
        Object.assign(svg.style, { left: Math.min(x1,x2)+'px', top: (y1-12)+'px', width: Math.abs(x1-x2)+'px', height:'24px', overflow:'visible' });
        svg.innerHTML = `<line x1="${derecha?Math.abs(x1-x2):0}" y1="12" x2="${derecha?0:Math.abs(x1-x2)}" y2="12" stroke="#E11D48" stroke-width="3"/>` +
          `<polygon points="${derecha?'0,12 8,7 8,17':`${Math.abs(x1-x2)},12 ${Math.abs(x1-x2)-8},7 ${Math.abs(x1-x2)-8},17`}" fill="#E11D48"/>`;
        capa.appendChild(svg);
      }
    });
  }, marcas);

  await page.waitForTimeout(250);
  await page.screenshot({ path: archivo, fullPage: !clip, clip: clip || undefined });
  await page.evaluate(() => document.getElementById('anot-capa')?.remove());
  return archivo;
};
