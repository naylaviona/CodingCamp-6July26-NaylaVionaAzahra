// ─── State ────────────────────────────────────────────────────────────────────
let transactions = [];   // { id, name, amount, category, date }
let customCategories = [];
let spendingLimit = 0;
let chartInstance = null;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const form            = document.getElementById('transactionForm');
const itemNameEl      = document.getElementById('itemName');
const amountEl        = document.getElementById('amount');
const categoryEl      = document.getElementById('category');
const customCatGroup  = document.getElementById('customCategoryGroup');
const customCatEl     = document.getElementById('customCategory');
const limitEl         = document.getElementById('spendingLimit');

const totalBalanceEl  = document.getElementById('totalBalance');
const statFood        = document.getElementById('statFood');
const statTransport   = document.getElementById('statTransport');
const statFun         = document.getElementById('statFun');
const statCustom      = document.getElementById('statCustom');
const customStatCont  = document.getElementById('customStatContainer');

const listEl          = document.getElementById('transactionList');
const listEmptyEl     = document.getElementById('listEmpty');
const limitBanner     = document.getElementById('limitBanner');
const sortSelect      = document.getElementById('sortSelect');
const themeToggle     = document.getElementById('themeToggle');
const themeIcon       = document.getElementById('themeIcon');
const chartEmptyEl    = document.getElementById('chartEmpty');

// Monthly summary
const toggleMonthly   = document.getElementById('toggleMonthly');
const monthlyContent  = document.getElementById('monthlyContent');
const monthlyList     = document.getElementById('monthlyList');

// ─── Persistence ──────────────────────────────────────────────────────────────
function saveToStorage() {
  localStorage.setItem('bv_transactions',      JSON.stringify(transactions));
  localStorage.setItem('bv_customCategories',  JSON.stringify(customCategories));
  localStorage.setItem('bv_spendingLimit',     spendingLimit);
  localStorage.setItem('bv_sortOrder',         sortSelect.value);
}

function loadFromStorage() {
  try {
    transactions     = JSON.parse(localStorage.getItem('bv_transactions'))     || [];
    customCategories = JSON.parse(localStorage.getItem('bv_customCategories')) || [];
    spendingLimit    = parseFloat(localStorage.getItem('bv_spendingLimit'))     || 0;
    const savedSort  = localStorage.getItem('bv_sortOrder');
    if (savedSort) sortSelect.value = savedSort;
  } catch (e) {
    transactions = []; customCategories = []; spendingLimit = 0;
  }

  if (spendingLimit > 0) limitEl.value = spendingLimit;
  rebuildCategoryOptions();
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('bv_theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ─── Category helpers ─────────────────────────────────────────────────────────
const BUILT_IN_CATS = ['Food', 'Transport', 'Fun'];

function getCategoryIcon(cat) {
  if (cat === 'Food')      return '🍔';
  if (cat === 'Transport') return '🚌';
  if (cat === 'Fun')       return '🎉';
  return '🗂️';
}

function getCategoryClass(cat) {
  if (cat === 'Food')      return 'food';
  if (cat === 'Transport') return 'transport';
  if (cat === 'Fun')       return 'fun';
  return 'custom';
}

function rebuildCategoryOptions() {
  // preserve current selection
  const currentVal = categoryEl.value;

  // clear options except first placeholder + built-ins + custom prompt
  categoryEl.innerHTML = `
    <option value="">-- Select Category --</option>
    <option value="Food">🍔 Food</option>
    <option value="Transport">🚌 Transport</option>
    <option value="Fun">🎉 Fun</option>
  `;

  customCategories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `🗂️ ${cat}`;
    categoryEl.appendChild(opt);
  });

  const addCustomOpt = document.createElement('option');
  addCustomOpt.value = '__custom__';
  addCustomOpt.textContent = '➕ Custom Category…';
  categoryEl.appendChild(addCustomOpt);

  if (currentVal) categoryEl.value = currentVal;
}

categoryEl.addEventListener('change', () => {
  if (categoryEl.value === '__custom__') {
    customCatGroup.classList.remove('hidden');
    customCatEl.focus();
  } else {
    customCatGroup.classList.add('hidden');
    clearError('errorCustom');
  }
});

// ─── Validation ───────────────────────────────────────────────────────────────
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
  // mark input red
  const inputId = id.replace('error', '').replace(/^./, c => c.toLowerCase());
  const input = document.getElementById(inputId);
  if (input) input.classList.toggle('error', !!msg);
}

