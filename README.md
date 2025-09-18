# 🔥 Guía Completa: Migración de localStorage a Firebase Firestore en Angular

## 📋 Resumen del Proyecto

Esta guía te muestra cómo migrar una aplicación de gestión de gastos en Angular 20 que usa **localStorage** para que use **Firebase Firestore** como base de datos en la nube, manteniendo todas las funcionalidades existentes.

---

## 🚀 Parte 1: Configuración de Firebase (Pasos que hiciste)

### Paso 1: Crear Proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Crear un proyecto"**
3. Ingresa el nombre del proyecto: `mi-app-gastos`
4. Habilita Google Analytics (opcional)
5. Haz clic en **"Crear proyecto"**

### Paso 2: Agregar Firestore Database
1. En el dashboard del proyecto, ve a **"Firestore Database"**
2. Haz clic en **"Crear base de datos"**
3. Selecciona **"Empezar en modo de prueba"** (para desarrollo)
4. Elige la ubicación más cercana a tu región
5. Haz clic en **"Listo"**

### Paso 3: Registrar App Web
1. En el dashboard, haz clic en el ícono **"Web"** (`</>`)
2. Registra tu app con el nombre: `mi-app-gastos-web`
3. **NO** marques "Firebase Hosting" por ahora
4. Haz clic en **"Registrar app"**
5. **Copia las credenciales** que aparecen (las necesitarás después)

```javascript
// Ejemplo de credenciales (usa las tuyas reales)
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "mi-proyecto.firebaseapp.com",
  projectId: "mi-proyecto",
  storageBucket: "mi-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCD123456"
};
```

### Paso 4: Configurar Reglas de Firestore
1. Ve a **"Firestore Database"** → **"Reglas"**
2. Reemplaza las reglas existentes con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura a la colección expenses para desarrollo
    match /expenses/{document} {
      allow read, write: if true;
    }
  }
}
```

3. Haz clic en **"Publicar"**

> ⚠️ **Nota**: Estas reglas son para desarrollo. En producción deberías usar autenticación.

---

## 🛠️ Parte 2: Cambios en el Código Angular

### Paso 5: Instalar Dependencias de Firebase

```bash
npm install @angular/fire firebase
```

### Paso 6: Configurar Firebase en Angular

**Archivo: `src/app/app.config.ts`**

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

// Configuración de Firebase (reemplaza con tus credenciales reales)
const firebaseConfig = {
  apiKey: "tu-api-key-aqui",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCD123456"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Configuración de Firebase
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore())
  ]
};
```

### Paso 7: Actualizar el Modelo de Datos

**Archivo: `src/app/models/expense.model.ts`**

```typescript
import { Timestamp } from '@angular/fire/firestore';

export interface Expense {
  id: string;
  nombre: string;
  categoria: string;
  fijo: boolean;
  monto: number;
  fechaCreacion?: Timestamp | Date | string; // Compatible con Firebase
  fechaModificacion?: Timestamp | Date | string; // Compatible con Firebase
}

// Interface para documentos de Firestore (sin id)
export interface ExpenseData {
  nombre: string;
  categoria: string;
  fijo: boolean;
  monto: number;
  fechaCreacion?: Timestamp | Date | string;
  fechaModificacion?: Timestamp | Date | string;
}

export interface ExpenseForm {
  nombre: string;
  categoria: string;
  fijo: boolean;
  monto: number;
}

// Categorías predefinidas (sin cambios)
export const CATEGORIAS_GASTOS = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Ropa',
  'Otros'
] as const;

export type CategoriaGasto = typeof CATEGORIAS_GASTOS[number];
```

### Paso 8: Migrar el Servicio de localStorage a Firestore

**Archivo: `src/app/services/expense.service.ts`**

#### 🔴 **ANTES** (con localStorage):
```typescript
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Expense, ExpenseForm } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly STORAGE_KEY = 'expenses';
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  public readonly expenses = signal<Expense[]>([]);

  constructor() {
    this.loadExpenses(); // Cargar desde localStorage
  }

  // Métodos que usaban localStorage...
  private loadExpenses(): void {
    const storedExpenses = localStorage.getItem(this.STORAGE_KEY);
    // ...
  }

  private saveToStorage(expenses: Expense[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(expenses));
  }
}
```

