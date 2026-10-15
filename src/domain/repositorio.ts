import type { DatosMes } from './tipos'

export interface RepositorioGastos {
  cargar(clave: string): DatosMes | null
  guardar(datos: DatosMes): void
  eliminar(clave: string): void
}