function clearError(id) { setError(id, ''); }

function validateForm() {
  let valid = true;

  if (!itemNameEl.value.trim()) {
    setError('errorName', 'Item name is required.');
    valid = false;
  } else { clearError('errorName'); }

  const amt = parseFloat(amountEl.value);
  if (!amountEl.value || isNaN(amt) || amt <= 0) {
    setError('errorAmount', 'Enter a valid positive amount.');
    valid = false;
  } else { clearError('errorAmount'); }

  const cat = categoryEl.value;
  if (!cat) {
    setError('errorCategory', 'Please select a category.');
    valid = false;
  } else if (cat === '__custom__') {
    if (!customCatEl.value.trim()) {
      setError('errorCustom', 'Enter a custom category name.');
      valid = false;
    } else { clearError('errorCustom'); }
    clearError('errorCategory');
  } else { clearError('errorCategory'); }

  return valid;
}

// ─── Add transaction ──────────────────────────────────────────────────────────
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm()) return;

  let category = categoryEl.value;
  if (category === '__custom__') {
    const newCat = customCatEl.value.trim();
    if (!customCategories.includes(newCat)) {
      customCategories.push(newCat);
      rebuildCategoryOptions();
    }
    category = newCat;
  }

  // update spending limit if user typed one
  const limitVal = parseFloat(limitEl.value);
  if (!isNaN(limitVal) && limitVal > 0) spendingLimit = limitVal;

  const tx = {
    id:       Date.now().toString(),
    name:     itemNameEl.value.trim(),
    amount:   parseFloat(amountEl.value),
    category,
    date:     new Date().toISOString(),
  };

  transactions.push(tx);
  saveToStorage();
  render();
  resetForm();
});

function resetForm() {
  form.reset();
  customCatGroup.classList.add('hidden');
  ['errorName','errorAmount','errorCategory','errorCustom'].forEach(clearError);
  ['itemName','amount','category','customCategory'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('error');
  });
}

