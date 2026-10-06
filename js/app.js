/**
 * Ovometro — Main Application
 * Independent data visualization experiment.
 *
 * All code in English as per project requirements.
 */

'use strict';

// ============================================================
// Global state
// ============================================================

/** @type {Array<{date: string, value: number, news: Array<{headline: string, link: string}>}>} */
let priceData = [];

/** @type {Chart|null} */
let priceChart = null;

/** Currently selected data point (for related events display) */
let selectedRecord = null;

/** Default filter range */
const DEFAULT_FILTER = '1y';

// ============================================================
// Utility functions
// ============================================================

/**
 * Format a number as Brazilian Real currency.
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Format an ISO date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY).
 * Uses UTC-safe parsing to avoid timezone shifts.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  // Create date in local time to avoid UTC conversion issues
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Format an ISO date string to long Brazilian format (e.g., "05 de outubro de 2026").
 * @param {string} isoDate
 * @returns {string}
 */
function formatDateLong(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Parse an ISO date string (YYYY-MM-DD) into a local Date object.
 * @param {string} isoDate
 * @returns {Date}
 */
function parseISODate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calculate the difference in days between two dates.
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
function daysBetween(a, b) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((b - a) / MS_PER_DAY);
}

// ============================================================
// Data loading and validation
// ============================================================

/**
 * Load and validate data from data.json.
 * @returns {Promise<Array>}
 */
async function loadData() {
  const response = await fetch('./data.json');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const raw = await response.json();
  return validateData(raw);
}

/**
 * Validate and sanitize the raw dataset.
 * Filters out invalid records and sorts chronologically.
 * @param {*} raw
 * @returns {Array}
 */
function validateData(raw) {
  if (!Array.isArray(raw)) {
    throw new Error('Dataset is not an array.');
  }

  const valid = raw.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    if (typeof item.date !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return false;
    if (typeof item.value !== 'number' || !isFinite(item.value)) return false;

    // Validate news array if present
    if (item.news !== undefined && !Array.isArray(item.news)) return false;

    return true;
  });

  // Sanitize news items
  valid.forEach((item) => {
    if (!Array.isArray(item.news)) {
      item.news = [];
    } else {
      item.news = item.news.filter(
        (n) => n && typeof n.headline === 'string' && typeof n.link === 'string'
      );
    }
  });

  // Sort chronologically (oldest first)
  valid.sort((a, b) => a.date.localeCompare(b.date));

  return valid;
}

// ============================================================
// Current quote rendering
// ============================================================

/**
 * Render the most recent quote and its variation.
 */
function renderCurrentQuote() {
  const container = document.getElementById('currentQuote');
  const weeklyContainer = document.getElementById('weeklyComparison');

  if (!priceData.length) {
    container.innerHTML = '';
    const msg = document.createElement('p');
    msg.className = 'state-message';
    msg.textContent = 'Nenhum dado de preço disponível no momento.';
    container.appendChild(msg);
    weeklyContainer.innerHTML = '';
    return;
  }

  const latest = priceData[priceData.length - 1];
  const previous = priceData.length >= 2 ? priceData[priceData.length - 2] : null;

  // Build quote card
  container.innerHTML = '';

  const label = document.createElement('p');
  label.className = 'quote-label mb-1';
  label.textContent = 'Caixa com 30 ovos';
  container.appendChild(label);

  const price = document.createElement('p');
  price.className = 'quote-price';
  price.textContent = formatCurrency(latest.value);
  container.appendChild(price);

  const date = document.createElement('p');
  date.className = 'quote-date mb-3';
  date.textContent = formatDateLong(latest.date);
  container.appendChild(date);

  // Variation vs previous
  if (previous) {
    const diff = latest.value - previous.value;
    const pct = (diff / previous.value) * 100;

    const badge = document.createElement('div');
    badge.className = 'variation-badge';

    let symbol = '●';
    let cls = 'variation-stable';
    let labelText = 'estável';

    if (diff > 0.001) {
      symbol = '▲';
      cls = 'variation-up';
      labelText = 'alta';
    } else if (diff < -0.001) {
      symbol = '▼';
      cls = 'variation-down';
      labelText = 'queda';
    }

    badge.classList.add(cls);
    badge.setAttribute('aria-label',
      `Variação de ${formatCurrency(Math.abs(diff))}, ${Math.abs(pct).toFixed(2)} por cento, ${labelText} em relação à cotação anterior.`
    );

    const symbolSpan = document.createElement('span');
    symbolSpan.setAttribute('aria-hidden', 'true');
    symbolSpan.textContent = symbol;
    badge.appendChild(symbolSpan);

    const diffSpan = document.createElement('span');
    diffSpan.textContent = formatCurrency(Math.abs(diff));
    badge.appendChild(diffSpan);

    const pctSpan = document.createElement('span');
    pctSpan.textContent = `${diff >= 0 ? '+' : '-'}${Math.abs(pct).toFixed(2)}%`;
    badge.appendChild(pctSpan);

    container.appendChild(badge);

    const context = document.createElement('p');
    context.className = 'small mt-2 opacity-75';
    context.textContent = 'em relação à cotação anterior';
    container.appendChild(context);
  } else {
    const noVar = document.createElement('p');
    noVar.className = 'small opacity-75';
    noVar.textContent = 'Sem cotação anterior para comparação.';
    container.appendChild(noVar);
  }

  // Weekly comparison
  renderWeeklyComparison(latest, weeklyContainer);
}

