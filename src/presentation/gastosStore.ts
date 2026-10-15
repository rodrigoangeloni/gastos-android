import { reactive, readonly } from 'vue'
import type { DeepReadonly } from 'vue'
import { guardarMesActivo, leerMesActivo } from '../data/preferenciasUsuario'
import { ErrorPersistencia } from '../data/localStorageRepositorio'
import { repositorioGastos } from '../data/repositorio'
import { alternarEstado, calcularSaldo, clonarParaMes, crearGasto, editarGasto as editarGastoEnDominio } from '../domain/gastos'
import type { CambiosGasto, DatosEntradaGasto } from '../domain/gastos'
import { claveMes, claveMesActual, mesDesdeClave, mesSiguiente, nombreMes } from '../domain/mes'
import type { RepositorioGastos } from '../domain/repositorio'
import type { DatosMes, Gasto, Mes } from '../domain/tipos'

export type FiltroEstado = 'todos' | 'pendiente' | 'pagado'

export interface StoreGastos {
  estado: DeepReadonly<EstadoInterno>
  readonly saldo: number
  readonly totalPendiente: number
  readonly totalPagado: number
  cambiarMes(mes: Mes): void
  establecerDisponibilidad(monto: number): void
  agregarGasto(datos: DatosEntradaGasto): void
  editarGasto(id: string, cambios: CambiosGasto): void
  alternarGasto(id: string): void
  eliminarGasto(id: string): void
  copiarAlMesSiguiente(): void
  verMesCopiado(): void
  descartarConfirmacion(): void
  filtrarGastos(filtro: FiltroEstado): Gasto[]
  descartarAviso(): void
}

interface Confirmacion {
  texto: string
  claveMes: string
}

interface EstadoInterno {
  claveMes: string
  disponibilidad: number
  gastos: Gasto[]
  cargando: boolean
  aviso: string | null
  confirmacion: Confirmacion | null
}

function esClaveValida(clave: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(clave)
}

function crearEstadoInicial(): EstadoInterno {
  const guardada = leerMesActivo()
  return {
    claveMes: guardada !== null && esClaveValida(guardada) ? guardada : claveMesActual(),
    disponibilidad: 0,
    gastos: [],
    cargando: true,
    aviso: null,
    confirmacion: null,
  }
}

function nombreMesMinuscula(numero: number): string {
  const nombre = nombreMes(numero)
  return nombre.charAt(0).toLowerCase() + nombre.slice(1)
}

