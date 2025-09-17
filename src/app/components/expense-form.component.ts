import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Expense, ExpenseForm, CATEGORIAS_GASTOS } from '../models/expense.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.css'
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