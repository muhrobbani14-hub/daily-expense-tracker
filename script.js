const expenseForm = document.getElementById("expense-form");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const searchInput = document.getElementById("search");
const filterCategoryInput = document.getElementById("filter-category");
const message = document.getElementById("message");
const totalElement = document.getElementById("total");
const expenseList = document.getElementById("expense-list");
const monthlyPeriodElement = document.getElementById("monthly-period");
const monthlyTotalElement = document.getElementById("monthly-total");
const monthlyCountElement = document.getElementById("monthly-count");
const topCategoryElement = document.getElementById("top-category");
const topCategoryAmountElement = document.getElementById("top-category-amount");
const highestExpenseElement = document.getElementById("highest-expense");
const highestExpenseAmountElement = document.getElementById("highest-expense-amount");
const monthPickerInput = document.getElementById("month-picker");
const dashboardPeriodElement = document.getElementById("dashboard-period");
const dashboardTotalElement = document.getElementById("dashboard-total");
const dashboardCountElement = document.getElementById("dashboard-count");
const dashboardTopCategoryElement = document.getElementById("dashboard-top-category");
const dashboardTopCategoryAmountElement = document.getElementById("dashboard-top-category-amount");
const dashboardHighestExpenseElement = document.getElementById("dashboard-highest-expense");
const dashboardHighestExpenseAmountElement = document.getElementById("dashboard-highest-expense-amount");
const categoryBreakdownListElement = document.getElementById("category-breakdown-list");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
expenses = expenses.map(function (expense) {
  return {
    ...expense,
    category: expense.category || "Lainnya",
    date: expense.date || ""
  };
});

let editExpenseId = null;
let categoryChart = null;

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function getFilteredExpenses() {
  const searchKeyword = searchInput.value.trim().toLowerCase();
  const selectedCategory = filterCategoryInput.value;
  
  return expenses.filter(function (expense) {
    const matchTitle = expense.title.toLowerCase().includes(searchKeyword);
    const matchCategory =
      selectedCategory === "Semua" || expense.category === selectedCategory;
    
    return matchTitle && matchCategory
  });
}

function renderExpenses() {
  expenseList.innerHTML = "";

  const filteredExpenses = getFilteredExpenses();

  if (filteredExpenses.length === 0) {
    expenseList.innerHTML = `<p class="empty-text">Belum ada pengeluaran yang cocok.</p>`;
    return;
  }

  filteredExpenses.forEach(function (expense) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("expense-wrapper");
    wrapper.innerHTML = `
      <div class="expense-item">
        <div class="expense-info">
          <p class="expense-title">${expense.title}</p>
          <p class="expense-category" data-category="${expense.category}">${expense.category}</p>
          <p class="expense-date">${expense.date || "-"}</p>
        </div>
        <p class="expense-amount">IDR ${expense.amount.toLocaleString("id-ID")}</p>
        <div class="expense-actions">
          <button class="btn-edit" onclick="startEdit(${expense.id})">Edit</button>
          <button class="btn-delete" onclick="deleteExpense(${expense.id})">Hapus</button>
        </div>
      </div>
    `;

    if (editExpenseId === expense.id) {
      const editBox = document.createElement("div");
      editBox.classList.add("edit-box");
      editBox.innerHTML = `
        <h3>Edit Pengeluaran</h3>
        <div class="form-group">
          <label for="edit-title-${expense.id}">Nama Pengeluaran</label>
          <input type="text" id="edit-title-${expense.id}" value="${expense.title}" />
        </div>
        <div class="form-group">
          <label for="edit-category-${expense.id}">Kategori</label>
          <select id="edit-category-${expense.id}">
            <option value="">Pilih kategori</option>
            <option value="Makanan" ${expense.category === "Makanan" ? "selected" : ""}>Makanan</option>
            <option value="Transport" ${expense.category === "Transport" ? "selected" : ""}>Transport</option>
            <option value="Belanja" ${expense.category === "Belanja" ? "selected" : ""}>Belanja</option>
            <option value="Tagihan" ${expense.category === "Tagihan" ? "selected" : ""}>Tagihan</option>
            <option value="Hiburan" ${expense.category === "Hiburan" ? "selected" : ""}>Hiburan</option>
            <option value="Kesehatan" ${expense.category === "Kesehatan" ? "selected" : ""}>Kesehatan</option>
            <option value="Lainnya" ${expense.category === "Lainnya" ? "selected" : ""}>Lainnya</option>
          </select>
        </div>
        <div class="form-group">
          <label for="edit-amount-${expense.id}">Nominal</label>
          <input type="number" id="edit-amount-${expense.id}" value="${expense.amount}" />
        </div>
        <div class="form-group">
          <label for="edit-date-${expense.id}">Tanggal</label>
          <input type="date" id="edit-date-${expense.id}" value="${expense.date}" />
        </div>
        <div class="edit-actions">
          <button class="btn-save" onclick="updateExpense(${expense.id})">Simpan</button>
          <button class="btn-cancel" onclick="cancelEdit()">Batal</button>
        </div>
      `;
      wrapper.appendChild(editBox);
    }

    expenseList.appendChild(wrapper);
  });
}

