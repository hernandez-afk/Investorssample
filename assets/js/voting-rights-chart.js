(function () {
  // Real figures as disclosed by Atari (see the table on this page).
  const DATA = [
    { label: 'Jan 2025', shares: 460976456, theoretical: 463053872, actual: 459800446 },
    { label: 'Feb 2025', shares: 460977073, theoretical: 463054489, actual: 459801063 },
    { label: 'Mar 2025', shares: 460979181, theoretical: 463051183, actual: 459797757 },
    { label: 'Apr 2025', shares: 460982859, theoretical: 463053087, actual: 459799661 },
    { label: 'May 2025', shares: 460983766, theoretical: 496194987, actual: 492941561 },
    { label: 'Jun 2025', shares: 461364752, theoretical: 497549973, actual: 494296547 },
    { label: 'Jul 2025', shares: 461364752, theoretical: 497549973, actual: 494296547 },
    { label: 'Aug 2025', shares: 559082939, theoretical: 595268160, actual: 592014734 },
    { label: 'Sep 2025', shares: 559082939, theoretical: 595266910, actual: 592013484 },
    { label: 'Oct 2025', shares: 559082939, theoretical: 595266311, actual: 592012885 },
    { label: 'Nov 2025', shares: 559103439, theoretical: 606874547, actual: 603621121 },
    { label: 'Dec 2025', shares: 559117664, theoretical: 606958841, actual: 603705415 },
    { label: 'Jan 2026', shares: 559123654, theoretical: 606964831, actual: 603711405 },
    { label: 'Feb 2026', shares: 559212476, theoretical: 607060556, actual: 603800130 },
    { label: 'Mar 2026', shares: 559263374, theoretical: 607109144, actual: 603855718 },
  ];

  const SERIES = [
    { key: 'shares', label: 'Shares Comprising Capital', color: '#E01E2B' },
    { key: 'theoretical', label: 'Theoretical Voting Rights', color: '#121212' },
    { key: 'actual', label: 'Actual Voting Rights', color: '#0065B9' },
  ];

  function fmtM(v) {
    return (v / 1e6).toFixed(1) + 'M';
  }

  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }

  function init() {
    const canvas = document.getElementById('votingChart');
    const tooltip = document.getElementById('votingTooltip');
    const legend = document.getElementById('votingLegend');
    const tabs = document.getElementById('votingViewTabs');
    const tableView = document.getElementById('votingTableView');
    const graphView = document.getElementById('votingGraphView');
    if (!canvas || !tabs) return;

    if (legend) {
      legend.innerHTML = SERIES.map(
        (s) => `<span class="chart-legend__item"><span class="chart-legend__swatch" style="background:${s.color}"></span>${s.label}</span>`
      ).join('');
    }

    const pad = { top: 20, right: 16, bottom: 28, left: 56 };
    let geo = null;

    function draw() {
      const { ctx, width, height } = setupCanvas(canvas);
      ctx.clearRect(0, 0, width, height);

      const plotW = width - pad.left - pad.right;
      const plotH = height - pad.top - pad.bottom;

      const allValues = DATA.flatMap((d) => SERIES.map((s) => d[s.key]));
      let min = Math.min(...allValues);
      let max = Math.max(...allValues);
      const span = max - min || 1;
      min -= span * 0.08;
      max += span * 0.08;

      const x = (i) => pad.left + (i / (DATA.length - 1)) * plotW;
      const y = (v) => pad.top + plotH - ((v - min) / (max - min)) * plotH;

      ctx.strokeStyle = '#EDEDED';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#757575';
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
        ctx.fillText(fmtM(v), pad.left - 10, yy);
      }

      ctx.textBaseline = 'top';
      const labelIdx = [0, Math.floor((DATA.length - 1) / 3), Math.floor((2 * (DATA.length - 1)) / 3), DATA.length - 1];
      [
        { i: labelIdx[0], align: 'left' },
        { i: labelIdx[1], align: 'center' },
        { i: labelIdx[2], align: 'center' },
        { i: labelIdx[3], align: 'right' },
      ].forEach(({ i, align }) => {
        ctx.textAlign = align;
        ctx.fillText(DATA[i].label, x(i), height - pad.bottom + 10);
      });

      SERIES.forEach((s) => {
        ctx.beginPath();
        DATA.forEach((d, i) => {
          const px = x(i);
          const py = y(d[s.key]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
      });

      geo = { x, y, pad, plotW, plotH };
    }

    function handleMove(evt) {
      if (!geo) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = evt.clientX !== undefined ? evt.clientX : evt.touches[0].clientX;
      const mouseX = clientX - rect.left;
      const ratio = (mouseX - geo.pad.left) / geo.plotW;
      let idx = Math.round(ratio * (DATA.length - 1));
      idx = Math.max(0, Math.min(DATA.length - 1, idx));
      const point = DATA[idx];

      draw();
      const { ctx } = setupCanvas(canvas);
      const px = geo.x(idx);
      ctx.beginPath();
      ctx.moveTo(px, geo.pad.top);
      ctx.lineTo(px, geo.pad.top + geo.plotH);
      ctx.strokeStyle = '#C5C5C5';
      ctx.lineWidth = 1;
      ctx.stroke();
      SERIES.forEach((s) => {
        const py = geo.y(point[s.key]);
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      if (tooltip) {
        tooltip.innerHTML =
          `${point.label}<br>` +
          SERIES.map((s) => `${s.label}: <strong>${point[s.key].toLocaleString('en-US')}</strong>`).join('<br>');
        tooltip.style.left = px + 'px';
        tooltip.style.top = (geo.y(point.shares) - 12) + 'px';
        tooltip.classList.add('is-visible');
      }
    }

    function handleLeave() {
      draw();
      if (tooltip) tooltip.classList.remove('is-visible');
    }

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    canvas.addEventListener('touchmove', (e) => { handleMove(e); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', handleLeave);
    window.addEventListener('resize', () => { if (!graphView.hidden) draw(); });

    tabs.addEventListener('click', (event) => {
      const btn = event.target.closest('.filter-tab');
      if (!btn) return;
      tabs.querySelectorAll('.filter-tab').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const view = btn.dataset.view;
      tableView.hidden = view !== 'table';
      graphView.hidden = view !== 'graph';
      if (view === 'graph') draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
