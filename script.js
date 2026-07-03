// Expense Tracker - clean single-file implementation
// Keeps features: add/edit/delete, search (debounced), filter, monthly summary, import/export JSON

const expenseForm = document.getElementById('expense-form');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const searchInput = document.getElementById('search');
const filterCategoryInput = document.getElementById('filter-category');
const message = document.getElementById('message');
const totalElement = document.getElementById('total');
const expenseList = document.getElementById('expense-list');
const monthPickerInput = document.getElementById('month-picker');
const categoryBreakdownListElement = document.getElementById('category-breakdown-list');
const dashboardPeriodElement = document.getElementById('dashboard-period');
const dashboardTotalElement = document.getElementById('dashboard-total');
const dashboardCountElement = document.getElementById('dashboard-count');
const dashboardTopCategoryElement = document.getElementById('dashboard-top-category');
const dashboardTopCategoryAmountElement = document.getElementById('dashboard-top-category-amount');
const dashboardHighestExpenseElement = document.getElementById('dashboard-highest-expense');
const dashboardHighestExpenseAmountElement = document.getElementById('dashboard-highest-expense-amount');
const insightBox = document.getElementById('insight-box');

let categoryChart = null;
let dailyChart = null;

function generateUniqueExpenseId(existingIds = new Set()) {
  let id = Date.now();
  while (!Number.isFinite(id) || existingIds.has(id)) {
    id = Date.now() + Math.floor(Math.random() * 1000000);
  }
  existingIds.add(id);
  return id;
}

function getSafeExpenseId(rawId, existingIds = new Set()) {
  const rawIdString = rawId == null ? '' : String(rawId).trim();
  const parsedId = Number(rawIdString);
  if (rawIdString !== '' && Number.isFinite(parsedId) && parsedId > 0 && !existingIds.has(parsedId)) {
    existingIds.add(parsedId);
    return parsedId;
  }
  return generateUniqueExpenseId(existingIds);
}

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
const loadedIds = new Set();
expenses = expenses.map(e => ({
  ...e,
  id: getSafeExpenseId(e.id, loadedIds),
  category: e.category || 'Lainnya',
  date: e.date || ''
}));
let editExpenseId = null;