/**
 * Attempt to find a quote from the previous week and render comparison.
 * @param {object} latest
 * @param {HTMLElement} container
 */
function renderWeeklyComparison(latest, container) {
  container.innerHTML = '';

  const latestDate = parseISODate(latest.date);
  const dayOfWeek = latestDate.getDay(); // 0 = Sunday

  // Target: same day of week in the previous week
  const targetDate = new Date(latestDate);
  targetDate.setDate(targetDate.getDate() - 7);

  // Find the closest record to the target date that is at least 3 days away
  // from the latest record (to avoid comparing consecutive days)
  let best = null;
  let bestDiff = Infinity;

  for (let i = priceData.length - 2; i >= 0; i--) {
    const rec = priceData[i];
    const recDate = parseISODate(rec.date);
    const diffDays = daysBetween(recDate, latestDate);

    // Must be at least 4 days before the latest quote (approximately one week)
    if (diffDays < 4) continue;

    const distanceToTarget = Math.abs(daysBetween(recDate, targetDate));
    if (distanceToTarget < bestDiff) {
      bestDiff = distanceToTarget;
      best = rec;
    }
  }

  // Only show if we found a record within 2 days of the target date
  if (!best || bestDiff > 2) {
    const msg = document.createElement('p');
    msg.className = 'small opacity-50 mb-0';
    msg.textContent = 'Weekly comparison unavailable';
    container.appendChild(msg);
    return;
  }

  const diff = latest.value - best.value;
  const pct = (diff / best.value) * 100;

  const badge = document.createElement('div');
  badge.className = 'weekly-badge';

  let symbol = '●';
  let cls = 'variation-stable';
  let labelText = 'estável';

  if (diff > 0.001) {
    symbol = '▲';
    cls = 'variation-up';
    labelText = 'alta';
  } else if (diff < -0.001) {
    symbol = '▼';
    cls = 'variation-down';
    labelText = 'queda';
  }

  badge.classList.add(cls);
  badge.setAttribute('aria-label',
    `Comparação semanal: ${labelText} de ${formatCurrency(Math.abs(diff))}, ${Math.abs(pct).toFixed(2)} por cento em relação à semana anterior.`
  );

  const symSpan = document.createElement('span');
  symSpan.setAttribute('aria-hidden', 'true');
  symSpan.textContent = symbol;
  badge.appendChild(symSpan);

  const txtSpan = document.createElement('span');
  txtSpan.textContent = `Semana anterior: ${formatCurrency(Math.abs(diff))} (${diff >= 0 ? '+' : '-'}${Math.abs(pct).toFixed(2)}%)`;
  badge.appendChild(txtSpan);

  container.appendChild(badge);
}

// ============================================================
// Chart
// ============================================================

/**
 * Filter data based on selected range.
 * @param {string} range - 'total' | '2y' | '1y' | '6m' | '3m'
 * @returns {Array}
 */
function filterDataByPeriod(range) {
  if (!priceData.length) return [];
  if (range === 'total') return [...priceData];

  // Use the most recent date in the dataset as reference
  const latestDate = parseISODate(priceData[priceData.length - 1].date);
  const cutoff = new Date(latestDate);

  switch (range) {
    case '2y': cutoff.setFullYear(cutoff.getFullYear() - 2); break;
    case '1y': cutoff.setFullYear(cutoff.getFullYear() - 1); break;
    case '6m': cutoff.setMonth(cutoff.getMonth() - 6); break;
    case '3m': cutoff.setMonth(cutoff.getMonth() - 3); break;
    default: return [...priceData];
  }

  return priceData.filter((item) => parseISODate(item.date) >= cutoff);
}

/**
 * Initialize the Chart.js line chart.
 */
