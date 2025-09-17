import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Expense } from '../models/expense.model';

@Component({
  selector: 'app-expense-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-table.component.html',
  styleUrl: './expense-table.component.css'
})
export class ExpenseTableComponent {
  @Input() expenses: Expense[] = [];
  @Input() totalAmount: number = 0;
  @Output() editExpense = new EventEmitter<Expense>();
  @Output() deleteExpense = new EventEmitter<Expense>();

  onEdit(expense: Expense) {
    this.editExpense.emit(expense);
  }

  onDelete(expense: Expense) {
    if (confirm(`¿Estás seguro de que deseas eliminar el gasto "${expense.nombre}"?`)) {
      this.deleteExpense.emit(expense);
    }
  }
}