function saveExpenses() {
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

function getFilteredExpenses() {
  const q = (searchInput.value || '').trim().toLowerCase();
  const cat = filterCategoryInput.value || 'Semua';
  return expenses.filter(e => e.title.toLowerCase().includes(q) && (cat === 'Semua' || e.category === cat));
}

function renderExpenses() {
  const list = getFilteredExpenses();
  expenseList.innerHTML = '';
  if (list.length === 0) {
    expenseList.innerHTML = '<p class="empty-text">Belum ada pengeluaran yang cocok.</p>';
    return;
  }

  list.forEach(e => {
    const wrapper = document.createElement('div');
    wrapper.className = 'expense-wrapper';
    wrapper.innerHTML = `
      <div class="expense-item">
        <div class="expense-info">
          <p class="expense-title">${e.title}</p>
          <p class="expense-category" data-category="${e.category}">${e.category}</p>
          <p class="expense-date">${e.date || '-'}</p>
        </div>
        <p class="expense-amount">IDR ${Number(e.amount).toLocaleString('id-ID')}</p>
        <div class="expense-actions">
          <button class="btn-edit" data-id="${e.id}">Edit</button>
          <button class="btn-delete" data-id="${e.id}">Hapus</button>
        </div>
      </div>
    `;

    // if this item is being edited, append an inline edit box under it
    if (editExpenseId === e.id) {
      const editBox = document.createElement('div');
      editBox.className = 'edit-box';
      editBox.innerHTML = `
        <h3>Edit Pengeluaran</h3>
        <div class="form-group">
          <label>Nama Pengeluaran</label>
          <input id="edit-title-${e.id}" value="${e.title}" />
        </div>
        <div class="form-group">
          <label>Kategori</label>
          <select id="edit-category-${e.id}">
            <option value="Makanan" ${e.category==='Makanan'?'selected':''}>Makanan</option>
            <option value="Transport" ${e.category==='Transport'?'selected':''}>Transport</option>
            <option value="Belanja" ${e.category==='Belanja'?'selected':''}>Belanja</option>
            <option value="Tagihan" ${e.category==='Tagihan'?'selected':''}>Tagihan</option>
            <option value="Hiburan" ${e.category==='Hiburan'?'selected':''}>Hiburan</option>
            <option value="Kesehatan" ${e.category==='Kesehatan'?'selected':''}>Kesehatan</option>
            <option value="Pendidikan" ${e.category==='Pendidikan'?'selected':''}>Pendidikan</option>
            <option value="Lainnya" ${e.category==='Lainnya'?'selected':''}>Lainnya</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nominal</label>
          <input id="edit-amount-${e.id}" type="number" value="${e.amount}" />
        </div>
        <div class="form-group">
          <label>Tanggal</label>
          <input id="edit-date-${e.id}" type="date" value="${e.date}" />
        </div>
        <div class="edit-actions">
          <button type="button" class="btn-save" id="save-edit-${e.id}">Simpan</button>
          <button type="button" class="btn-cancel" id="cancel-edit-${e.id}">Batal</button>
        </div>
      `;

      wrapper.appendChild(editBox);
    }

    expenseList.appendChild(wrapper);
  });

  // attach event listeners to dynamic buttons
}

// Save edit from inline popup
function saveEditPopup(id) {
  const title = document.getElementById(`edit-title-${id}`).value.trim();
  const category = document.getElementById(`edit-category-${id}`).value;
  const amount = Number(document.getElementById(`edit-amount-${id}`).value);
  const date = document.getElementById(`edit-date-${id}`).value;
  if (!title || !category || amount <= 0 || !date) { alert('Semua input edit harus diisi dengan benar.'); return; }
  expenses = expenses.map(e => e.id === id ? { ...e, title, category, amount, date } : e);
  saveExpenses();
  editExpenseId = null;
  renderExpenses();
  updateTotal();
  refreshAnalyticsUI();
}

function cancelEditPopup() {
  editExpenseId = null;
  renderExpenses();
}

function updateTotal() {
  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  totalElement.textContent = `IDR ${total.toLocaleString('id-ID')}`;
}

function startEdit(id) {
  // open inline edit popup under the item
  editExpenseId = id;
  renderExpenses();
}

function cancelEdit() {
  editExpenseId = null;
  expenseForm.reset();
  message.textContent = '';
}

function updateExpenseFromForm(id) {
  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const amount = Number(amountInput.value);
  const date = dateInput.value;
  if (!title || !category || amount <= 0 || !date) { alert('Semua input harus diisi dengan benar.'); return false; }
  expenses = expenses.map(e => e.id === id ? { ...e, title, category, amount, date } : e);
  saveExpenses();
  return true;
}

function deleteExpense(id) {
  if (!confirm('Hapus pengeluaran ini?')) return;
  expenses = expenses.filter(e => e.id !== id);
  if (editExpenseId === id) editExpenseId = null;
  saveExpenses();
  renderExpenses();
  updateTotal();
  refreshAnalyticsUI();
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function getSelectedMonthKey() {
  return monthPickerInput.value || getCurrentMonthKey();
}

function getSelectedMonthExpenses() {
  const key = getSelectedMonthKey();
  return expenses.filter(e => e.date && e.date.startsWith(key));
}

function getMonthlySummary() {
  const list = getSelectedMonthExpenses();
  const total = list.reduce((s, e) => s + Number(e.amount || 0), 0);
  const count = list.length;
  const categoryTotals = {};
  let highest = null;
  list.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category]||0) + Number(e.amount||0); if (!highest || Number(e.amount) > Number(highest.amount)) highest = e; });
  let topCategory = '-';
  let topCategoryAmount = 0;
  for (const k in categoryTotals) { if (categoryTotals[k] > topCategoryAmount) { topCategory = k; topCategoryAmount = categoryTotals[k]; } }
  return { total, count, topCategory, topCategoryAmount, highestExpense: highest };
}

