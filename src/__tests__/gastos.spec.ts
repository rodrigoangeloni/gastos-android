import { describe, expect, it } from 'vitest'
import { capturarError } from './ayudas'
import { ErrorValidacionGasto } from '../domain/errores'
import { alternarEstado, calcularSaldo, clonarParaMes, crearGasto, editarGasto } from '../domain/gastos'
import type { Gasto } from '../domain/tipos'

function gastoDe(estado: 'pendiente' | 'pagado', monto: number): Gasto {
  return {
    id: crypto.randomUUID(),
    nombre: 'Gasto',
    monto,
    categoria: 'Otro',
    estado,
    fechaAlta: '2026-10-01T00:00:00.000Z',
  }
}

describe('crearGasto', () => {
  it('crea un gasto válido pendiente, recortando nombre y categoría', () => {
    const gasto = crearGasto({ nombre: '  ANDE  ', monto: 350000, categoria: ' ANDE ' })
    expect(gasto.nombre).toBe('ANDE')
    expect(gasto.categoria).toBe('ANDE')
    expect(gasto.monto).toBe(350000)
    expect(gasto.estado).toBe('pendiente')
    expect(gasto.id).not.toBe('')
    expect(Number.isNaN(Date.parse(gasto.fechaAlta))).toBe(false)
  })

  it('usa la categoría Otro cuando viene vacía', () => {
    expect(crearGasto({ nombre: 'Netflix', monto: 50000, categoria: '   ' }).categoria).toBe('Otro')
  })

  it('rechaza nombre vacío con error tipado', () => {
    const error = capturarError<ErrorValidacionGasto>(() =>
      crearGasto({ nombre: '   ', monto: 100, categoria: 'Otro' }),
    )
    expect(error).toBeInstanceOf(ErrorValidacionGasto)
    expect(error.campo).toBe('nombre')
  })

  it.each([0, -1000, Number.NaN])('rechaza el monto %s con error tipado', (monto) => {
    const error = capturarError<ErrorValidacionGasto>(() =>
      crearGasto({ nombre: 'ANDE', monto, categoria: 'Otro' }),
    )
    expect(error).toBeInstanceOf(ErrorValidacionGasto)
    expect(error.campo).toBe('monto')
  })

  it('genera ids únicos en creaciones sucesivas', () => {
    const ids = new Set(Array.from({ length: 50 }, () => crearGasto({ nombre: 'X', monto: 1, categoria: 'Otro' }).id))
    expect(ids.size).toBe(50)
  })
})

describe('calcularSaldo', () => {
  it('sin gastos devuelve la disponibilidad completa', () => {
    expect(calcularSaldo(2500000, [])).toBe(2500000)
  })

  it('un gasto pendiente no descuenta', () => {
    expect(calcularSaldo(2500000, [gastoDe('pendiente', 350000)])).toBe(2500000)
  })

  it('un gasto pagado descuenta su monto', () => {
    expect(calcularSaldo(2500000, [gastoDe('pagado', 350000)])).toBe(2150000)
  })

  it('descuenta solo los pagados entre varios gastos', () => {
    const gastos = [
      gastoDe('pagado', 500000),
      gastoDe('pendiente', 100000),
      gastoDe('pagado', 200000),
    ]
    expect(calcularSaldo(2500000, gastos)).toBe(1800000)
  })

  it('permite saldo negativo cuando se gasta de más', () => {
    expect(calcularSaldo(100000, [gastoDe('pagado', 500000)])).toBe(-400000)
  })
})

describe('alternarEstado', () => {
  it('pasa de pendiente a pagado', () => {
    expect(alternarEstado(gastoDe('pendiente', 100)).estado).toBe('pagado')
  })

  it('pasa de pagado a pendiente', () => {
    expect(alternarEstado(gastoDe('pagado', 100)).estado).toBe('pendiente')
  })

  it('es inmutable: no modifica el gasto original', () => {
    const original = gastoDe('pendiente', 100)
    const alternado = alternarEstado(original)
    expect(alternado).not.toBe(original)
    expect(original.estado).toBe('pendiente')
    expect(alternado.monto).toBe(original.monto)
    expect(alternado.id).toBe(original.id)
  })
})

describe('clonarParaMes', () => {
  it('clona con ids nuevos, mismos datos y siempre pendientes', () => {
    const pagado = { ...gastoDe('pagado', 250000), nombre: 'ANDE', categoria: 'ANDE' }
    const clonados = clonarParaMes([pagado, gastoDe('pendiente', 130000)])

    expect(clonados).toHaveLength(2)
    const primero = clonados[0]
    const segundo = clonados[1]
    if (primero === undefined || segundo === undefined) throw new Error('Faltan clonados')
    expect(primero.id).not.toBe(pagado.id)
    expect(primero).toMatchObject({ nombre: 'ANDE', monto: 250000, categoria: 'ANDE', estado: 'pendiente' })
    expect(segundo.estado).toBe('pendiente')
    expect(Number.isNaN(Date.parse(primero.fechaAlta))).toBe(false)
  })

  it('no modifica los originales', () => {
    const original = gastoDe('pagado', 100)
    clonarParaMes([original])
    expect(original.estado).toBe('pagado')
  })

  it('con lista vacía devuelve lista vacía', () => {
    expect(clonarParaMes([])).toEqual([])
  })
})

describe('editarGasto', () => {
  it('actualiza nombre, monto y categoría manteniendo id, estado y fecha', () => {
    const original: Gasto = {
      ...gastoDe('pagado', 250000),
      nombre: 'ANDE',
      categoria: 'ANDE',
      fechaAlta: '2026-10-01T00:00:00.000Z',
    }
    const editado = editarGasto(original, { nombre: '  ANDE  ', monto: 273500, categoria: 'Servicios' })

    expect(editado).toMatchObject({
      nombre: 'ANDE',
      monto: 273500,
      categoria: 'Servicios',
      estado: 'pagado',
    })
    expect(editado.id).toBe(original.id)
    expect(editado.fechaAlta).toBe(original.fechaAlta)
    expect(original.monto).toBe(250000)
  })

  it('usa Otro cuando la categoría viene vacía', () => {
    expect(editarGasto(gastoDe('pendiente', 100), { nombre: 'X', monto: 50, categoria: '  ' }).categoria).toBe('Otro')
  })

  it('rechaza nombre vacío con error tipado', () => {
    const error = capturarError<ErrorValidacionGasto>(() =>
      editarGasto(gastoDe('pendiente', 100), { nombre: '   ', monto: 50, categoria: 'Otro' }),
    )
    expect(error).toBeInstanceOf(ErrorValidacionGasto)
    expect(error.campo).toBe('nombre')
  })

  it.each([0, -1000, Number.NaN])('rechaza el monto %s con error tipado', (monto) => {
    const error = capturarError<ErrorValidacionGasto>(() =>
      editarGasto(gastoDe('pendiente', 100), { nombre: 'X', monto, categoria: 'Otro' }),
    )
    expect(error).toBeInstanceOf(ErrorValidacionGasto)
    expect(error.campo).toBe('monto')
  })
})
