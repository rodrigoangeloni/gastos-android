export type EstadoGasto = 'pendiente' | 'pagado'

export const CATEGORIAS_SUGERIDAS = [
  'ANDE',
  'ESAP',
  'Internet',
  'Suscripciones',
  'Transporte',
  'Alimentación',
  'Otro',
] as const

export interface Gasto {
  id: string
  nombre: string
  monto: number
  categoria: string
  estado: EstadoGasto
  fechaAlta: string
}

export interface Mes {
  anio: number
  numero: number
}

export interface DatosMes {
  clave: string
  disponibilidad: number
  gastos: Gasto[]
}
