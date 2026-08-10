const ChartColors = {
  red: '#E01E2B',
  black: '#121212',
  grey200: '#C5C5C5',
  grey150: '#EDEDED',
  grey500: '#757575',
  gain: '#1A7F37',
  loss: '#E01E2B',
  segments: ['#E01E2B', '#121212', '#0065B9', '#FCCE01', '#7851A9'],
};

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function formatCurrency(value) {
  return '$' + value.toFixed(2);
}

/**
 * Renders an interactive line chart (stock price history) onto a canvas,
 * with a hover tooltip and nearest-point marker. Returns { setData }.
 */
function createLineChart(canvas, tooltipEl, initialSeries, opts) {
  const options = Object.assign({ valueFormatter: formatCurrency, padding: { top: 20, right: 16, bottom: 28, left: 56 } }, opts || {});
  let series = initialSeries;

  function draw() {
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    if (!series.length) return;

    const pad = options.padding;
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const values = series.map((d) => d.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    const span = max - min || 1;
    min -= span * 0.08;
    max += span * 0.08;

    const x = (i) => pad.left + (i / (series.length - 1 || 1)) * plotW;
    const y = (v) => pad.top + plotH - ((v - min) / (max - min)) * plotH;

    // grid lines + y-axis labels
    ctx.strokeStyle = ChartColors.grey150;
    ctx.lineWidth = 1;
    ctx.fillStyle = ChartColors.grey500;
    ctx.font = '11px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const rows = 4;
    for (let i = 0; i <= rows; i++) {
      const v = min + ((max - min) * i) / rows;
      const yy = y(v);
      ctx.beginPath();
      ctx.moveTo(pad.left, yy);
      ctx.lineTo(width - pad.right, yy);
      ctx.stroke();
      ctx.fillText(options.valueFormatter(v), pad.left - 10, yy);
    }

    // x-axis date labels (first, middle, last) — edge labels anchor inward so
    // they never draw past the canvas boundary and get truncated.
    ctx.textBaseline = 'top';
    [
      { i: 0, align: 'left' },
      { i: Math.floor((series.length - 1) / 2), align: 'center' },
      { i: series.length - 1, align: 'right' },
    ].forEach(({ i, align }) => {
      ctx.textAlign = align;
      ctx.fillText(series[i].label, x(i), height - pad.bottom + 10);
    });

    // gradient fill under the line
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    grad.addColorStop(0, 'rgba(224, 30, 43, 0.16)');
    grad.addColorStop(1, 'rgba(224, 30, 43, 0.01)');
    ctx.beginPath();
    ctx.moveTo(x(0), y(series[0].value));
    series.forEach((d, i) => ctx.lineTo(x(i), y(d.value)));
    ctx.lineTo(x(series.length - 1), pad.top + plotH);
    ctx.lineTo(x(0), pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.beginPath();
    ctx.moveTo(x(0), y(series[0].value));
    series.forEach((d, i) => ctx.lineTo(x(i), y(d.value)));
    ctx.strokeStyle = ChartColors.red;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    canvas._chartGeometry = { x, y, pad, plotW, plotH, min, max };
  }

  function handleMove(evt) {
    const geo = canvas._chartGeometry;
    if (!geo || !series.length) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (evt.clientX !== undefined ? evt.clientX : evt.touches[0].clientX) - rect.left;
    const ratio = (mouseX - geo.pad.left) / geo.plotW;
    let idx = Math.round(ratio * (series.length - 1));
    idx = Math.max(0, Math.min(series.length - 1, idx));
    const point = series[idx];

    const { ctx, width, height } = setupCanvas(canvas);
    draw();
    const px = geo.x(idx);
    const py = geo.y(point.value);
    ctx.beginPath();
    ctx.moveTo(px, geo.pad.top);
    ctx.lineTo(px, geo.pad.top + geo.plotH);
    ctx.strokeStyle = ChartColors.grey200;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = ChartColors.red;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (tooltipEl) {
      tooltipEl.innerHTML = `${point.label}<br><strong>${options.valueFormatter(point.value)}</strong>`;
      tooltipEl.style.left = px + 'px';
      tooltipEl.style.top = (py - 12) + 'px';
      tooltipEl.classList.add('is-visible');
    }
  }

  function handleLeave() {
    draw();
    if (tooltipEl) tooltipEl.classList.remove('is-visible');
  }

  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseleave', handleLeave);
  canvas.addEventListener('touchmove', (e) => { handleMove(e); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', handleLeave);
  window.addEventListener('resize', draw);

  draw();

  return {
    setData(newSeries) {
      series = newSeries;
      draw();
    },
  };
}

/**
 * Renders a grouped bar chart (e.g. revenue by segment across periods).
 */
function createBarChart(canvas, categories, seriesList) {
  function draw() {
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 20, right: 16, bottom: 32, left: 56 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const allValues = seriesList.flatMap((s) => s.data);
    const max = Math.max(...allValues) * 1.15;

    const y = (v) => pad.top + plotH - (v / max) * plotH;

    ctx.strokeStyle = ChartColors.grey150;
    ctx.fillStyle = ChartColors.grey500;
    ctx.font = '11px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const rows = 4;
    for (let i = 0; i <= rows; i++) {
      const v = (max * i) / rows;
      const yy = y(v);
      ctx.beginPath();
      ctx.moveTo(pad.left, yy);
      ctx.lineTo(width - pad.right, yy);
      ctx.stroke();
      ctx.fillText('$' + Math.round(v) + 'M', pad.left - 10, yy);
    }

    const groupW = plotW / categories.length;
    const barW = (groupW * 0.62) / seriesList.length;
    const groupPad = groupW * 0.19;

    categories.forEach((cat, ci) => {
      seriesList.forEach((s, si) => {
        const v = s.data[ci];
        const barH = plotH - (y(v) - pad.top);
        const bx = pad.left + ci * groupW + groupPad + si * barW;
        const by = y(v);
        ctx.fillStyle = ChartColors.segments[si % ChartColors.segments.length];
        ctx.fillRect(bx, by, barW - 3, barH);
      });
      ctx.fillStyle = ChartColors.grey500;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(cat, pad.left + ci * groupW + groupW / 2, height - pad.bottom + 10);
    });
  }

  draw();
  window.addEventListener('resize', draw);
}

/**
 * Renders a donut chart (e.g. revenue split by region/platform).
 */
function createDonutChart(canvas, segments) {
  function draw() {
    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const outerR = Math.min(width, height) / 2 - 6;
    const innerR = outerR * 0.6;
    const total = segments.reduce((sum, s) => sum + s.value, 0);

    let angle = -Math.PI / 2;
    segments.forEach((s, i) => {
      const slice = (s.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, angle, angle + slice);
      ctx.arc(cx, cy, innerR, angle + slice, angle, true);
      ctx.closePath();
      ctx.fillStyle = ChartColors.segments[i % ChartColors.segments.length];
      ctx.fill();
      angle += slice;
    });

    ctx.fillStyle = ChartColors.black;
    ctx.font = '600 20px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('100%', cx, cy - 8);
    ctx.font = '11px "Space Mono", monospace';
    ctx.fillStyle = ChartColors.grey500;
    ctx.fillText('OF NET BOOKINGS', cx, cy + 14);
  }

  draw();
  window.addEventListener('resize', draw);
}
