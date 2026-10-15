const PALETA_CATEGORIAS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#b45309',
  '#059669',
  '#0891b2',
] as const

function exigirColor(color: string | undefined): string {
  if (color === undefined) throw new Error('La paleta de categorías está vacía')
  return color
}

export function colorCategoria(categoria: string): string {
  let hash = 0
  for (const caracter of categoria.trim().toLowerCase()) {
    hash = (hash * 31 + (caracter.codePointAt(0) ?? 0)) >>> 0
  }
  return exigirColor(PALETA_CATEGORIAS[hash % PALETA_CATEGORIAS.length])
}