function updateTotal() {
  let total = 0;
  expenses.forEach(function (expense) {
    total += expense.amount;
  });
  totalElement.textContent = `IDR ${total.toLocaleString("id-ID")}`;
}

function startEdit(id) {
  editExpenseId = id;
  renderExpenses();
}

function cancelEdit() {
  editExpenseId = null;
  renderExpenses();
}

function updateExpense(id) {
  const titleField = document.getElementById(`edit-title-${id}`);
  const categoryField = document.getElementById(`edit-category-${id}`);
  const amountField = document.getElementById(`edit-amount-${id}`);
  const dateField = document.getElementById(`edit-date-${id}`);

  const title = titleField.value.trim();
  const category = categoryField.value;
  const amount = Number(amountField.value);
  const date = dateField.value;

  if (title === "" || category === "" || amount <= 0 || date === "") {
    alert("Semua input edit harus diisi dengan benar.");
    return;
  }

  expenses = expenses.map(function (expense) {
    if (expense.id === id) {
      return {
        ...expense,
        title: title,
        category: category,
        amount: amount,
        date: date
      };
    }
    return expense;
  });

  saveExpenses();
  editExpenseId = null;
  renderExpenses();
  updateTotal();
  refreshAnalyticsUI();
}

function deleteExpense(id) {
  expenses = expenses.filter(function (expense) {
    return expense.id !== id;
  });

  if (editExpenseId === id) {
    editExpenseId = null;
  }

  saveExpenses();
  renderExpenses();
  updateTotal();
  refreshAnalyticsUI();
}

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getSelectedMonthKey() {
  return monthPickerInput.value || getCurrentMonthKey();
}

function getMonthLabel(monthKey) {
  if (!monthKey) {
    return "-";
  }

  const parts = monthKey.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;

  const date = new Date(year, month);

  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric"
  });
}

function getSelectedMonthExpenses() {
  const selectedMonthKey = getSelectedMonthKey();

  return expenses.filter(function (expense) {
    return expense.date && expense.date.startsWith(selectedMonthKey);
  });
}

function getMonthlySummary() {
  const monthlyExpenses = getSelectedMonthExpenses();
  let total = 0;
  let highestExpense = null;
  const categoryTotals = {};

  monthlyExpenses.forEach(function (expense) {
    total += expense.amount;

    if (!highestExpense || expense.amount > highestExpense.amount) {
      highestExpense = expense;
    }

    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }

    categoryTotals[expense.category] += expense.amount;
  });

  let topCategory = "-";
  let topCategoryAmount = 0;

  for (const category in categoryTotals) {
    if (categoryTotals[category] > topCategoryAmount) {
      topCategory = category;
      topCategoryAmount = categoryTotals[category];
    }
  }

  return {
    total: total,
    count: monthlyExpenses.length,
    topCategory: topCategory,
    topCategoryAmount: topCategoryAmount,
    highestExpense: highestExpense
  };
}

