import { Timestamp } from '@angular/fire/firestore';

export interface Expense {
  id: string;
  nombre: string;
  categoria: string;
  fijo: boolean;
  monto: number;
  fechaCreacion?: Timestamp | Date | string; // Firebase compatible timestamp
  fechaModificacion?: Timestamp | Date | string; // Firebase compatible timestamp
}

// Interface for Firestore document data (without id)
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

// Categorías predefinidas para el select
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