#### 🟢 **DESPUÉS** (con Firestore):
```typescript
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
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
  private readonly COLLECTION_NAME = 'expenses'; // Nombre de la colección en Firestore
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  public readonly expenses = signal<Expense[]>([]);
  public readonly expenses$ = this.expensesSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.setupRealtimeListener(); // Escuchar cambios en tiempo real
  }

  /**
   * 🔥 NUEVO: Configurar escuchador en tiempo real
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
            fechaCreacion: this.convertTimestamp(data.fechaCreacion),
            fechaModificacion: this.convertTimestamp(data.fechaModificacion)
          });
        });
        this.updateExpenses(expenses);
        console.log('✅ Datos cargados desde Firestore:', expenses.length, 'gastos');
      }, (error) => {
        console.error('❌ Error en Firestore:', error);
        this.updateExpenses([]);
      });
    } catch (error) {
      console.error('❌ Error al configurar Firestore:', error);
      this.updateExpenses([]);
    }
  }

  /**
   * 🔥 NUEVO: Convertir Timestamps de Firebase
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
   * Obtener todos los gastos (sin cambios en la interfaz)
   */
  getExpenses(): Expense[] {
    return this.expenses();
  }

  /**
   * Obtener gasto por ID (sin cambios en la interfaz)
   */
  getExpenseById(id: string): Expense | undefined {
    return this.expenses().find(expense => expense.id === id);
  }

  /**
   * 🔄 MIGRADO: Agregar nuevo gasto
   */
  addExpense(expenseForm: ExpenseForm): Expense {
    // Crear gasto temporal para UI inmediata
    const tempExpense: Expense = {
      id: 'temp-' + Date.now(),
      ...expenseForm,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    };

    // Guardar en Firestore en segundo plano
    this.addExpenseToFirestore(expenseForm).catch(error => {
      console.error('Error al guardar en Firestore:', error);
    });

    return tempExpense;
  }

  /**
   * 🔥 NUEVO: Método privado para Firestore
   */
  private async addExpenseToFirestore(expenseForm: ExpenseForm): Promise<Expense> {
    try {
      console.log('📝 Agregando gasto a Firestore...', expenseForm);
      
      const expenseData: ExpenseData = {
        ...expenseForm,
        fechaCreacion: Timestamp.now(),
        fechaModificacion: Timestamp.now()
      };

      const expensesCollection = collection(this.firestore, this.COLLECTION_NAME);
      const docRef = await addDoc(expensesCollection, expenseData);
      
      console.log('✅ Gasto agregado con ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...expenseForm,
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('❌ Error al agregar gasto:', error);
      if (error.code === 'permission-denied') {
        console.error('🔒 Verifica las reglas de Firestore');
      }
      throw error;
    }
  }

  /**
   * 🔄 MIGRADO: Actualizar gasto
   */
  updateExpense(id: string, expenseForm: ExpenseForm): Expense | null {
    const currentExpense = this.getExpenseById(id);
    if (!currentExpense) return null;

    const updatedExpense: Expense = {
      ...currentExpense,
      ...expenseForm,
      fechaModificacion: new Date().toISOString()
    };

    // Actualizar en Firestore en segundo plano
    this.updateExpenseInFirestore(id, expenseForm).catch(error => {
      console.error('Error al actualizar en Firestore:', error);
    });

    return updatedExpense;
  }

  /**
   * 🔥 NUEVO: Método privado para actualizar en Firestore
   */
  private async updateExpenseInFirestore(id: string, expenseForm: ExpenseForm): Promise<void> {
    try {
      const expenseDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      const updateData: Partial<ExpenseData> = {
        ...expenseForm,
        fechaModificacion: Timestamp.now()
      };
      await updateDoc(expenseDoc, updateData);
      console.log('✅ Gasto actualizado:', id);
    } catch (error) {
      console.error('❌ Error al actualizar gasto:', error);
    }
  }

  /**
   * 🔄 MIGRADO: Eliminar gasto
   */
  deleteExpense(id: string): boolean {
    // Eliminar de Firestore en segundo plano
    this.deleteExpenseFromFirestore(id).catch(error => {
      console.error('Error al eliminar en Firestore:', error);
    });
    return true;
  }

  /**
   * 🔥 NUEVO: Método privado para eliminar de Firestore
   */
  private async deleteExpenseFromFirestore(id: string): Promise<void> {
    try {
      const expenseDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await deleteDoc(expenseDoc);
      console.log('✅ Gasto eliminado:', id);
    } catch (error) {
      console.error('❌ Error al eliminar gasto:', error);
    }
  }

  /**
   * Calcular total (sin cambios)
   */
  getTotalAmount(): number {
    return this.expenses().reduce((total, expense) => total + expense.monto, 0);
  }

  /**
   * Actualizar estado interno (método privado)
   */
  private updateExpenses(expenses: Expense[]): void {
    this.expenses.set(expenses);
    this.expensesSubject.next(expenses);
  }
}
```

---

## 🎯 Principales Cambios Realizados

### 1. **Dependencias y Configuración**
- ✅ Instalación de `@angular/fire` y `firebase`
- ✅ Configuración de Firebase en `app.config.ts`
- ✅ Adición de providers para Firestore

### 2. **Modelos de Datos**
- ✅ Soporte para `Timestamp` de Firebase
- ✅ Nueva interfaz `ExpenseData` para documentos de Firestore
- ✅ Compatibilidad con tipos de fecha de Firebase

### 3. **Servicio de Gastos**
- ❌ **Eliminado**: `localStorage.getItem()` y `localStorage.setItem()`
- ✅ **Agregado**: Escuchador en tiempo real con `onSnapshot()`
- ✅ **Agregado**: Operaciones CRUD con Firestore (`addDoc`, `updateDoc`, `deleteDoc`)
- ✅ **Mantenido**: Misma interfaz pública para compatibilidad

### 4. **Funcionalidades Nuevas**
- 🔥 **Tiempo real**: Los cambios se sincronizan automáticamente
- 🔥 **Persistencia en la nube**: Los datos se guardan en Firebase
- 🔥 **Manejo de errores**: Logs detallados para debugging

---

## 🧪 Cómo Probar la Migración

### **Verificar en Firebase Console**
- Ve a Firestore Database → Data
- Deberías ver la colección `expenses` con tus datos

## 🛡️ Reglas de Seguridad para Producción

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden acceder
    match /expenses/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## ✅ Beneficios de la Migración

1. **🌐 Acceso desde cualquier dispositivo**: Los datos están en la nube
2. **⚡ Sincronización en tiempo real**: Cambios instantáneos
3. **💾 Backup automático**: Firebase maneja las copias de seguridad
4. **📱 Escalabilidad**: Soporta múltiples usuarios
5. **🔒 Seguridad**: Reglas de acceso configurables

