import { describe, expect, it } from 'vitest'
import { formatarMiles, parsearMonto } from '../shared/formato'

describe('parsearMonto', () => {
  it.each([
    ['2500000', 2500000],
    ['2.500.000', 2500000],
    ['  350.000 gs ', 350000],
    ['0', 0],
  ])('interpreta %s como %s', (texto, esperado) => {
    expect(parsearMonto(texto)).toBe(esperado)
  })

  it.each(['', '   ', '-'])('devuelve NaN ante %s', (texto) => {
    expect(parsearMonto(texto)).toBeNaN()
  })

  it('conserva el signo negativo para que la validación lo rechace', () => {
    expect(parsearMonto('-5000')).toBe(-5000)
  })
})

describe('formatarMiles', () => {
  it('agrupa miles sin sufijo de moneda', () => {
    expect(formatarMiles(2500000)).toBe('2.500.000')
    expect(formatarMiles(0)).toBe('0')
  })
})
