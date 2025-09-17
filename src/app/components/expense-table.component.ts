import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Expense } from '../models/expense.model';

@Component({
  selector: 'app-expense-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <h2>Lista de Gastos</h2>
      
      <div class="table-wrapper" *ngIf="expenses.length > 0; else noExpenses">
        <table class="expense-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Fijo</th>
              <th>Monto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let expense of expenses; trackBy: trackByExpenseId">
              <td class="expense-name">{{ expense.nombre }}</td>
              <td class="expense-category">{{ expense.categoria }}</td>
              <td class="expense-fixed">
                <span class="badge" [class.badge-yes]="expense.fijo" [class.badge-no]="!expense.fijo">
                  {{ expense.fijo ? 'Sí' : 'No' }}
                </span>
              </td>
              <td class="expense-amount">
                <span class="currency">€{{ expense.monto | number:'1.2-2' }}</span>
              </td>
              <td class="expense-actions">
                <button
                  class="btn btn-edit"
                  (click)="onEdit(expense)"
                  title="Modificar gasto"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Modificar
                </button>
                <button
                  class="btn btn-delete"
                  (click)="onDelete(expense)"
                  title="Eliminar gasto"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-amount">
            <strong>Total: €{{ totalAmount | number:'1.2-2' }}</strong>
          </div>
        </div>
      </div>

      <ng-template #noExpenses>
        <div class="no-expenses">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#ccc">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <h3>No hay gastos registrados</h3>
          <p>Comienza agregando tu primer gasto usando el formulario superior.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    h2 {
      margin: 0;
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      color: #333;
      font-size: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .expense-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    .expense-table th {
      background-color: #f8f9fa;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #dee2e6;
      white-space: nowrap;
    }

    .expense-table td {
      padding: 1rem;
      border-bottom: 1px solid #dee2e6;
      vertical-align: middle;
    }

    .expense-table tbody tr:hover {
      background-color: #f8f9fa;
    }

    .expense-name {
      font-weight: 500;
      color: #333;
    }

    .expense-category {
      color: #666;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-yes {
      background-color: #d4edda;
      color: #155724;
    }

    .badge-no {
      background-color: #f8d7da;
      color: #721c24;
    }

    .currency {
      font-weight: 600;
      color: #007bff;
      font-size: 1.1rem;
    }

    .expense-actions {
      white-space: nowrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-right: 0.5rem;
    }

    .btn:last-child {
      margin-right: 0;
    }

    .btn-edit {
      background-color: #17a2b8;
      color: white;
    }

    .btn-edit:hover {
      background-color: #138496;
    }

    .btn-delete {
      background-color: #dc3545;
      color: white;
    }

    .btn-delete:hover {
      background-color: #c82333;
    }

    .total-section {
      padding: 1.5rem;
      background-color: #f8f9fa;
      border-top: 2px solid #dee2e6;
    }

    .total-amount {
      text-align: right;
      font-size: 1.25rem;
      color: #333;
    }

    .no-expenses {
      padding: 3rem 1.5rem;
      text-align: center;
      color: #666;
    }

    .no-expenses h3 {
      margin: 1rem 0 0.5rem 0;
      color: #999;
    }

    .no-expenses p {
      margin: 0;
      color: #999;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .expense-table th,
      .expense-table td {
        padding: 0.75rem 0.5rem;
      }

      .btn {
        padding: 0.4rem 0.6rem;
        font-size: 0.8rem;
      }

      .btn span {
        display: none;
      }

      .expense-actions {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .btn {
        margin-right: 0;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      h2 {
        padding: 1rem;
        font-size: 1.25rem;
      }

      .expense-table {
        font-size: 0.85rem;
      }

      .expense-table th,
      .expense-table td {
        padding: 0.5rem 0.25rem;
      }

      .total-section {
        padding: 1rem;
      }

      .total-amount {
        font-size: 1.1rem;
      }
    }
  `]
})
export class ExpenseTableComponent {
  @Input() expenses: Expense[] = [];
  @Input() totalAmount: number = 0;
  @Output() editExpense = new EventEmitter<Expense>();
  @Output() deleteExpense = new EventEmitter<Expense>();

  trackByExpenseId(index: number, expense: Expense): string {
    return expense.id;
  }

  onEdit(expense: Expense) {
    this.editExpense.emit(expense);
  }

  onDelete(expense: Expense) {
    if (confirm(`¿Estás seguro de que deseas eliminar el gasto "${expense.nombre}"?`)) {
      this.deleteExpense.emit(expense);
    }
  }
}