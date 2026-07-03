const expenseForm = document.getElementById("expense-form");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const amountInput = document.getElementById("amount");
const message = document.getElementById("message");
const totalElement = document.getElementById("total");
const expenseList = document.getElementById("expense-list");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
// Menyimpan data pengeluaran ke localStorage
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Render daftar pengeluaran
function renderExpenses() {
  expenseList.innerHTML = "";

  if (expenses.length === 0) {
    expenseList.innerHTML = `<p class="empty-text">Belum ada pengeluaran.</p>`;
    return;
  }

  expenses.forEach(function (expense) {
    const item = document.createElement("div");
    item.classList.add("expense-item");

    item.innerHTML = `
      <div class="expense-info">
        <p class="expense-title">${expense.title}</p>
        <p class="expense-category">${expense.category}</p>
      </div>
      <p class="expense-amount">IDR ${expense.amount.toLocaleString("id-ID")}</p>
      <button class="btn-delete" onclick="deleteExpense(${expense.id})">Hapus</button>
    `;

    expenseList.appendChild(item);
  });
}
// Update total pengeluaran
function updateTotal() {
  let total = 0;

  expenses.forEach(function (expense) {
    total += expense.amount;
  });

  totalElement.textContent = `IDR ${total}`;
}
// Hapus pengeluaran
function deleteExpense(id) {
  expenses = expenses.filter(function (expense) {
    return expense.id !== id;
  });
  
  saveExpenses();
  renderExpenses();
  updateTotal();
}

expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const amount = Number(amountInput.value);

  if (title === "" || category === "" || amount <= 0) {
    message.textContent = "Semua input harus diisi dengan benar.";
    return;
  }

  const newExpense = {
    id: Date.now(),
    title: title,
    category: category,
    amount: amount
  };

  expenses.push(newExpense);
  saveExpenses();

  renderExpenses();
  updateTotal();
  
  expenseForm.reset();
  message.textContent = "";
});
renderExpenses();
updateTotal();