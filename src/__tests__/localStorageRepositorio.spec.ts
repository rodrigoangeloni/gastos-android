import { describe, expect, it } from 'vitest'
import { capturarError as capturarErrorGenerico } from './ayudas'
import {
  CLAVE_RAIZ,
  ErrorPersistencia,
  LocalStorageRepositorio,
  esquemaVacio,
  migrarEsquema,
} from '../data/localStorageRepositorio'
import type { DatosMes, Gasto } from '../domain/tipos'

class StorageFalso {
  datos = new Map<string, string>()

  getItem(clave: string): string | null {
    return this.datos.get(clave) ?? null
  }

  setItem(clave: string, valor: string): void {
    this.datos.set(clave, valor)
  }

  removeItem(clave: string): void {
    this.datos.delete(clave)
  }
}

class StorageConCuota extends StorageFalso {
  override setItem(_clave: string, _valor: string): void {
    const error = new Error('quota exceeded')
    error.name = 'QuotaExceededError'
    throw error
  }
}

class StorageIndisponible extends StorageFalso {
  override getItem(_clave: string): string | null {
    throw new Error('SecurityError: acceso denegado')
  }
}

function capturarError(accion: () => void): ErrorPersistencia {
  return capturarErrorGenerico<ErrorPersistencia>(accion)
}

const gastoEjemplo: Gasto = {
  id: 'g1',
  nombre: 'ANDE',
  monto: 350000,
  categoria: 'ANDE',
  estado: 'pendiente',
  fechaAlta: '2026-10-01T00:00:00.000Z',
}

const mesEjemplo: DatosMes = {
  clave: '2026-10',
  disponibilidad: 2500000,
  gastos: [gastoEjemplo],
}

describe('LocalStorageRepositorio', () => {
  it('hace round-trip idéntico: guardar → cargar', () => {
    const repo = new LocalStorageRepositorio(new StorageFalso())
    repo.guardar(mesEjemplo)
    expect(repo.cargar('2026-10')).toEqual(mesEjemplo)
  })

  it('devuelve null para un mes que nunca se guardó', () => {
    const repo = new LocalStorageRepositorio(new StorageFalso())
    expect(repo.cargar('2026-11')).toBeNull()
  })

  it('JSON corrupto: lanza error json-corrupto, reinicia a vacío y permite seguir', () => {
    const storage = new StorageFalso()
    storage.setItem(CLAVE_RAIZ, 'esto{no es json')
    const repo = new LocalStorageRepositorio(storage)

    const error = capturarError(() => repo.cargar('2026-10'))
    expect(error).toBeInstanceOf(ErrorPersistencia)
    expect(error.motivo).toBe('json-corrupto')

    expect(JSON.parse(storage.getItem(CLAVE_RAIZ) ?? '')).toEqual(esquemaVacio())
    expect(repo.cargar('2026-10')).toBeNull()
    repo.guardar(mesEjemplo)
    expect(repo.cargar('2026-10')).toEqual(mesEjemplo)
  })

  it('cuota excedida al guardar: lanza error cuota-excedida', () => {
    const repo = new LocalStorageRepositorio(new StorageConCuota())
    const error = capturarError(() => repo.guardar(mesEjemplo))
    expect(error.motivo).toBe('cuota-excedida')
  })

  it('storage indisponible al leer: lanza error storage-indisponible', () => {
    const repo = new LocalStorageRepositorio(new StorageIndisponible())
    const error = capturarError(() => repo.cargar('2026-10'))
    expect(error.motivo).toBe('storage-indisponible')
  })

  it('eliminar quita el mes del esquema', () => {
    const repo = new LocalStorageRepositorio(new StorageFalso())
    repo.guardar(mesEjemplo)
    repo.eliminar('2026-10')
    expect(repo.cargar('2026-10')).toBeNull()
  })
})

describe('migrarEsquema', () => {
  it('v0 (sin version) migra conservando nombre, monto y disponibilidad', () => {
    const v0 = {
      meses: {
        '2026-09': {
          disponibilidad: 1000000,
          gastos: [{ id: 'x1', nombre: 'ESAP', monto: 50000 }],
        },
      },
    }
    const migrado = migrarEsquema(v0)
    const mes = migrado.meses['2026-09']
    expect(migrado.version).toBe(1)
    expect(mes?.disponibilidad).toBe(1000000)
    expect(mes?.gastos).toHaveLength(1)
    expect(mes?.gastos[0]).toMatchObject({
      id: 'x1',
      nombre: 'ESAP',
      monto: 50000,
      estado: 'pendiente',
      categoria: 'Otro',
    })
    expect(mes?.gastos[0]?.fechaAlta).toEqual(expect.any(String))
  })

  it('migra el estado legado realizado a pagado sin perder el dato', () => {
    const legado = {
      meses: {
        '2026-09': {
          disponibilidad: 2000000,
          gastos: [{ id: 'x2', nombre: 'ANDE', monto: 250000, estado: 'realizado' }],
        },
      },
    }
    const migrado = migrarEsquema(legado)
    expect(migrado.meses['2026-09']?.gastos[0]).toMatchObject({ estado: 'pagado' })
  })

  it('devuelve esquema vacío ante datos que no son un objeto', () => {
    expect(migrarEsquema(42)).toEqual(esquemaVacio())
    expect(migrarEsquema('texto')).toEqual(esquemaVacio())
    expect(migrarEsquema(null)).toEqual(esquemaVacio())
  })

  it('descarta meses con forma inválida sin perder los válidos', () => {
    const mixto = { meses: { '2026-10': mesEjemplo, '2026-11': 7 } }
    const migrado = migrarEsquema(mixto)
    expect(Object.keys(migrado.meses)).toEqual(['2026-10'])
  })
})
