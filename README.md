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
5. **Copia y guarda las credenciales** que aparecen (las usarás en el Paso 6)

> 💡 **Importante**: Guarda estas credenciales en un lugar seguro, las necesitarás para configurar Angular.

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

>⚠️ **Nota**: Estas reglas son para desarrollo. En producción deberías usar autenticación.

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

### Paso 8: Importaciones de Firebase para Firestore

**Funciones y tipos necesarios de `@angular/fire/firestore`:**

```typescript
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
```

### Paso 9: Migrar el Servicio de localStorage a Firestore

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
  // Importaciones de Firebase (ver sección anterior)
  Firestore, collection, doc, addDoc, updateDoc, deleteDoc, 
  query, orderBy, Timestamp, onSnapshot, QuerySnapshot, DocumentData
} from '@angular/fire/firestore';
import { Expense, ExpenseForm, ExpenseData } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly COLLECTION_NAME = 'expenses'; // Nombre de la colección en Firestore
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  public readonly expenses = signal<Expense[]>([]);

  constructor(private firestore: Firestore) {
    this.setupRealtimeListener(); // Escuchar cambios en tiempo real
  }

  // ❌ ELIMINADO: loadExpenses() y saveToStorage()
  // ✅ AGREGADO: setupRealtimeListener() con onSnapshot()
  // ✅ AGREGADO: Métodos privados para CRUD en Firestore
  // ✅ MANTENIDO: Misma interfaz pública (getExpenses, addExpense, etc.)
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

---

## 👨‍💻 Sobre el Autor

**Sergie Code** es un Software Engineer especializado en Frontend y actualmente se desempeña como Tech Lead liderando dos equipos de desarrolladores en una reconocida empresa americana de seguros. Además, es creador de contenido tecnológico y educativo, ofreciendo cursos gratuitos de programación en su canal de YouTube y compartiendo a diario en Instagram, TikTok y otras redes sociales tips, recomendaciones y novedades del mundo del desarrollo y la inteligencia artificial. 

Ha dictado clases en la UTN, en los programas Codo a Codo y Argentina Programa 4.0, y también ha desarrollado e impartido cursos de HTML, CSS, JavaScript y ReactJs en la carrera Certified Tech Developer de Digital House. En el marco de su colaboración con Platzi, recientemente filmó en Bogotá, Colombia, tres cursos para la nueva etapa de contenidos 2025/2026: **Fundamentos de Python**, **Firebase con Angular y Gemini** y **Monorepo NX con Angular y NodeJS**. 

Asimismo, lanzó cursos propios en el área de Data, como Introducción a Python y Programación en Python, donde enseña esta tecnología desde cero. Su formación incluye estudios en Ingeniería Electrónica en la UNC, la certificación como Java Developer Engineer en Educación IT y una extensa capacitación en frameworks y tecnologías a través de cursos online. Además de su perfil técnico, se ha desarrollado como músico independiente, lo que potenció su creatividad y habilidades comunicacionales. Gracias a su experiencia, posee destacadas soft skills, comodidad al hablar en público y ha participado como orador en eventos multitudinarios como ADA13, Fingurú y SAIA en la UTN.

### 🌐 Conecta con Sergie Code

- 📸 **Instagram**: https://www.instagram.com/sergiecode
- 🧑🏼‍💻 **LinkedIn**: https://www.linkedin.com/in/sergiecode/
- 📽️ **YouTube**: https://www.youtube.com/@SergieCode
- 😺 **GitHub**: https://github.com/sergiecode
- 👤 **Facebook**: https://www.facebook.com/sergiecodeok
- 🎞️ **TikTok**: https://www.tiktok.com/@sergiecode
- 🕊️ **Twitter**: https://twitter.com/sergiecode
- 🧵 **Threads**: https://www.threads.net/@sergiecode

