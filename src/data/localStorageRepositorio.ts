import { generarId } from '../domain/gastos'
import type { RepositorioGastos } from '../domain/repositorio'
import type { DatosMes, Gasto } from '../domain/tipos'

export const CLAVE_RAIZ = 'gastos-app'
export const VERSION_ESQUEMA = 1

export type MotivoPersistencia = 'json-corrupto' | 'cuota-excedida' | 'storage-indisponible'

export class ErrorPersistencia extends Error {
  readonly motivo: MotivoPersistencia
  readonly causa: unknown

  constructor(motivo: MotivoPersistencia, mensaje: string, causa?: unknown) {
    super(mensaje)
    this.name = 'ErrorPersistencia'
    this.motivo = motivo
    this.causa = causa
  }
}

export interface Esquema {
  version: number
  meses: Record<string, DatosMes>
}

type Almacenamiento = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function esquemaVacio(): Esquema {
  return { version: VERSION_ESQUEMA, meses: {} }
}

function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function migrarGasto(bruto: Record<string, unknown>): Gasto {
  return {
    id: typeof bruto.id === 'string' && bruto.id.length > 0 ? bruto.id : generarId(),
    nombre: typeof bruto.nombre === 'string' ? bruto.nombre : '',
    monto: typeof bruto.monto === 'number' && Number.isFinite(bruto.monto) ? bruto.monto : 0,
    categoria: typeof bruto.categoria === 'string' && bruto.categoria.length > 0 ? bruto.categoria : 'Otro',
    // Legado v1: el estado se llamaba 'realizado'; se migra a 'pagado' (F9.2).
    estado: bruto.estado === 'pagado' || bruto.estado === 'realizado' ? 'pagado' : 'pendiente',
    fechaAlta: typeof bruto.fechaAlta === 'string' ? bruto.fechaAlta : new Date(0).toISOString(),
  }
}

function migrarMes(clave: string, bruto: unknown): DatosMes | null {
  if (!esObjetoPlano(bruto)) return null
  const disponibilidad =
    typeof bruto.disponibilidad === 'number' && Number.isFinite(bruto.disponibilidad)
      ? bruto.disponibilidad
      : 0
  const gastosBrutos = Array.isArray(bruto.gastos) ? bruto.gastos : []
  const gastos = gastosBrutos.filter(esObjetoPlano).map(migrarGasto)
  return { clave, disponibilidad, gastos }
}

export function migrarEsquema(datos: unknown): Esquema {
  if (!esObjetoPlano(datos)) return esquemaVacio()
  const mesesBrutos = esObjetoPlano(datos.meses) ? datos.meses : {}
  const meses: Record<string, DatosMes> = {}
  for (const [clave, mesBruto] of Object.entries(mesesBrutos)) {
    const mes = migrarMes(clave, mesBruto)
    if (mes !== null) meses[clave] = mes
  }
  return { version: VERSION_ESQUEMA, meses }
}

export class LocalStorageRepositorio implements RepositorioGastos {
  constructor(private readonly almacenamiento: Almacenamiento) {}

  cargar(clave: string): DatosMes | null {
    const esquema = this.leerEsquema()
    return esquema.meses[clave] ?? null
  }

  guardar(datos: DatosMes): void {
    const esquema = this.leerEsquema()
    esquema.meses[datos.clave] = datos
    this.escribirEsquema(esquema)
  }

  eliminar(clave: string): void {
    const esquema = this.leerEsquema()
    if (!(clave in esquema.meses)) return
    delete esquema.meses[clave]
    this.escribirEsquema(esquema)
  }

  private leerEsquema(): Esquema {
    let crudo: string | null
    try {
      crudo = this.almacenamiento.getItem(CLAVE_RAIZ)
    } catch (causa) {
      throw new ErrorPersistencia('storage-indisponible', 'No se puede acceder al almacenamiento local', causa)
    }
    if (crudo === null) return esquemaVacio()

    let datos: unknown
    try {
      datos = JSON.parse(crudo)
    } catch (causa) {
      this.restaurarVacio()
      throw new ErrorPersistencia('json-corrupto', 'Los datos guardados estaban dañados; se reinició el almacenamiento', causa)
    }
    if (!esObjetoPlano(datos)) {
      this.restaurarVacio()
      throw new ErrorPersistencia('json-corrupto', 'Los datos guardados tenían un formato inválido; se reinició el almacenamiento')
    }
    return migrarEsquema(datos)
  }

  private restaurarVacio(): void {
    try {
      this.almacenamiento.setItem(CLAVE_RAIZ, JSON.stringify(esquemaVacio()))
    } catch {
      throw new ErrorPersistencia('storage-indisponible', 'No se pudo reiniciar el almacenamiento local')
    }
  }

  private escribirEsquema(esquema: Esquema): void {
    try {
      this.almacenamiento.setItem(CLAVE_RAIZ, JSON.stringify(esquema))
    } catch (causa) {
      const esCuota = causa instanceof Error && causa.name === 'QuotaExceededError'
      if (esCuota) {
        throw new ErrorPersistencia('cuota-excedida', 'No hay espacio disponible para guardar los datos', causa)
      }
      throw new ErrorPersistencia('storage-indisponible', 'No se pudo escribir en el almacenamiento local', causa)
    }
  }
}
