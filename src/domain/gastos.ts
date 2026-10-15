import { ErrorValidacionGasto } from './errores'
import type { Gasto } from './tipos'

export interface DatosEntradaGasto {
  nombre: string
  monto: number
  categoria: string
}

export interface CambiosGasto {
  nombre: string
  monto: number
  categoria: string
}

export function generarId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `gasto-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function validarNombre(nombre: string): string {
  const recortado = nombre.trim()
  if (recortado.length === 0) {
    throw new ErrorValidacionGasto('nombre', 'El nombre del gasto no puede estar vacío')
  }
  return recortado
}

function validarMonto(monto: number): number {
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new ErrorValidacionGasto('monto', 'El monto debe ser un número mayor que cero')
  }
  return monto
}

function normalizarCategoria(categoria: string): string {
  const recortada = categoria.trim()
  return recortada.length > 0 ? recortada : 'Otro'
}

export function crearGasto(datos: DatosEntradaGasto): Gasto {
  return {
    id: generarId(),
    nombre: validarNombre(datos.nombre),
    monto: validarMonto(datos.monto),
    categoria: normalizarCategoria(datos.categoria),
    estado: 'pendiente',
    fechaAlta: new Date().toISOString(),
  }
}

export function calcularSaldo(disponibilidad: number, gastos: readonly Gasto[]): number {
  const totalPagado = gastos
    .filter((gasto) => gasto.estado === 'pagado')
    .reduce((suma, gasto) => suma + gasto.monto, 0)
  return disponibilidad - totalPagado
}

export function alternarEstado(gasto: Gasto): Gasto {
  return {
    ...gasto,
    estado: gasto.estado === 'pendiente' ? 'pagado' : 'pendiente',
  }
}

export function clonarParaMes(gastos: readonly Gasto[]): Gasto[] {
  return gastos.map((gasto) => ({
    id: generarId(),
    nombre: gasto.nombre,
    monto: gasto.monto,
    categoria: gasto.categoria,
    estado: 'pendiente',
    fechaAlta: new Date().toISOString(),
  }))
}

export function editarGasto(gasto: Gasto, cambios: CambiosGasto): Gasto {
  return {
    ...gasto,
    nombre: validarNombre(cambios.nombre),
    monto: validarMonto(cambios.monto),
    categoria: normalizarCategoria(cambios.categoria),
  }
}