export function crearStore(repositorio: RepositorioGastos): StoreGastos {
  const estado = reactive<EstadoInterno>(crearEstadoInicial())

  function manejarErrorPersistencia(error: unknown): void {
    if (error instanceof ErrorPersistencia) {
      estado.aviso = error.message
      return
    }
    estado.aviso = error instanceof Error ? error.message : 'Error inesperado al guardar los datos'
  }

  function cargarMes(): void {
    estado.cargando = true
    try {
      const datos = repositorio.cargar(estado.claveMes)
      estado.disponibilidad = datos?.disponibilidad ?? 0
      estado.gastos = datos?.gastos ?? []
      estado.aviso = null
      estado.confirmacion = null
    } catch (error) {
      estado.disponibilidad = 0
      estado.gastos = []
      manejarErrorPersistencia(error)
    } finally {
      estado.cargando = false
    }
  }

  function hayDatosDelMes(): boolean {
    return estado.disponibilidad > 0 || estado.gastos.length > 0
  }

  function persistir(): void {
    try {
      repositorio.guardar({
        clave: estado.claveMes,
        disponibilidad: estado.disponibilidad,
        gastos: estado.gastos,
      })
      estado.aviso = null
    } catch (error) {
      manejarErrorPersistencia(error)
    }
  }

  const store: StoreGastos = {
    estado: readonly(estado),

    get saldo() {
      return calcularSaldo(estado.disponibilidad, estado.gastos)
    },

    get totalPendiente() {
      return estado.gastos
        .filter((gasto) => gasto.estado === 'pendiente')
        .reduce((suma, gasto) => suma + gasto.monto, 0)
    },

    get totalPagado() {
      return estado.gastos
        .filter((gasto) => gasto.estado === 'pagado')
        .reduce((suma, gasto) => suma + gasto.monto, 0)
    },

    cambiarMes(mes: Mes) {
      const nuevaClave = claveMes(mes)
      if (nuevaClave === estado.claveMes) return
      if (hayDatosDelMes()) persistir()
      estado.claveMes = nuevaClave
      guardarMesActivo(nuevaClave)
      cargarMes()
    },

    establecerDisponibilidad(monto: number) {
      if (!Number.isFinite(monto) || monto < 0) {
        estado.aviso = 'La disponibilidad debe ser un número mayor o igual a cero'
        return
      }
      estado.disponibilidad = monto
      persistir()
    },

    agregarGasto(datos: DatosEntradaGasto) {
      const gasto = crearGasto(datos)
      estado.gastos = [...estado.gastos, gasto]
      persistir()
    },

    editarGasto(id: string, cambios: CambiosGasto) {
      const actual = estado.gastos.find((gasto) => gasto.id === id)
      if (actual === undefined) {
        estado.aviso = 'No se encontró el gasto a modificar'
        return
      }
      const actualizado = editarGastoEnDominio(actual, cambios)
      estado.gastos = estado.gastos.map((gasto) => (gasto.id === id ? actualizado : gasto))
      persistir()
    },

    alternarGasto(id: string) {
      const indice = estado.gastos.findIndex((gasto) => gasto.id === id)
      if (indice === -1) {
        estado.aviso = 'No se encontró el gasto a modificar'
        return
      }
      estado.gastos = estado.gastos.map((gasto) => (gasto.id === id ? alternarEstado(gasto) : gasto))
      persistir()
    },

    eliminarGasto(id: string) {
      const antes = estado.gastos.length
      estado.gastos = estado.gastos.filter((gasto) => gasto.id !== id)
      if (estado.gastos.length !== antes) persistir()
    },

    copiarAlMesSiguiente() {
      if (estado.gastos.length === 0) {
        estado.confirmacion = null
        estado.aviso = 'No hay gastos en este mes para copiar'
        return
      }
      const siguiente = mesSiguiente(estado.claveMes)
      const claveDestino = claveMes(siguiente)
      const nombreDestino = nombreMesMinuscula(siguiente.numero)
      let destino: DatosMes | null
      try {
        destino = repositorio.cargar(claveDestino)
      } catch (error) {
        manejarErrorPersistencia(error)
        return
      }
      const existentes = new Set(
        (destino?.gastos ?? []).map((gasto) => gasto.nombre.trim().toLowerCase()),
      )
      const nuevos = clonarParaMes(
        estado.gastos.filter((gasto) => !existentes.has(gasto.nombre.trim().toLowerCase())),
      )
      if (nuevos.length === 0) {
        estado.confirmacion = null
        estado.aviso = `El mes de ${nombreDestino} ya tiene estos gastos`
        return
      }
      try {
        repositorio.guardar({
          clave: claveDestino,
          disponibilidad: destino?.disponibilidad ?? 0,
          gastos: [...(destino?.gastos ?? []), ...nuevos],
        })
      } catch (error) {
        manejarErrorPersistencia(error)
        return
      }
      estado.aviso = null
      estado.confirmacion = {
        texto:
          nuevos.length === 1
            ? `Se copió 1 gasto a ${nombreDestino}`
            : `Se copiaron ${nuevos.length} gastos a ${nombreDestino}`,
        claveMes: claveDestino,
      }
    },

    verMesCopiado() {
      const destino = estado.confirmacion
      if (destino === null) return
      estado.confirmacion = null
      store.cambiarMes(mesDesdeClave(destino.claveMes))
    },

    descartarConfirmacion() {
      estado.confirmacion = null
    },

    filtrarGastos(filtro: FiltroEstado) {
      if (filtro === 'todos') return [...estado.gastos]
      return estado.gastos.filter((gasto) => gasto.estado === filtro)
    },

    descartarAviso() {
      estado.aviso = null
    },
  }

  cargarMes()
  return store
}

export const storeGastos: StoreGastos = crearStore(repositorioGastos)

export function useGastosStore(): StoreGastos {
  return storeGastos
}