function getCategoryBreakdownByMonth() {
  const selectedMonthExpenses = getSelectedMonthExpenses();
  const categoryTotals = {};

  selectedMonthExpenses.forEach(function (expense) {
    const category = expense.category || "Lainnya";

    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }

    categoryTotals[category] += expense.amount;
  });

  return Object.keys(categoryTotals)
    .map(function (category) {
      return {
        category: category,
        amount: categoryTotals[category]
      };
    })
    .sort(function (a, b) {
      return b.amount - a.amount;
    });
}

function updateMonthlySummary() {
  const selectedMonthKey = getSelectedMonthKey();
  const summary = getMonthlySummary();

  monthlyPeriodElement.textContent = getMonthLabel(selectedMonthKey);
  monthlyTotalElement.textContent = `IDR ${summary.total.toLocaleString("id-ID")}`;
  monthlyCountElement.textContent = summary.count;

  if (summary.topCategory === "-") {
    topCategoryElement.textContent = "-";
    topCategoryAmountElement.textContent = "Belum ada data di bulan ini";
  } else {
    topCategoryElement.textContent = summary.topCategory;
    topCategoryAmountElement.textContent = `IDR ${summary.topCategoryAmount.toLocaleString("id-ID")}`;
  }

  if (summary.highestExpense) {
    highestExpenseElement.textContent = summary.highestExpense.title;
    highestExpenseAmountElement.textContent = `IDR ${summary.highestExpense.amount.toLocaleString("id-ID")}`;
  } else {
    highestExpenseElement.textContent = "-";
    highestExpenseAmountElement.textContent = "Belum ada data di bulan ini";
  }
}

function renderDashboardVisual() {
  const selectedMonthKey = getSelectedMonthKey();
  const summary = getMonthlySummary();

  dashboardPeriodElement.textContent = getMonthLabel(selectedMonthKey);
  animateValue(dashboardTotalElement, 0, summary.total, 600);
  dashboardCountElement.textContent = `${summary.count} transaksi`;

  if (summary.topCategory === "-") {
    dashboardTopCategoryElement.textContent = "-";
    dashboardTopCategoryAmountElement.textContent = "Belum ada data di bulan ini";
  } else {
    dashboardTopCategoryElement.textContent = summary.topCategory;
    dashboardTopCategoryAmountElement.textContent = `IDR ${summary.topCategoryAmount.toLocaleString("id-ID")}`;
  }

  if (summary.highestExpense) {
    dashboardHighestExpenseElement.textContent = summary.highestExpense.title;
    dashboardHighestExpenseAmountElement.textContent = `IDR ${summary.highestExpense.amount.toLocaleString("id-ID")}`;
  } else {
    dashboardHighestExpenseElement.textContent = "-";
    dashboardHighestExpenseAmountElement.textContent = "Belum ada data di bulan ini";
  }
}

