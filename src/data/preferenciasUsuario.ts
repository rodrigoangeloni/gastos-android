const CLAVE_MES_ACTIVO = 'gastos-app-mes-activo'

function registrarFallo(operacion: string, error: unknown): void {
  console.warn(`No se pudo ${operacion} el mes activo`, error)
}

export function leerMesActivo(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_MES_ACTIVO)
  } catch (error) {
    registrarFallo('leer', error)
    return null
  }
}

export function guardarMesActivo(clave: string): void {
  try {
    window.localStorage.setItem(CLAVE_MES_ACTIVO, clave)
  } catch (error) {
    registrarFallo('guardar', error)
  }
}
