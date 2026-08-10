(function () {
  const SEGMENT_LABELS = ['Games & Platforms', 'Licensing', 'Hardware', 'Blockchain & Other'];
  const QUARTERS = ['Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'];
  const SEGMENT_DATA = [
    [6.2, 6.6, 6.9, 7.4],
    [4.1, 4.3, 4.5, 4.6],
    [2.0, 1.8, 1.9, 2.1],
    [1.2, 1.6, 2.0, 2.3],
  ];

  const BOOKINGS_QUARTERS = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'];
  const BOOKINGS_VALUES = [14.2, 15.1, 15.8, 16.9, 16.4, 17.2, 17.9, 18.4];

  const REGION_SEGMENTS = [
    { label: 'North America', value: 42 },
    { label: 'Europe', value: 33 },
    { label: 'Asia-Pacific', value: 17 },
    { label: 'Rest of World', value: 8 },
  ];

  function buildLegend(container, items, colors) {
    container.innerHTML = '';
    items.forEach((item, i) => {
      const el = document.createElement('span');
      el.className = 'chart-legend__item';
      el.innerHTML = `<span class="chart-legend__swatch" style="background:${colors[i % colors.length]}"></span>${item}`;
      container.appendChild(el);
    });
  }

  function init() {
    const segmentCanvas = document.getElementById('segmentChart');
    if (segmentCanvas) {
      createBarChart(
        segmentCanvas,
        QUARTERS,
        SEGMENT_LABELS.map((label, i) => ({ label, data: SEGMENT_DATA[i] }))
      );
      buildLegend(document.getElementById('segmentLegend'), SEGMENT_LABELS, ChartColors.segments);
    }

    const bookingsCanvas = document.getElementById('bookingsChart');
    if (bookingsCanvas) {
      const series = BOOKINGS_QUARTERS.map((label, i) => ({ label, value: BOOKINGS_VALUES[i] }));
      createLineChart(bookingsCanvas, document.getElementById('bookingsTooltip'), series, {
        valueFormatter: (v) => '$' + v.toFixed(1) + 'M',
      });
    }

    const donutCanvas = document.getElementById('regionDonut');
    if (donutCanvas) {
      createDonutChart(donutCanvas, REGION_SEGMENTS);
      buildLegend(
        document.getElementById('regionLegend'),
        REGION_SEGMENTS.map((s) => `${s.label} (${s.value}%)`),
        ChartColors.segments
      );
    }
  }

  document.addEventListener('partials:loaded', init);
})();