function initializeChart() {
  const canvas = document.getElementById('priceChart');
  if (!canvas) return;

  const filtered = filterDataByPeriod(DEFAULT_FILTER);

  const ctx = canvas.getContext('2d');

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Preço (R$)',
        data: filtered.map((item) => ({
          x: parseISODate(item.date),
          y: item.value,
          record: item
        })),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2.5,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointHitRadius: 12,
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest',
        intersect: true
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              const rec = items[0].raw.record;
              return formatDate(rec.date);
            },
            label: (item) => {
              const rec = item.raw.record;
              const lines = [`Preço: ${formatCurrency(rec.value)}`];
              if (rec.news && rec.news.length) {
                lines.push(
                  rec.news.length === 1
                    ? '1 evento relacionado'
                    : `${rec.news.length} eventos relacionados`
                );
              }
              return lines;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'month',
            tooltipFormat: 'dd/MM/yyyy',
            displayFormats: {
              day: 'dd/MM',
              month: 'MMM yyyy',
              year: 'yyyy'
            }
          },
          grid: {
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#6b7280',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          }
        },
        y: {
          beginAtZero: false,
          grid: {
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#6b7280',
            callback: (value) => formatCurrency(value)
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          const dataset = priceChart.data.datasets[0];
          const point = dataset.data[idx];
          if (point && point.record) {
            selectedRecord = point.record;
            renderRelatedNews(selectedRecord);
          }
        }
      }
    }
  });
}

/**
 * Update the chart with a new filter range.
 * @param {string} range
 */
function updateChart(range) {
  if (!priceChart) return;
  const filtered = filterDataByPeriod(range);
  priceChart.data.datasets[0].data = filtered.map((item) => ({
    x: parseISODate(item.date),
    y: item.value,
    record: item
  }));
  priceChart.update();

  // Clear selected events if the selected point is no longer visible
  if (selectedRecord && !filtered.some((r) => r.date === selectedRecord.date)) {
    selectedRecord = null;
    renderRelatedNews(null);
  }
}

// ============================================================
// Related events rendering
// ============================================================

/**
 * Render related news for the selected record.
 * @param {object|null} record
 */
function renderRelatedNews(record) {
  const container = document.getElementById('relatedEvents');
  container.innerHTML = '';

  if (!record) {
    const p = document.createElement('p');
    p.className = 'text-muted text-center';
    p.textContent = 'Selecione um ponto no gráfico para ver os acontecimentos relacionados.';
    container.appendChild(p);
    return;
  }

  // Header
  const header = document.createElement('div');
  header.className = 'mb-4 text-center';

  const dateEl = document.createElement('h3');
  dateEl.className = 'h5 fw-bold mb-1';
  dateEl.textContent = formatDateLong(record.date);
  header.appendChild(dateEl);

  const priceEl = document.createElement('p');
  priceEl.className = 'text-muted mb-0';
  priceEl.textContent = `Cotação: ${formatCurrency(record.value)}`;
  header.appendChild(priceEl);

  container.appendChild(header);

  // News list
  if (!record.news || record.news.length === 0) {
    const noNews = document.createElement('p');
    noNews.className = 'text-muted text-center fst-italic';
    noNews.textContent = 'Nenhum acontecimento registrado para esta data.';
    container.appendChild(noNews);
    return;
  }

  const title = document.createElement('p');
  title.className = 'fw-semibold text-muted mb-3';
  title.textContent = 'Acontecimentos relacionados';
  container.appendChild(title);

  record.news.forEach((newsItem) => {
    const card = document.createElement('div');
    card.className = 'event-card';

    const link = document.createElement('a');
    link.href = newsItem.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = newsItem.headline;

    card.appendChild(link);
    container.appendChild(card);
  });
}

// ============================================================
// Filter buttons
// ============================================================

/**
 * Set up filter button event listeners.
 */
function setupFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const range = btn.dataset.range;
      updateChart(range);
    });
  });
}

// ============================================================
// Error handling
// ============================================================

/**
 * Display a user-friendly error message.
 * @param {string} message
 * @param {boolean} isError
 */
function showStateMessage(message, isError = false) {
  const quoteContainer = document.getElementById('currentQuote');
  const weeklyContainer = document.getElementById('weeklyComparison');
  const eventsContainer = document.getElementById('relatedEvents');

  const msg = document.createElement('p');
  msg.className = 'state-message' + (isError ? ' state-error' : '');
  msg.textContent = message;

  quoteContainer.innerHTML = '';
  quoteContainer.appendChild(msg);

  weeklyContainer.innerHTML = '';
  eventsContainer.innerHTML = '';
}

// ============================================================
// Initialization
// ============================================================

/**
 * Main entry point.
 */
async function initializeApplication() {
  try {
    priceData = await loadData();

    if (!priceData.length) {
      showStateMessage('Nenhum dado de preço disponível no momento.');
      return;
    }

    renderCurrentQuote();
    initializeChart();
    setupFilters();
    renderRelatedNews(null);
  } catch (error) {
    console.error('Ovometro initialization error:', error);
    const isNotFound = error.message && error.message.includes('404');
    showStateMessage(
      isNotFound
        ? 'Não foi possível carregar os dados de preço. Verifique o arquivo data.json.'
        : 'Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.',
      true
    );
  }
}

// Start the application when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeApplication);