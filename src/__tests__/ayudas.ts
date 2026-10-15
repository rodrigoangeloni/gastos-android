export function capturarError<T>(accion: () => unknown): T {
  try {
    accion()
  } catch (error) {
    return error as T
  }
  throw new Error('Se esperaba que la acción lanzara un error')
}