function renderCategoryBreakdown() {
  const breakdown = getSelectedMonthExpenses().reduce((acc, e) => { acc[e.category] = (acc[e.category]||0) + Number(e.amount||0); return acc; }, {});
  const entries = Object.keys(breakdown).map(k => ({ category: k, amount: breakdown[k] })).sort((a,b) => b.amount - a.amount);
  if (entries.length === 0) { categoryBreakdownListElement.innerHTML = '<p class="empty-text">Belum ada data di bulan ini.</p>'; return; }
  const total = entries.reduce((s,i) => s + i.amount, 0);
  categoryBreakdownListElement.innerHTML = entries.map(item => {
    const pct = total > 0 ? Math.round(item.amount / total * 100) : 0;
    return `
      <div class="breakdown-item">
        <div class="breakdown-top">
          <div class="breakdown-meta">
            <span class="breakdown-name">${item.category}</span>
            <span class="breakdown-percent">${pct}%</span>
          </div>
          <strong class="breakdown-amount">IDR ${item.amount.toLocaleString('id-ID')}</strong>
        </div>
        <div class="breakdown-bar"><div class="breakdown-fill" style="width:${Math.min(pct,100)}%"></div></div>
      </div>`;
  }).join('');
}

function renderCategoryChart() {
  const dataMap = getSelectedMonthExpenses().reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+Number(e.amount||0); return acc; },{});
  const labels = Object.keys(dataMap);
  const data = labels.map(l=>dataMap[l]);
  const colorsMap = {
    'Makanan':'#38bdf8','Transport':'#0ea5e9','Belanja':'#818cf8','Tagihan':'#fb7185','Hiburan':'#f472b6','Kesehatan':'#34d399','Pendidikan':'#f59e0b','Lainnya':'#94a3b8'
  };
  const bg = labels.map(l=>colorsMap[l]||'#60a5fa');

  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;
  if (!categoryChart) {
    categoryChart = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: { labels: labels, datasets: [{ data: data, backgroundColor: bg, borderColor: '#f8fafc', borderWidth: 4, hoverOffset: 20 }] },
      options: {
        responsive: true,
        cutout: '45%',
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            callbacks: {
              label: context => `${context.label}: IDR ${Number(context.parsed).toLocaleString('id-ID')}`
            }
          }
        }
      }
    });
  } else {
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.data.datasets[0].backgroundColor = bg;
    categoryChart.update();
  }
}

function renderDailyChart() {
  const list = getSelectedMonthExpenses();
  if (!list) return;
  const byDay = {};
  list.forEach(e=>{ if (!e.date) return; const day = e.date.slice(-2); byDay[day] = (byDay[day]||0)+Number(e.amount||0); });
  const labels = Object.keys(byDay).sort((a,b)=>Number(a)-Number(b));
  const data = labels.map(d=>byDay[d]);

  const ctx = document.getElementById('dailyChart');
  if (!ctx) return;
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, ctx.height);
  gradient.addColorStop(0, 'rgba(14, 165, 233, 0.28)');
  gradient.addColorStop(1, 'rgba(56, 189, 248, 0.04)');

  if (!dailyChart) {
    dailyChart = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Pengeluaran per Hari',
          data: data,
          borderColor: '#0ea5e9',
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#0ea5e9',
          pointBorderWidth: 3,
          pointHoverRadius: 7,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 900, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            title: { display: true, text: 'Hari', color: '#475569' },
            ticks: { color: '#475569' },
            grid: { color: 'rgba(148, 163, 184, 0.18)' }
          },
          y: {
            title: { display: true, text: 'IDR', color: '#475569' },
            beginAtZero: true,
            ticks: { color: '#475569', callback: value => value >= 1000 ? `IDR ${value.toLocaleString('id-ID')}` : `IDR ${value}` },
            grid: { color: 'rgba(148, 163, 184, 0.18)' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            callbacks: {
              label: context => `IDR ${Number(context.parsed.y).toLocaleString('id-ID')}`
            }
          }
        }
      }
    });
  } else {
    dailyChart.data.labels = labels;
    dailyChart.data.datasets[0].data = data;
    dailyChart.update();
  }
}

