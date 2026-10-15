const formateadorGuaranies = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 })

export function formatarGuaranies(monto: number): string {
  return `${formateadorGuaranies.format(monto)} gs`
}

export function formatarMiles(monto: number): string {
  return formateadorGuaranies.format(monto)
}

export function parsearMonto(texto: string): number {
  const limpio = texto.replace(/[^0-9-]/g, '')
  if (limpio === '' || limpio === '-') return Number.NaN
  return Number(limpio)
}
