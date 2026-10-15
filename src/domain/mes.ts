import type { Mes } from './tipos'

export const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

function exigirNombre(nombre: string | undefined, referencia: string): string {
  if (nombre === undefined) throw new RangeError(`Número de mes inválido: ${referencia}`)
  return nombre
}

export function nombreMes(numero: number): string {
  if (!Number.isInteger(numero) || numero < 1 || numero > 12) {
    throw new RangeError(`Número de mes inválido: ${numero}`)
  }
  return exigirNombre(NOMBRES_MESES[numero - 1], String(numero))
}

export function esMesValido(mes: Mes): boolean {
  const anioValido = Number.isInteger(mes.anio) && mes.anio >= 2000 && mes.anio <= 2100
  const numeroValido = Number.isInteger(mes.numero) && mes.numero >= 1 && mes.numero <= 12
  return anioValido && numeroValido
}

export function claveMes(mes: Mes): string {
  if (!esMesValido(mes)) {
    throw new RangeError(`Mes inválido: ${mes.anio}-${mes.numero}`)
  }
  return `${mes.anio}-${String(mes.numero).padStart(2, '0')}`
}

export function mesActual(desde: Date = new Date()): Mes {
  return { anio: desde.getFullYear(), numero: desde.getMonth() + 1 }
}

export function claveMesActual(desde?: Date): string {
  return claveMes(mesActual(desde))
}

export function mesDesdeClave(clave: string): Mes {
  const partes = clave.split('-')
  const mes: Mes = { anio: Number(partes[0]), numero: Number(partes[1]) }
  if (!esMesValido(mes)) {
    throw new RangeError(`Clave de mes inválida: ${clave}`)
  }
  return mes
}

export function mesSiguiente(clave: string): Mes {
  const actual = mesDesdeClave(clave)
  if (actual.numero === 12) {
    return { anio: actual.anio + 1, numero: 1 }
  }
  return { anio: actual.anio, numero: actual.numero + 1 }
}
