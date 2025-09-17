import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Expense, ExpenseForm, CATEGORIAS_GASTOS } from '../models/expense.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="expense-form-container">
      <h2>{{ isEditing ? 'Modificar Gasto' : 'Nuevo Gasto' }}</h2>
      
      <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="expense-form">
        <div class="form-group">
          <label for="nombre">Nombre *</label>
          <input
            type="text"
            id="nombre"
            formControlName="nombre"
            placeholder="Ingrese el nombre del gasto"
            [class.error]="isFieldInvalid('nombre')"
          />
          <div class="error-message" *ngIf="isFieldInvalid('nombre')">
            <span *ngIf="expenseForm.get('nombre')?.errors?.['required']">
              El nombre es obligatorio
            </span>
            <span *ngIf="expenseForm.get('nombre')?.errors?.['minlength']">
              El nombre debe tener al menos 2 caracteres
            </span>
          </div>
        </div>

        <div class="form-group">
          <label for="categoria">Categoría *</label>
          <select
            id="categoria"
            formControlName="categoria"
            [class.error]="isFieldInvalid('categoria')"
          >
            <option value="">Seleccione una categoría</option>
            <option *ngFor="let categoria of categorias" [value]="categoria">
              {{ categoria }}
            </option>
          </select>
          <div class="error-message" *ngIf="isFieldInvalid('categoria')">
            <span *ngIf="expenseForm.get('categoria')?.errors?.['required']">
              La categoría es obligatoria
            </span>
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label for="fijo">
            <input
              type="checkbox"
              id="fijo"
              formControlName="fijo"
            />
            <span class="checkbox-label">¿Es un gasto fijo?</span>
          </label>
        </div>

        <div class="form-group">
          <label for="monto">Monto *</label>
          <input
            type="number"
            id="monto"
            formControlName="monto"
            placeholder="0.00"
            step="0.01"
            min="0"
            [class.error]="isFieldInvalid('monto')"
          />
          <div class="error-message" *ngIf="isFieldInvalid('monto')">
            <span *ngIf="expenseForm.get('monto')?.errors?.['required']">
              El monto es obligatorio
            </span>
            <span *ngIf="expenseForm.get('monto')?.errors?.['min']">
              El monto debe ser mayor a 0
            </span>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!expenseForm.valid"
          >
            Guardar
          </button>
          
          <button
            type="button"
            class="btn btn-secondary"
            *ngIf="isEditing"
            (click)="onCancel()"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            class="btn btn-secondary"
            *ngIf="!isEditing"
            (click)="onReset()"
          >
            Resetear
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .expense-form-container {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.5rem;
    }

    .expense-form {
      display: grid;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    label {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #555;
    }

    input, select {
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #007bff;
    }

    input.error, select.error {
      border-color: #dc3545;
    }

    .checkbox-group label {
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
      margin-bottom: 0;
    }

    .checkbox-label {
      margin-left: 0.5rem;
    }

    input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    @media (min-width: 768px) {
      .expense-form {
        grid-template-columns: 1fr 1fr;
        grid-template-areas: 
          "nombre categoria"
          "monto fijo"
          "actions actions";
      }

      .form-group:nth-child(1) { grid-area: nombre; }
      .form-group:nth-child(2) { grid-area: categoria; }
      .form-group:nth-child(3) { grid-area: fijo; }
      .form-group:nth-child(4) { grid-area: monto; }
      .form-actions { grid-area: actions; }
    }
  `]
})
export class ExpenseFormComponent implements OnInit, OnChanges {
  @Input() expenseToEdit: Expense | null = null;
  @Output() expenseSubmitted = new EventEmitter<ExpenseForm>();
  @Output() editCanceled = new EventEmitter<void>();

  expenseForm: FormGroup;
  categorias = CATEGORIAS_GASTOS;

  constructor(private fb: FormBuilder) {
    this.expenseForm = this.createForm();
  }

  ngOnInit() {
    this.expenseForm = this.createForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['expenseToEdit'] && this.expenseForm) {
      if (this.expenseToEdit) {
        this.expenseForm.patchValue(this.expenseToEdit);
      } else {
        this.expenseForm.reset();
      }
    }
  }

  get isEditing(): boolean {
    return !!this.expenseToEdit;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.expenseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      this.expenseSubmitted.emit(this.expenseForm.value);
      if (!this.isEditing) {
        this.expenseForm.reset();
      }
    }
  }

  onCancel() {
    this.editCanceled.emit();
    this.expenseForm.reset();
  }

  onReset() {
    this.expenseForm.reset();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      categoria: ['', Validators.required],
      fijo: [false],
      monto: [0, [Validators.required, Validators.min(0.01)]]
    });
  }
}