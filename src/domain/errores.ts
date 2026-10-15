export type CampoGasto = 'nombre' | 'monto' | 'categoria'

export class ErrorValidacionGasto extends Error {
  readonly campo: CampoGasto

  constructor(campo: CampoGasto, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorValidacionGasto'
    this.campo = campo
  }
}