function updateDashboard() {
  const key = getSelectedMonthKey();
  dashboardPeriodElement.textContent = key ? new Date(key + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-';
  const s = getMonthlySummary();
  dashboardTotalElement.textContent = `IDR ${s.total.toLocaleString('id-ID')}`;
  dashboardCountElement.textContent = s.count;
  dashboardTopCategoryElement.textContent = s.topCategory || '-';
  dashboardTopCategoryAmountElement.textContent = s.topCategoryAmount?`IDR ${s.topCategoryAmount.toLocaleString('id-ID')}`:'-';
  if (s.highestExpense) {
    dashboardHighestExpenseElement.textContent = s.highestExpense.title;
    dashboardHighestExpenseAmountElement.textContent = `IDR ${s.highestExpense.amount.toLocaleString('id-ID')}`;
  } else {
    dashboardHighestExpenseElement.textContent = '-';
    dashboardHighestExpenseAmountElement.textContent = '-';
  }
}

function generateSmartInsight() {
  const currentTotal = getMonthlySummary().total;
  const key = getSelectedMonthKey();
  // compute previous month key
  const parts = key.split('-');
  let year = Number(parts[0]); let month = Number(parts[1]);
  month -= 1; if (month < 1) { month = 12; year -= 1; }
  const prevKey = `${year}-${String(month).padStart(2,'0')}`;
  const prevTotal = expenses.filter(e=>e.date && e.date.startsWith(prevKey)).reduce((s,e)=>s+Number(e.amount||0),0);
  let insight = '';
  if (prevTotal === 0 && currentTotal === 0) insight = 'Belum ada data untuk dua bulan terakhir.';
  else if (prevTotal === 0) insight = `Pengeluaran bulan ini IDR ${currentTotal.toLocaleString('id-ID')}. Tidak ada data bulan sebelumnya untuk perbandingan.`;
  else {
    const change = ((currentTotal - prevTotal) / prevTotal) * 100;
    const upDown = change >= 0 ? 'naik' : 'turun';
    insight = `Total pengeluaran ${upDown} ${Math.abs(Math.round(change))}% dibanding bulan sebelumnya.`;
  }
  // suggest top category advice
  const ms = getMonthlySummary();
  if (ms.topCategory && ms.topCategory !== '-' ) {
    insight += ` Kategori terbesar: ${ms.topCategory} (IDR ${ms.topCategoryAmount.toLocaleString('id-ID')}).`;
  }
  insightBox.textContent = insight;
}

function refreshAnalyticsUI() {
  renderCategoryBreakdown();
  renderCategoryChart();
  renderDailyChart();
  updateDashboard();
  generateSmartInsight();
}

function exportJSON() {
  const dataStr = JSON.stringify(expenses, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'expenses-backup.json'; a.click(); URL.revokeObjectURL(url);
}

function exportCSV() {
  if (!expenses.length) { alert('Tidak ada data untuk diekspor.'); return; }
  const header = ['id', 'title', 'category', 'amount', 'date'];
  const rows = expenses.map(e => [
    String(e.id),
    csvEscape(e.title),
    csvEscape(e.category),
    String(e.amount),
    String(e.date)
  ]);
  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expenses-backup.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value || '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    const item = {};
    header.forEach((key, index) => {
      item[key] = values[index] !== undefined ? values[index].trim() : '';
    });
    return item;
  });
}

