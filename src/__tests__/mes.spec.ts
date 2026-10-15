import { describe, expect, it } from 'vitest'
import { capturarError } from './ayudas'
import {
  claveMes,
  claveMesActual,
  esMesValido,
  mesActual,
  mesDesdeClave,
  mesSiguiente,
  nombreMes,
} from '../domain/mes'

describe('esMesValido', () => {
  it('acepta meses reales de años razonables', () => {
    expect(esMesValido({ anio: 2026, numero: 1 })).toBe(true)
    expect(esMesValido({ anio: 2026, numero: 12 })).toBe(true)
  })

  it.each([
    { anio: 2026, numero: 0 },
    { anio: 2026, numero: 13 },
    { anio: 1999, numero: 5 },
    { anio: 2026.5, numero: 5 },
  ])('rechaza %j', (mes) => {
    expect(esMesValido(mes)).toBe(false)
  })
})

describe('claveMes', () => {
  it('genera la clave con cero a la izquierda', () => {
    expect(claveMes({ anio: 2026, numero: 5 })).toBe('2026-05')
    expect(claveMes({ anio: 2026, numero: 10 })).toBe('2026-10')
  })

  it('lanza RangeError ante un mes inválido', () => {
    expect(() => claveMes({ anio: 2026, numero: 13 })).toThrow(RangeError)
  })
})

describe('mesActual', () => {
  it('toma año y mes de la fecha dada', () => {
    expect(mesActual(new Date(2026, 9, 2))).toEqual({ anio: 2026, numero: 10 })
    expect(mesActual(new Date(2026, 0, 15))).toEqual({ anio: 2026, numero: 1 })
  })

  it('claveMesActual devuelve la clave de esa fecha', () => {
    expect(claveMesActual(new Date(2026, 11, 31))).toBe('2026-12')
  })
})

describe('mesDesdeClave', () => {
  it('convierte una clave válida en mes', () => {
    expect(mesDesdeClave('2026-10')).toEqual({ anio: 2026, numero: 10 })
  })

  it.each(['2026-13', '2026', 'octubre', ''])('lanza RangeError ante %s', (clave) => {
    expect(() => mesDesdeClave(clave)).toThrow(RangeError)
  })
})

describe('mesSiguiente', () => {
  it('avanza al mes siguiente dentro del año', () => {
    expect(mesSiguiente('2026-10')).toEqual({ anio: 2026, numero: 11 })
  })

  it('pasa de diciembre a enero del año siguiente', () => {
    expect(mesSiguiente('2026-12')).toEqual({ anio: 2027, numero: 1 })
  })

  it('lanza RangeError ante clave inválida', () => {
    const error = capturarError(() => mesSiguiente('2026-13'))
    expect(error).toBeInstanceOf(RangeError)
  })
})

describe('nombreMes', () => {
  it('devuelve el nombre en español', () => {
    expect(nombreMes(1)).toBe('Enero')
    expect(nombreMes(11)).toBe('Noviembre')
    expect(nombreMes(12)).toBe('Diciembre')
  })

  it.each([0, 13, 1.5])('lanza RangeError ante %s', (numero) => {
    expect(() => nombreMes(numero)).toThrow(RangeError)
  })
})
