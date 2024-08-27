const AIRTABLE_API_KEY = 'patW28N1vk3PMEx2e.ceacd8bfc64893c71afceb078203368796fac22b8bf60b378ac0969c06111d9f';
const AIRTABLE_BASE_ID = 'appcREab7g9h3Fsvi';
const AIRTABLE_TABLE_NAME = 'expenses'; 
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
const AIRTABLE_FIELDS = {
    id: 'id',
    description: 'description',
    amount: 'amount',
    date: 'date',
    month: 'month'
};

document.addEventListener('DOMContentLoaded', async () => {
    const expenseForm = document.getElementById('expense-form');
    const expenseDescription = document.getElementById('expense-description');
    const expenseAmount = document.getElementById('expense-amount');
    const expenseList = document.getElementById('expense-list');
    const totalAmount = document.getElementById('total-amount');
    const monthSelect = document.getElementById('month-select');

    let expenses = [];
    let total = 0;
    let editingIndex = -1; // To track the currently editing expense

    await fetchExpenses();

    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const description = expenseDescription.value.trim();
        const amount = parseFloat(expenseAmount.value);

        if (description && !isNaN(amount) && amount > 0) {
            if (editingIndex === -1) {
                await addExpense(description, amount);
            } else {
                await editExpense(description, amount, editingIndex);
            }
            expenseDescription.value = '';
            expenseAmount.value = '';
            editingIndex = -1; // Reset the editing index
        }
    });

    monthSelect.addEventListener('change', () => {
        filterExpensesByMonth(monthSelect.value);
    });

    async function fetchExpenses() {
        try {
            const response = await fetch(AIRTABLE_API_URL, {
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`
                }
            });
            const data = await response.json();
            expenses = data.records.map(record => ({
                id: record.id,
                description: record.fields[AIRTABLE_FIELDS.description],
                amount: record.fields[AIRTABLE_FIELDS.amount],
                date: record.fields[AIRTABLE_FIELDS.date],
                month: record.fields[AIRTABLE_FIELDS.month]
            }));

            expenses.forEach((expense, index) => {
                addExpenseToList(expense.description, expense.amount, expense.date, index);
                total += expense.amount;
            });

            updateTotal();
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    }

    async function addExpense(description, amount) {
        const date = new Date();
        const formattedDate = date.toLocaleDateString('en-GB');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        try {
            const response = await fetch(AIRTABLE_API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        [AIRTABLE_FIELDS.description]: description,
                        [AIRTABLE_FIELDS.amount]: amount,
                        [AIRTABLE_FIELDS.date]: formattedDate,
                        [AIRTABLE_FIELDS.month]: month
                    }
                })
            });

            const data = await response.json();

            expenses.push({
                id: data.id,
                description,
                amount,
                date: formattedDate,
                month
            });

            addExpenseToList(description, amount, formattedDate, expenses.length - 1);
            total += amount;
            updateTotal();
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    }

    async function editExpense(description, amount, index) {
        const date = expenses[index].date;
        const month = expenses[index].month;
        const recordId = expenses[index].id;

        try {
            const response = await fetch(`${AIRTABLE_API_URL}/${recordId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        [AIRTABLE_FIELDS.description]: description,
                        [AIRTABLE_FIELDS.amount]: amount,
                        [AIRTABLE_FIELDS.date]: date,
                        [AIRTABLE_FIELDS.month]: month
                    }
                })
            });

            if (response.ok) {
                expenses[index].description = description;
                expenses[index].amount = amount;
                updateExpenseInList(description, amount, date, index);
                recalculateTotal();
            } else {
                console.error('Error editing expense:', await response.json());
            }
        } catch (error) {
            console.error('Error editing expense:', error);
        }
    }

    async function removeExpense(index) {
        try {
            const recordId = expenses[index].id;

            await fetch(`${AIRTABLE_API_URL}/${recordId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`
                }
            });

            total -= expenses[index].amount;
            expenses.splice(index, 1);
            expenseList.children[index].remove();

            updateTotal();
        } catch (error) {
            console.error('Error removing expense:', error);
        }
    }

    function addExpenseToList(description, amount, date, index) {
        const li = document.createElement('li');
        li.innerHTML = `${date} - ${description} - Rs ${amount.toFixed(2)} <button onclick="editExpenseButton(${index})">Edit</button> <button onclick="removeExpense(${index})">Remove</button>`;
        expenseList.appendChild(li);
    }

    function updateExpenseInList(description, amount, date, index) {
        const li = expenseList.children[index];
        li.innerHTML = `${date} - ${description} - Rs ${amount.toFixed(2)} <button onclick="editExpenseButton(${index})">Edit</button> <button onclick="removeExpense(${index})">Remove</button>`;
    }

    function updateTotal() {
        totalAmount.textContent = total.toFixed(2);
    }

    function filterExpensesByMonth(month) {
        expenseList.innerHTML = '';
        const filteredExpenses = month === 'all'
            ? expenses
            : expenses.filter(expense => expense.month === month);

        filteredExpenses.forEach((expense, index) => {
            addExpenseToList(expense.description, expense.amount, expense.date, index);
        });

        total = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
        updateTotal();
    }

    function editExpenseButton(index) {
        const expense = expenses[index];
        expenseDescription.value = expense.description;
        expenseAmount.value = expense.amount;
        editingIndex = index;
    }

    function recalculateTotal() {
        total = expenses.reduce((acc, expense) => acc + expense.amount, 0);
        updateTotal();
    }

    window.removeExpense = removeExpense;
    window.editExpenseButton = editExpenseButton;
});