function renderCategoryBreakdown() {
  const breakdown = getCategoryBreakdownByMonth();

  if (breakdown.length === 0) {
    categoryBreakdownListElement.innerHTML = `<p class="empty-text">Belum ada data di bulan ini.</p>`;
    return;
  }

  let totalMonthlyAmount = 0;

  breakdown.forEach(function (item) {
    totalMonthlyAmount += item.amount;
  });

  categoryBreakdownListElement.innerHTML = breakdown
    .map(function (item) {
      const percent = totalMonthlyAmount > 0
        ? (item.amount / totalMonthlyAmount) * 100
        : 0;

      return `
        <div class="breakdown-item">
          <div class="breakdown-top">
            <div class="breakdown-meta">
              <span class="breakdown-name">${item.category}</span>
              <span class="breakdown-percent">${percent.toFixed(0)}%</span>
            </div>
            <strong class="breakdown-amount">IDR ${item.amount.toLocaleString("id-ID")}</strong>
          </div>

          <div class="breakdown-bar">
            <div class="breakdown-fill" style="width: ${Math.min(percent, 100)}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCategoryChart() {
  const breakdown = getCategoryBreakdownByMonth();

  const labels = breakdown.map(item => item.category);
  const data = breakdown.map(item => item.amount);

  const ctx = document.getElementById("categoryChart");

  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#2563eb",
            "#16a34a",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#06b6d4",
            "#64748b"
          ]
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderInsights() {
  const summary = getMonthlySummary();

  let insightText = "";

  if (summary.count === 0) {
    insightText = "Belum ada data pengeluaran bulan ini.";
  } else {
    insightText = `Pengeluaran terbesar kamu adalah ${summary.topCategory}.`;

    if (summary.total > 3000000) {
      insightText += " Pengeluaran kamu cukup tinggi bulan ini.";
    } else if (summary.total < 1000000) {
      insightText += " Pengeluaran kamu cukup hemat bulan ini.";
    }
  }

  const el = document.getElementById("insight-box");
  if (el) el.textContent = insightText;
}

function animateValue(element, start, end, duration) {
  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;

    const progress = Math.min((timestamp - startTimestamp) / duration, 1);

    const value = Math.floor(progress * (end - start) + start);

    element.textContent = "IDR " + value.toLocaleString("id-ID");

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

let dailyChart = null;

function renderDailyChart() {
  const monthlyExpenses = getSelectedMonthExpenses();

  const dailyMap = {};

  monthlyExpenses.forEach(exp => {
    const day = exp.date;
    if (!dailyMap[day]) dailyMap[day] = 0;
    dailyMap[day] += exp.amount;
  });

  const labels = Object.keys(dailyMap).sort();
  const data = labels.map(date => dailyMap[date]);

  const ctx = document.getElementById("dailyChart");

  if (dailyChart) dailyChart.destroy();

  dailyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Pengeluaran Harian",
        data,
        backgroundColor: "#2563eb"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function refreshAnalyticsUI() {
  updateMonthlySummary();
  renderDashboardVisual();
  renderCategoryBreakdown();
  renderCategoryChart();
  renderInsights();
  renderDailyChart();
}                               

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function exportJSON() {
  const dataStr = JSON.stringify(expenses, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "expenses-backup.json";
  a.click();

  URL.revokeObjectURL(url);
}

function exportCSV() {
  const header = ["Title", "Category", "Amount", "Date"];

  const rows = expenses.map(exp => [
    exp.title,
    exp.category,
    exp.amount,
    exp.date
  ]);

  const csvContent =
    [header, ...rows]
      .map(e => e.join(","))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "expenses.csv";
  a.click();

  URL.revokeObjectURL(url);
}

let budgetLimit = 0;

function setBudget(value) {
  budgetLimit = Number(value);
  localStorage.setItem("budget", budgetLimit);
}

function checkBudgetWarning() {
  if (!budgetLimit) return;

  const summary = getMonthlySummary();

  if (summary.total > budgetLimit) {
    alert("⚠️ Kamu sudah melebihi budget bulan ini!");
  }
}

expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const amount = Number(amountInput.value);
  const date = dateInput.value;

  if (title === "" || category === "" || amount <= 0 || date === "") {
    message.textContent = "Semua input harus diisi dengan benar.";
    return;
  }

  const newExpense = {
    id: Date.now(),
    title: title,
    category: category,
    amount: amount,
    date: date
  };

  expenses.push(newExpense);
  saveExpenses();
  renderExpenses();
  updateTotal();
  refreshAnalyticsUI();
  expenseForm.reset();
  message.textContent = "Pengeluaran berhasil ditambahkan.";
});

searchInput.addEventListener(
    "input", 
    debounce(() => {
      renderExpenses();
    }, 300)
);

filterCategoryInput.addEventListener("change", function () {
  renderExpenses();
});

monthPickerInput.value = getCurrentMonthKey();

searchInput.addEventListener("input", function () {
  renderExpenses();
});

filterCategoryInput.addEventListener("change", function () {
  renderExpenses();
});

monthPickerInput.addEventListener("change", function () {
  refreshAnalyticsUI();
});

renderExpenses();
updateTotal();
refreshAnalyticsUI();
