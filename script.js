document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expenseDescription = document.getElementById('expense-description');
    const expenseAmount = document.getElementById('expense-amount');
    const expenseList = document.getElementById('expense-list');
    const totalAmount = document.getElementById('total-amount');
    const monthSelect = document.getElementById('month-select');

    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let total = expenses.reduce((acc, expense) => acc + expense.amount, 0);

    // Load existing expenses from localStorage
    expenses.forEach((expense, index) => {
        addExpenseToList(expense.description, expense.amount, expense.date, index);
    });

    updateTotal();

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const description = expenseDescription.value.trim();
        const amount = parseFloat(expenseAmount.value);

        if (description && !isNaN(amount) && amount > 0) {
            addExpense(description, amount);
            expenseDescription.value = '';
            expenseAmount.value = '';
        }
    });

    monthSelect.addEventListener('change', () => {
        filterExpensesByMonth(monthSelect.value);
    });

    function addExpense(description, amount) {
        const date = new Date();
        const formattedDate = date.toLocaleDateString(); // Format as YYYY-MM-DD or customize
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get month in MM format
        expenses.push({ description, amount, date: formattedDate, month });
        total += amount;

        localStorage.setItem('expenses', JSON.stringify(expenses)); // Save to localStorage

        addExpenseToList(description, amount, formattedDate, expenses.length - 1);
        updateTotal();
    }

    function addExpenseToList(description, amount, date, index) {
        const li = document.createElement('li');
        li.innerHTML = `${date} - ${description} - $${amount.toFixed(2)} <button onclick="removeExpense(${index})">Remove</button>`;
        expenseList.appendChild(li);
    }

    function removeExpense(index) {
        total -= expenses[index].amount;
        expenses.splice(index, 1);
        localStorage.setItem('expenses', JSON.stringify(expenses)); // Save updated expenses to localStorage
        expenseList.children[index].remove();

        // Update the list after removal
        Array.from(expenseList.children).forEach((li, i) => {
            const btn = li.querySelector('button');
            btn.setAttribute('onclick', `removeExpense(${i})`);
        });

        updateTotal();
    }

    function updateTotal() {
        totalAmount.textContent = total.toFixed(2);
    }

    function filterExpensesByMonth(month) {
        expenseList.innerHTML = ''; // Clear the current list
        const filteredExpenses = month === 'all'
            ? expenses
            : expenses.filter(expense => expense.month === month);

        filteredExpenses.forEach((expense, index) => {
            addExpenseToList(expense.description, expense.amount, expense.date, index);
        });

        // Recalculate total
        total = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
        updateTotal();
    }

    window.removeExpense = removeExpense; // Make removeExpense function accessible globally
});
