import { Component, signal, computed, OnInit } from '@angular/core';
import { ExpenseFormComponent } from './components/expense-form.component';
import { ExpenseTableComponent } from './components/expense-table.component';
import { ExpenseService } from './services/expense.service';
import { Expense, ExpenseForm } from './models/expense.model';

@Component({
  selector: 'app-root',
  imports: [ExpenseFormComponent, ExpenseTableComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Gestor de Gastos');
  
  // Estado para el formulario
  protected readonly expenseToEdit = signal<Expense | null>(null);
  
  // Datos reactivos de gastos
  protected readonly expenses = computed(() => this.expenseService.expenses());
  protected readonly totalAmount = computed(() => this.expenseService.getTotalAmount());

  constructor(private expenseService: ExpenseService) {}

  ngOnInit() {
    // El servicio se inicializa automáticamente y carga los datos de localStorage
  }

  onExpenseSubmitted(expenseForm: ExpenseForm) {
    const currentExpenseToEdit = this.expenseToEdit();
    
    if (currentExpenseToEdit) {
      // Modificar gasto existente
      this.expenseService.updateExpense(currentExpenseToEdit.id, expenseForm);
      this.expenseToEdit.set(null); // Limpiar el estado de edición
    } else {
      // Agregar nuevo gasto
      this.expenseService.addExpense(expenseForm);
    }
  }

  onEditExpense(expense: Expense) {
    this.expenseToEdit.set(expense);
    // Scroll al formulario cuando se edita
    this.scrollToForm();
  }

  onDeleteExpense(expense: Expense) {
    const success = this.expenseService.deleteExpense(expense.id);
    if (success) {
      // Si estamos editando el gasto que se eliminó, cancelar la edición
      const currentExpenseToEdit = this.expenseToEdit();
      if (currentExpenseToEdit && currentExpenseToEdit.id === expense.id) {
        this.expenseToEdit.set(null);
      }
    }
  }

  onEditCanceled() {
    this.expenseToEdit.set(null);
  }

  private scrollToForm() {
    // Scroll suave al formulario
    setTimeout(() => {
      const formElement = document.querySelector('app-expense-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
