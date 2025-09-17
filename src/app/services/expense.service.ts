import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Expense, ExpenseForm } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly STORAGE_KEY = 'expenses';
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  
  // Signal para acceso reactivo a los datos
  public readonly expenses = signal<Expense[]>([]);
  
  // Observable para compatibilidad con patrones Firebase
  public readonly expenses$ = this.expensesSubject.asObservable();

  constructor() {
    this.loadExpenses();
  }

  /**
   * Obtiene todos los gastos
   */
  getExpenses(): Expense[] {
    return this.expenses();
  }

  /**
   * Obtiene un gasto por ID
   */
  getExpenseById(id: string): Expense | undefined {
    return this.expenses().find(expense => expense.id === id);
  }

  /**
   * Agrega un nuevo gasto
   */
  addExpense(expenseForm: ExpenseForm): Expense {
    const newExpense: Expense = {
      id: this.generateId(),
      ...expenseForm,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    };

    const currentExpenses = this.expenses();
    const updatedExpenses = [...currentExpenses, newExpense];
    
    this.updateExpenses(updatedExpenses);
    return newExpense;
  }

  /**
   * Actualiza un gasto existente
   */
  updateExpense(id: string, expenseForm: ExpenseForm): Expense | null {
    const currentExpenses = this.expenses();
    const index = currentExpenses.findIndex(expense => expense.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedExpense: Expense = {
      ...currentExpenses[index],
      ...expenseForm,
      fechaModificacion: new Date().toISOString()
    };

    const updatedExpenses = [...currentExpenses];
    updatedExpenses[index] = updatedExpense;
    
    this.updateExpenses(updatedExpenses);
    return updatedExpense;
  }

  /**
   * Elimina un gasto
   */
  deleteExpense(id: string): boolean {
    const currentExpenses = this.expenses();
    const filteredExpenses = currentExpenses.filter(expense => expense.id !== id);
    
    if (filteredExpenses.length === currentExpenses.length) {
      return false; // No se encontró el gasto
    }

    this.updateExpenses(filteredExpenses);
    return true;
  }

  /**
   * Calcula el total de todos los gastos
   */
  getTotalAmount(): number {
    return this.expenses().reduce((total, expense) => total + expense.monto, 0);
  }

  /**
   * Limpia todos los gastos (útil para testing)
   */
  clearAllExpenses(): void {
    this.updateExpenses([]);
  }

  // Métodos privados

  private loadExpenses(): void {
    try {
      const storedExpenses = localStorage.getItem(this.STORAGE_KEY);
      if (storedExpenses) {
        const expenses = JSON.parse(storedExpenses) as Expense[];
        this.updateExpenses(expenses);
      }
    } catch (error) {
      console.error('Error al cargar gastos desde localStorage:', error);
      this.updateExpenses([]);
    }
  }

  private updateExpenses(expenses: Expense[]): void {
    // Actualizar signal
    this.expenses.set(expenses);
    
    // Actualizar BehaviorSubject para Observable
    this.expensesSubject.next(expenses);
    
    // Guardar en localStorage
    this.saveToStorage(expenses);
  }

  private saveToStorage(expenses: Expense[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error al guardar gastos en localStorage:', error);
    }
  }

  private generateId(): string {
    // Genera un ID simple pero único para localStorage
    // En Firebase se usaría firestore's auto-generated ID
    return Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
  }
}