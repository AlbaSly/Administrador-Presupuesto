const form = document.querySelector('#agregar-gasto');
const expensesList = document.querySelector('#gastos ul');

const budgetSpan = document.querySelector('#total');
const remainingBudgetDiv = document.querySelector('.restante');
const remainingBudgetSpan = document.querySelector('#restante');


let personalBudget;
class Budget {
    constructor(total, remaining = total, expenses = []) {
        this.total = Number(total);
        this.remaining = remaining;
        this.expenses = expenses;
    }

    addExpense(expense) {
        this.expenses = [expense, ...this.expenses];
        this.calcRemaining();
        console.log(this.expenses);
    }

    deleteExpense(deleteId) {
        this.expenses = this.expenses.filter(exp =>
            exp.id !== deleteId
        );
        this.calcRemaining();
        console.log(this.expenses);
    }

    calcRemaining() {
        const spent = this.expenses.reduce((total, expense) => total + expense.amount, 0);
        this.remaining = this.total - spent;
    }
}

class UI {
    loadBudgetUI(total, remaining) {
        budgetSpan.textContent = total;
        remainingBudgetSpan.textContent = remaining;
    }
    updateBudgetRemainingUI(remaining) {
        remainingBudgetSpan.textContent = remaining;
    }
    updateBudgetStatusUI(budgetObj) {
        remainingBudgetDiv.className = '';

        const {total, remaining} = budgetObj;
        const percentage = calculatePercentage(remaining, total);
        
        remainingBudgetDiv.classList.add('restante', 'alert');

        if (percentage > 50) {
            remainingBudgetDiv.classList.add('alert-success');
        } else if (percentage <= 25) {
            remainingBudgetDiv.classList.add('alert-danger');
        } else if (percentage <= 50) {
            remainingBudgetDiv.classList.add('alert-warning');
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (remaining <= 0) {
            this.showAlert('Presupuesto agotado', 0, true);
            submitBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
        }
    }
    showAlert(message, type, moreThanOne = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('text-center', 'alert');

        switch(type) {
            case 0:
                messageDiv.classList.add('alert-danger');
                break;
            case 1:
                messageDiv.classList.add('alert-success');
                break;
        }

        messageDiv.textContent = message;

        const primaryColumn = document.querySelector('.primario');

        if (primaryColumn.querySelectorAll('.alert').length === 0 || moreThanOne) {
            primaryColumn.insertBefore(messageDiv, form);
        }
        
        setTimeout(() => {
            messageDiv.remove();
        }, 1500);
    }
    updateExpensesList(expenses) {
        this.clearExpensesList();
        expenses.forEach( expense => {
            const {expenseName, amount, id} = expense;

            const expenseDiv = document.createElement('li');
            expenseDiv.className = 'list-group-item d-flex justify-content-between align-items-center';
            expenseDiv.dataset.id = id;

            expenseDiv.innerHTML = `
                ${expenseName}
                <span class="badge badge-primary badge-pill">$ ${amount} </span>
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('btn', 'btn-danger', 'borrar-gasto');
            deleteBtn.textContent = 'Borrar';
            deleteBtn.onclick = deleteExpense;
        
            expenseDiv.appendChild(deleteBtn);

            expensesList.appendChild(expenseDiv);
        });
    }

    clearExpensesList() {
        expensesList.innerHTML = null;
    }
}

const userInterface = new UI();

//This starts the app
document.addEventListener('DOMContentLoaded', runApp);

function runApp() {
    loadUIEventListeners();
    askBudget();
}

function loadUIEventListeners() {
    form.addEventListener('submit', addExpense);
    expensesList.addEventListener('click', deleteExpense);
}

function loadLocalStorage() {
    const {total, remaining, expenses} = JSON.parse(localStorage.getItem('budgetObj'));
    personalBudget = new Budget(total, remaining, expenses);

    globalUiUpdate();
}

function updateLocalStorage() {
    localStorage.setItem('budgetObj', JSON.stringify(personalBudget));
}

function askBudget() {
    if (checkPreviousSession()) {
        return;
    }
    let askMessage = '¿Cuál es tu presupuesto?';
    while (true) {
        const budget = Number(prompt(askMessage));
        if (validateNumber(budget)) {

            personalBudget = new Budget(budget);
            updateLocalStorage();
            globalUiUpdate();
            break;
        }
        askMessage = 'Entrada no válida, intenta de nuevo';
    }
}

function checkPreviousSession() {
    let loaded;
    if (localStorage.getItem('budgetObj')) {
        loaded = confirm('Se ha encontrado datos, ¿Desea cargarlos?');
        if (loaded) {
            loadLocalStorage();
        }
    }

    return loaded;
}

function validateNumber(value) {
    return !isNaN(value) && value > 0;
}

function calculatePercentage(partial, total) {
    return (partial * 100) / total;
}

function globalUiUpdate() {
    userInterface.loadBudgetUI(personalBudget.total, personalBudget.remaining);
    userInterface.updateBudgetStatusUI(personalBudget);
    userInterface.updateExpensesList(personalBudget.expenses);
}

function addExpense(ev) {
    ev.preventDefault();

    const expenseName = document.querySelector('#gasto').value.trim();
    const amount = Number(document.querySelector('#cantidad').value);

    if (!amount && !expenseName) {
        userInterface.showAlert('Ambos datos son obligatorios', 0);
        return;
    }

    if (!expenseName) {
        userInterface.showAlert('Nombre del gasto vacío', 0);
        return;
    }

    if (!validateNumber(amount)) {
        userInterface.showAlert('Cantidad no válida', 0);
        return;
    }

    const expense = {
        expenseName,
        amount,
        id: Date.now()
    };

    personalBudget.addExpense(expense);

    userInterface.showAlert('Gasto guardado correctamente', 1);

    //reset a form
    form.reset();

    globalUiUpdate();

    updateLocalStorage();
}

function deleteExpense(ev) {
    if (ev.target.classList.contains('borrar-gasto')) {
        const idSelected = Number(ev.target.parentElement.getAttribute('data-id'));
        personalBudget.deleteExpense(idSelected);
        
        globalUiUpdate();
    }

    updateLocalStorage();
}