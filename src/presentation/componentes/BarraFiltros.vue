<script setup lang="ts">
import { useGastosStore } from '../gastosStore'
import type { FiltroEstado } from '../gastosStore'

const store = useGastosStore()
const filtro = defineModel<FiltroEstado>({ default: 'todos' })

const OPCIONES: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'pagado', etiqueta: 'Pagados' },
]

function contar(valor: FiltroEstado): number {
  return store.filtrarGastos(valor).length
}

function seleccionar(valor: FiltroEstado) {
  filtro.value = valor
}
</script>

<template>
  <div class="filtros" role="group" aria-label="Filtrar gastos">
    <button
      v-for="opcion in OPCIONES"
      :key="opcion.valor"
      type="button"
      class="filtros__boton"
      :class="{ 'filtros__boton--activo': filtro === opcion.valor }"
      :aria-pressed="filtro === opcion.valor"
      @click="seleccionar(opcion.valor)"
    >
      {{ opcion.etiqueta }}
      <span class="filtros__contador">{{ contar(opcion.valor) }}</span>
    </button>
  </div>
</template>