function importData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result.trim();
      let data;
      const name = file.name.toLowerCase();
      if (name.endsWith('.csv') || file.type.includes('csv')) {
        data = parseCSV(content);
      } else {
        data = JSON.parse(content);
      }
      if (!Array.isArray(data)) throw new Error('Format file harus array data');
      const importedIds = new Set(expenses.map(e => e.id));
      const items = data.map(item => {
        const rawId = item.id || item.ID || item.Id || item.idExpense;
        const id = getSafeExpenseId(rawId, importedIds);
        const title = (item.title || item.nama || '').toString().trim();
        const category = item.category || item.kategori || 'Lainnya';
        const amountValue = item.amount || item.nominal || 0;
        const amount = Number(String(amountValue).replace(/[^0-9\-\.]/g, '')) || 0;
        const date = item.date || item.tanggal || '';
        return { id, title, category, amount, date };
      }).filter(i => i.title && i.amount > 0 && i.date);
      if (items.length === 0) { alert('Tidak ada data valid yang bisa diimport'); return; }
      const old = expenses.length;
      expenses = [...expenses, ...items];
      saveExpenses(); renderExpenses(); updateTotal(); refreshAnalyticsUI();
      alert(`Import berhasil!\nData baru: ${items.length}\nTotal sekarang: ${expenses.length}\nData lama: ${old}`);
    } catch (err) {
      alert('Import gagal: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function setupUiHandlers() {
  expenseForm.addEventListener('submit', function(evt) {
    evt.preventDefault();
    const title = titleInput.value.trim();
    const category = categoryInput.value;
    const amount = Number(amountInput.value);
    const date = dateInput.value;
    if (!title || !category || amount <= 0 || !date) { message.textContent = 'Semua input harus diisi dengan benar.'; return; }

    if (editExpenseId) {
      const ok = updateExpenseFromForm(editExpenseId);
      if (ok) { editExpenseId = null; expenseForm.reset(); message.textContent = 'Perubahan disimpan.'; renderExpenses(); updateTotal(); refreshAnalyticsUI(); }
      return;
    }

    const newExpense = { id: Date.now(), title, category, amount, date };
    expenses.push(newExpense);
    saveExpenses(); renderExpenses(); updateTotal(); refreshAnalyticsUI();
    expenseForm.reset(); message.textContent = 'Pengeluaran berhasil ditambahkan.';

    if(typeof toggleModal === 'function') toggleModal('addModal'); 
  });

  expenseList.addEventListener('click', function (ev) {
    const target = ev.target;
    const editBtn = target.closest('.btn-edit');
    const deleteBtn = target.closest('.btn-delete');
    const saveBtn = target.closest('.btn-save');
    const cancelBtn = target.closest('.btn-cancel');
    if (editBtn) {
      startEdit(Number(editBtn.dataset.id));
      return;
    }
    if (deleteBtn) {
      deleteExpense(Number(deleteBtn.dataset.id));
      return;
    }
    if (saveBtn) {
      ev.preventDefault();
      const id = Number(saveBtn.id.replace('save-edit-',''));
      saveEditPopup(id);
      return;
    }
    if (cancelBtn) {
      ev.preventDefault();
      cancelEditPopup();
      return;
    }
  });

  searchInput.addEventListener('input', debounce(() => renderExpenses(), 300));
  filterCategoryInput.addEventListener('change', () => renderExpenses());
  monthPickerInput.value = getCurrentMonthKey();
  monthPickerInput.addEventListener('change', () => refreshAnalyticsUI());

  window.startEdit = startEdit;
  window.deleteExpense = deleteExpense;
  window.exportJSON = exportJSON;
  window.exportCSV = exportCSV;
  window.importData = importData;

  renderExpenses();
  updateTotal();
  refreshAnalyticsUI();

  applyChartLayout();
}

setupUiHandlers();

function applyChartLayout() {
  const cat = document.getElementById('categoryChart');
  const daily = document.getElementById('dailyChart');
  if (!cat || !daily) return;
  const catCard = cat.closest('.card');
  const dailyCard = daily.closest('.card');
  if (catCard) catCard.classList.add('chart-card');
  if (dailyCard) {
    dailyCard.classList.add('chart-card');
    dailyCard.classList.add('right');
  }
  // ensure daily card is placed immediately after category card for side-by-side layout
  try {
    if (catCard && dailyCard && catCard.parentNode) {
      catCard.parentNode.insertBefore(dailyCard, catCard.nextSibling);
    }
  } catch (err) {
    // ignore reordering errors
  }
}

applyChartLayout();