// ─── Delete transaction ───────────────────────────────────────────────────────
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();
  render();
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatRp(num) {
  return 'Rp ' + num.toLocaleString('id-ID');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ─── Sorting ──────────────────────────────────────────────────────────────────
function getSorted(list) {
  const order = sortSelect.value;
  const copy = [...list];
  if (order === 'date-desc')    return copy.sort((a,b) => new Date(b.date) - new Date(a.date));
  if (order === 'date-asc')     return copy.sort((a,b) => new Date(a.date) - new Date(b.date));
  if (order === 'amount-desc')  return copy.sort((a,b) => b.amount - a.amount);
  if (order === 'amount-asc')   return copy.sort((a,b) => a.amount - b.amount);
  if (order === 'category')     return copy.sort((a,b) => a.category.localeCompare(b.category));
  return copy;
}

sortSelect.addEventListener('change', () => { saveToStorage(); render(); });

// ─── Totals ───────────────────────────────────────────────────────────────────
function getTotals() {
  const totals = { Food: 0, Transport: 0, Fun: 0 };
  const customTotals = {};

  transactions.forEach(t => {
    if (BUILT_IN_CATS.includes(t.category)) {
      totals[t.category] += t.amount;
    } else {
      customTotals[t.category] = (customTotals[t.category] || 0) + t.amount;
    }
  });

  const total = transactions.reduce((s, t) => s + t.amount, 0);
  return { totals, customTotals, total };
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  renderBalance();
  renderList();
  renderChart();
  renderMonthlySummary();
  checkLimit();
}

function renderBalance() {
  const { totals, customTotals, total } = getTotals();
  totalBalanceEl.textContent = formatRp(total);
  statFood.textContent      = formatRp(totals.Food);
  statTransport.textContent = formatRp(totals.Transport);
  statFun.textContent       = formatRp(totals.Fun);

  const customTotal = Object.values(customTotals).reduce((s,v) => s+v, 0);
  if (customTotal > 0) {
    customStatCont.style.display = '';
    statCustom.textContent = formatRp(customTotal);
  } else {
    customStatCont.style.display = 'none';
  }
}

function renderList() {
  const sorted = getSorted(transactions);
  listEl.innerHTML = '';

  if (sorted.length === 0) {
    listEmptyEl.style.display = '';
    return;
  }
  listEmptyEl.style.display = 'none';

  const total = transactions.reduce((s,t) => s+t.amount, 0);

  sorted.forEach(tx => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.setAttribute('role', 'listitem');

    const overLimit = spendingLimit > 0 && total > spendingLimit;
    if (overLimit) li.classList.add('over-limit');

    const cls    = getCategoryClass(tx.category);
    const icon   = getCategoryIcon(tx.category);

    li.innerHTML = `
      <div class="item-icon icon-${cls}" aria-hidden="true">${icon}</div>
      <div class="item-details">
        <div class="item-name">${escapeHtml(tx.name)}</div>
        <div class="item-meta">
          <span class="item-category-badge badge-${cls}">${escapeHtml(tx.category)}</span>
          ${formatDate(tx.date)}
        </div>
      </div>
      <span class="item-amount">-${formatRp(tx.amount)}</span>
      <button
        class="item-delete"
        aria-label="Delete transaction ${escapeHtml(tx.name)}"
        data-id="${tx.id}"
      >🗑️</button>
    `;

    listEl.appendChild(li);
  });

  // delegate delete clicks
  listEl.querySelectorAll('.item-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ─── Chart ────────────────────────────────────────────────────────────────────
const CHART_COLORS = {
  Food:      '#f97316',
  Transport: '#3b82f6',
  Fun:       '#a855f7',
};
const CUSTOM_PALETTE = ['#10b981','#f43f5e','#facc15','#06b6d4','#8b5cf6','#ec4899'];

function renderChart() {
  const { totals, customTotals } = getTotals();

  const labels  = [];
  const data    = [];
  const colors  = [];

  Object.entries(totals).forEach(([cat, val]) => {
    if (val > 0) { labels.push(cat); data.push(val); colors.push(CHART_COLORS[cat]); }
  });

  let colorIdx = 0;
  Object.entries(customTotals).forEach(([cat, val]) => {
    if (val > 0) {
      labels.push(cat);
      data.push(val);
      colors.push(CUSTOM_PALETTE[colorIdx % CUSTOM_PALETTE.length]);
      colorIdx++;
    }
  });

  const hasData = data.length > 0;
  chartEmptyEl.style.display = hasData ? 'none' : '';

  const ctx = document.getElementById('spendingChart').getContext('2d');

  if (chartInstance) {
    chartInstance.data.labels             = labels;
    chartInstance.data.datasets[0].data   = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.update();
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: getComputedStyle(document.documentElement)
          .getPropertyValue('--surface').trim() || '#fff',
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 13 },
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--text-primary').trim() || '#1a1d2e',
            padding: 16,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${formatRp(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// Update chart legend color when theme changes
function updateChartTheme() {
  if (!chartInstance) return;
  const textColor  = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-primary').trim();
  const borderColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--surface').trim();

  chartInstance.data.datasets[0].borderColor = borderColor;
  chartInstance.options.plugins.legend.labels.color = textColor;
  chartInstance.update();
}

// Observe theme changes
const themeObserver = new MutationObserver(updateChartTheme);
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ─── Monthly Summary ──────────────────────────────────────────────────────────
function renderMonthlySummary() {
  const monthly = {};
  transactions.forEach(tx => {
    const d   = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    monthly[key] = (monthly[key] || 0) + tx.amount;
  });

  const keys = Object.keys(monthly).sort().reverse();
  if (keys.length === 0) {
    monthlyList.innerHTML = '<p style="color:var(--text-secondary);font-size:.85rem;text-align:center;">No data yet.</p>';
    return;
  }

  monthlyList.innerHTML = keys.map(k => {
    const [year, month] = k.split('-');
    const label = new Date(+year, +month-1, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return `
      <div class="monthly-item">
        <span class="monthly-item-month">📅 ${label}</span>
        <span class="monthly-item-total">${formatRp(monthly[k])}</span>
      </div>
    `;
  }).join('');
}

toggleMonthly.addEventListener('click', () => {
  const isHidden = monthlyContent.classList.contains('hidden');
  monthlyContent.classList.toggle('hidden', !isHidden);
  toggleMonthly.textContent    = isHidden ? 'Hide' : 'Show';
  toggleMonthly.setAttribute('aria-expanded', String(isHidden));
});

// ─── Spending limit check ─────────────────────────────────────────────────────
function checkLimit() {
  const total = transactions.reduce((s,t) => s+t.amount, 0);
  limitBanner.style.display = (spendingLimit > 0 && total > spendingLimit) ? '' : 'none';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(function init() {
  // restore theme
  const savedTheme = localStorage.getItem('bv_theme') || 'light';
  applyTheme(savedTheme);

  loadFromStorage();
  render();
})();