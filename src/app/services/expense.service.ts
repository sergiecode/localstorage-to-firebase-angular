import { Injectable, signal } from '@angular/core';
import { 
  Firestore,       // Instancia principal de la base de datos Firestore
  collection,      // Crea referencia a una colección de documentos
  doc,            // Crea referencia a un documento específico por ID
  addDoc,         // Agrega un nuevo documento con ID auto-generado
  updateDoc,      // Actualiza campos específicos de un documento existente
  deleteDoc,      // Elimina permanentemente un documento
  query,          // Crea consultas con filtros y ordenamiento
  orderBy,        // Ordena resultados por un campo específico
  Timestamp,      // Tipo de datos para fechas/horas de Firebase
  onSnapshot,     // Escucha cambios en tiempo real en documentos/colecciones
  QuerySnapshot,  // Tipo para el resultado de consultas con múltiples documentos
  DocumentData    // Tipo genérico para datos de documentos de Firestore
} from '@angular/fire/firestore';
import { Expense, ExpenseForm, ExpenseData } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly COLLECTION_NAME = 'expenses';
  
  // Signal para acceso reactivo a los datos
  public readonly expenses = signal<Expense[]>([]);

  constructor(private firestore: Firestore) {
    this.setupRealtimeListener();
  }

  /**
   * Establece una conexión en tiempo real con la colección 'expenses' de Firestore.
   * Utiliza onSnapshot para escuchar cambios automáticamente (agregar, modificar, eliminar documentos).
   * Los datos se ordenan por 'fechaCreacion' descendente para mostrar los gastos más recientes primero.
   * Cuando hay cambios en Firestore, actualiza automáticamente el estado local (signal reactivo).
   * En caso de error de conexión, limpia los datos locales para evitar inconsistencias.
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
   * Convierte los Timestamps de Firebase a formato ISO string para consistencia en la aplicación.
   * Firebase almacena fechas como objetos Timestamp que necesitan ser convertidos a strings
   * para mantener compatibilidad con el modelo Expense y evitar problemas de serialización.
   * Maneja tanto Timestamps de Firebase como objetos Date nativos de JavaScript.
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
   * Busca un gasto específico por su ID en el array local sincronizado con Firestore.
   * Más eficiente que hacer una consulta directa a Firebase para búsquedas individuales
   * ya que los datos están disponibles localmente gracias al listener en tiempo real.
   */
  getExpenseById(id: string): Expense | undefined {
    return this.expenses().find(expense => expense.id === id);
  }

  /**
   * Interfaz síncrona para agregar gastos que mantiene compatibilidad con el patrón anterior.
   * Implementa "Optimistic UI": crea un gasto temporal inmediatamente para respuesta rápida del usuario,
   * mientras ejecuta la operación de Firestore en segundo plano.
   * Firebase se encargará de actualizar los datos reales mediante el listener cuando la operación complete.
   * Si falla la operación en Firebase, se muestra error en consola pero la UI ya respondió al usuario.
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
   * Interfaz síncrona para actualizar gastos existentes con patrón Optimistic UI.
   * Valida la existencia del gasto localmente antes de proceder.
   * Crea inmediatamente la versión actualizada para respuesta rápida del usuario,
   * mientras envía los cambios a Firestore en segundo plano.
   * Firebase sincronizará automáticamente los datos reales mediante el listener cuando complete.
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
   * Interfaz síncrona para eliminar gastos con patrón Optimistic UI.
   * Retorna inmediatamente 'true' asumiendo que la operación será exitosa (optimistic update),
   * mientras ejecuta la eliminación en Firestore en segundo plano.
   * El listener en tiempo real actualizará automáticamente la UI cuando Firebase confirme la eliminación.
   * En caso de error, se registra en consola pero la UI ya respondió positivamente al usuario.
   */
  deleteExpense(id: string): boolean {
    // Ejecutar la operación asíncrona en background
    this.deleteExpenseFromFirestore(id).catch(error => {
      console.error('Error al eliminar en Firestore:', error);
    });

    return true; // Optimistic update
  }

  /**
   * Operación asíncrona que persiste un nuevo gasto en la colección 'expenses' de Firestore.
   * Convierte los datos del formulario a formato ExpenseData con Timestamps de Firebase.
   * Utiliza addDoc() para que Firebase genere automáticamente un ID único para el documento.
   * Maneja errores específicos como 'permission-denied' que pueden ocurrir por reglas de seguridad.
   * Una vez guardado exitosamente, el listener en tiempo real detectará el cambio y actualizará la UI.
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
   * Operación asíncrona que actualiza un documento existente en Firestore.
   * Obtiene la referencia al documento específico usando doc() con el ID proporcionado.
   * Utiliza updateDoc() para modificar solo los campos especificados (partial update).
   * Actualiza automáticamente 'fechaModificacion' con el timestamp actual de Firebase.
   * El listener en tiempo real sincronizará los cambios con la UI cuando la operación complete.
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
   * Operación asíncrona que elimina permanentemente un documento de Firestore.
   * Obtiene la referencia al documento específico y utiliza deleteDoc() para eliminarlo.
   * La eliminación es irreversible una vez ejecutada en Firebase.
   * El listener en tiempo real detectará automáticamente la eliminación y actualizará la UI.
   * Maneja errores de red o permisos que puedan impedir la eliminación.
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
   * Calcula la suma total de todos los gastos usando reduce() sobre el array local.
   * Más eficiente que hacer agregaciones en Firestore ya que los datos están disponibles localmente.
   * Se actualiza automáticamente cuando cambian los gastos gracias al sistema reactivo.
   */
  getTotalAmount(): number {
    return this.expenses().reduce((total, expense) => total + expense.monto, 0);
  }



  // Métodos privados de gestión de estado

  /**
   * Actualiza el estado local (signal) con los nuevos datos de gastos.
   * Se llama desde el listener en tiempo real cuando hay cambios en Firestore.
   * Garantiza que todos los componentes suscritos al signal reciban las actualizaciones automáticamente.
   */
  private updateExpenses(expenses: Expense[]): void {
    // Actualizar signal
    this.expenses.set(expenses);
  }
}