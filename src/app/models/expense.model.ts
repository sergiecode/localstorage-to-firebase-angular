export interface Expense {
  id: string;
  nombre: string;
  categoria: string;
  fijo: boolean;
  monto: number;
  fechaCreacion?: Date | string; // Firebase compatible timestamp
  fechaModificacion?: Date | string; // Firebase compatible timestamp
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