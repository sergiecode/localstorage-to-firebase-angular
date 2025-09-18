import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, from, map, catchError, of } from 'rxjs';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from '@angular/fire/firestore';
import { Expense, ExpenseForm, ExpenseData } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly COLLECTION_NAME = 'expenses';
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  
  // Signal para acceso reactivo a los datos
  public readonly expenses = signal<Expense[]>([]);
  
  // Observable para compatibilidad con patrones Firebase
  public readonly expenses$ = this.expensesSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.setupRealtimeListener();
  }

  /**
   * Configura el listener en tiempo real para cambios en Firestore
   */
  private setupRealtimeListener(): void {
    try {
      const expensesCollection = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(expensesCollection, orderBy('fechaCreacion', 'desc'));
      
      onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const expenses: Expense[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as ExpenseData;
          expenses.push({
            id: doc.id,
            ...data,
            // Convertir Timestamps a Date si es necesario
            fechaCreacion: this.convertTimestamp(data.fechaCreacion),
            fechaModificacion: this.convertTimestamp(data.fechaModificacion)
          });
        });
        this.updateExpenses(expenses);
      }, (error) => {
        console.error('❌ Error en el listener de Firestore:', error);
        this.updateExpenses([]);
      });
    } catch (error) {
      console.error('❌ Error al configurar el listener de Firestore:', error);
      this.updateExpenses([]);
    }
  }

  /**
   * Convierte Timestamp de Firebase a string ISO
   */
  private convertTimestamp(timestamp: any): string {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    return timestamp || new Date().toISOString();
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
   * Agrega un nuevo gasto (interfaz síncrona para compatibilidad)
   */
  addExpense(expenseForm: ExpenseForm): Expense {
    // Crear un gasto temporal para la UI mientras se guarda en Firestore
    const tempExpense: Expense = {
      id: 'temp-' + Date.now(),
      ...expenseForm,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    };

    // Ejecutar la operación asíncrona en background
    this.addExpenseToFirestore(expenseForm).catch(error => {
      console.error('Error al guardar en Firestore:', error);
    });

    return tempExpense;
  }

  /**
   * Actualiza un gasto existente (interfaz síncrona para compatibilidad)
   */
  updateExpense(id: string, expenseForm: ExpenseForm): Expense | null {
    const currentExpense = this.getExpenseById(id);
    if (!currentExpense) {
      return null;
    }

    const updatedExpense: Expense = {
      ...currentExpense,
      ...expenseForm,
      fechaModificacion: new Date().toISOString()
    };

    // Ejecutar la operación asíncrona en background
    this.updateExpenseInFirestore(id, expenseForm).catch(error => {
      console.error('Error al actualizar en Firestore:', error);
    });

    return updatedExpense;
  }

  /**
   * Elimina un gasto (interfaz síncrona para compatibilidad)
   */
  deleteExpense(id: string): boolean {
    // Ejecutar la operación asíncrona en background
    this.deleteExpenseFromFirestore(id).catch(error => {
      console.error('Error al eliminar en Firestore:', error);
    });

    return true; // Optimistic update
  }

  /**
   * Agrega un nuevo gasto a Firestore (versión asíncrona)
   */
  private async addExpenseToFirestore(expenseForm: ExpenseForm): Promise<Expense> {
    try {
      const expenseData: ExpenseData = {
        ...expenseForm,
        fechaCreacion: Timestamp.now(),
        fechaModificacion: Timestamp.now()
      };

      const expensesCollection = collection(this.firestore, this.COLLECTION_NAME);
      const docRef = await addDoc(expensesCollection, expenseData);
      
      const newExpense: Expense = {
        id: docRef.id,
        ...expenseForm,
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString()
      };

      return newExpense;
    } catch (error: any) {
      console.error('❌ Error al agregar gasto a Firestore:', error);
      console.error('📋 Código de error:', error.code);
      console.error('📋 Mensaje:', error.message);
      
      if (error.code === 'permission-denied') {
        console.error('🔒 Error de permisos: Verifica las reglas de seguridad en Firebase Console');
      }
      
      throw error;
    }
  }

  /**
   * Actualiza un gasto en Firestore (versión asíncrona)
   */
  private async updateExpenseInFirestore(id: string, expenseForm: ExpenseForm): Promise<Expense | null> {
    try {
      const expenseDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      
      const updateData: Partial<ExpenseData> = {
        ...expenseForm,
        fechaModificacion: Timestamp.now()
      };

      await updateDoc(expenseDoc, updateData);
      
      const updatedExpense: Expense = {
        id,
        ...expenseForm,
        fechaModificacion: new Date().toISOString()
      };

      return updatedExpense;
    } catch (error) {
      console.error('Error al actualizar gasto:', error);
      return null;
    }
  }

  /**
   * Elimina un gasto de Firestore (versión asíncrona)
   */
  private async deleteExpenseFromFirestore(id: string): Promise<boolean> {
    try {
      const expenseDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await deleteDoc(expenseDoc);
      return true;
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      return false;
    }
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
  async clearAllExpenses(): Promise<void> {
    try {
      const expensesCollection = collection(this.firestore, this.COLLECTION_NAME);
      const snapshot = await getDocs(expensesCollection);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error al limpiar gastos:', error);
    }
  }

  // Métodos privados

  private updateExpenses(expenses: Expense[]): void {
    // Actualizar signal
    this.expenses.set(expenses);
    
    // Actualizar BehaviorSubject para Observable
    this.expensesSubject.next(expenses);
  }
}