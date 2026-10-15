import type { RepositorioGastos } from '../domain/repositorio'
import { LocalStorageRepositorio } from './localStorageRepositorio'

export const repositorioGastos: RepositorioGastos = new LocalStorageRepositorio(window.localStorage)
