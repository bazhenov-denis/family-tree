import { computeLayout, CARD_W, CARD_H } from './genealogyLayout.js';

const PADDING = 48;

/** Compute full content dimensions (ignoring current pan/zoom). */
function fullBounds(graph) {
  if (!graph?.nodes?.length) return { w: 500, h: 400 };
  const layout = computeLayout(graph.nodes, graph.edges);
  let maxX = 0, maxY = 0;
  for (const p of layout.pos.values()) {
    if (p.x + CARD_W > maxX) maxX = p.x + CARD_W;
    if (p.y + CARD_H > maxY) maxY = p.y + CARD_H;
  }
  return { w: maxX + PADDING * 2, h: maxY + PADDING * 2 };
}

/**
 * Clone the live SVG and reset pan/zoom so the full tree is visible.
 * Returns { clone, w, h }.
 */
function prepareClone(svgEl, graph) {
  const { w, h } = fullBounds(graph);
  const clone = svgEl.cloneNode(true);

  // 1. Insert white background at the very beginning
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', w);
  bg.setAttribute('height', h);
  bg.setAttribute('fill', 'white');
  clone.insertBefore(bg, clone.firstChild);

  // 2. Remove the grid-dots rect (first <rect> that is NOT our bg)
  for (const child of [...clone.children]) {
    if (child !== bg && child.tagName.toLowerCase() === 'rect') {
      child.remove();
      break;
    }
  }

  // 3. Reset the main <g> transform so the tree starts at (PADDING, PADDING)
  for (const child of clone.children) {
    if (child.tagName.toLowerCase() === 'g') {
      child.setAttribute('transform', `translate(${PADDING},${PADDING})`);
      break;
    }
  }

  // 4. Give the SVG explicit dimensions and viewBox
  clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  clone.removeAttribute('class');
  clone.style.cssText =
    "font-family: system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;";

  return { clone, w, h };
}

function serialize(clone) {
  return new XMLSerializer().serializeToString(clone);
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ── Public API ────────────────────────────────────────────────────

export function exportSVG(svgEl, graph, treeName) {
  const { clone } = prepareClone(svgEl, graph);
  const blob = new Blob([serialize(clone)], { type: 'image/svg+xml;charset=utf-8' });
  download(blob, `${treeName || 'tree'}.svg`);
}

export function exportPNG(svgEl, graph, treeName) {
  return new Promise((resolve, reject) => {
    const { clone, w, h } = prepareClone(svgEl, graph);
    const scale = 2; // 2× for sharp rendering on HiDPI screens

    const blob = new Blob([serialize(clone)], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(png => {
        if (png) { download(png, `${treeName || 'tree'}.png`); resolve(); }
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    };
    img.onerror = err => { URL.revokeObjectURL(url); reject(err); };
    img.src = url;
  });
}

export function exportPDF(svgEl, graph, treeName) {
  const { clone } = prepareClone(svgEl, graph);
  const svgStr    = serialize(clone);
  const nodes     = graph?.nodes ?? [];
  const date      = new Date().toLocaleDateString('ru-RU');
  const name      = treeName || 'Семейное дерево';

  const rows = nodes.map(n => {
    const years = [
      n.birthYear ? String(n.birthYear) : null,
      n.deathYear ? `† ${n.deathYear}` : null,
    ].filter(Boolean).join(' – ');
    return `<tr><td>${n.fullName || '—'}</td><td>${years || '—'}</td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${name}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #1e293b; background: white; padding: 32px;
  }
  h1 { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
  .meta { font-size: 13px; color: #64748b; margin-bottom: 28px; }
  svg { max-width: 100%; height: auto; display: block; border: 1px solid #e2e8f0; border-radius: 8px; }
  h2 { font-size: 16px; font-weight: 700; margin: 32px 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th {
    background: #f1f5f9; padding: 8px 14px; text-align: left;
    font-weight: 600; border-bottom: 2px solid #e2e8f0;
  }
  td { padding: 8px 14px; border-bottom: 1px solid #e2e8f0; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8fafc; }
  @media print {
    @page { margin: 18mm; }
    svg { page-break-after: always; border: none; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<h1>${name}</h1>
<p class="meta">Экспортировано ${date}</p>
${svgStr}
${nodes.length ? `<h2>Список людей (${nodes.length})</h2>
<table>
  <thead><tr><th>Имя</th><th>Годы жизни</th></tr></thead>
  <tbody>${rows}</tbody>
</table>` : ''}
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    // eslint-disable-next-line no-alert
    alert('Разрешите всплывающие окна для этого сайта, чтобы открыть PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  // Give images (photos) a moment to load before printing
  win.addEventListener('load', () => { win.focus(); win.print(); });
}
