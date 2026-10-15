<script setup lang="ts">
import { computed, ref } from 'vue'
import { mesSiguiente, nombreMes } from '../../domain/mes'
import { useGastosStore } from '../gastosStore'
import type { FiltroEstado } from '../gastosStore'
import BarraFiltros from './BarraFiltros.vue'
import ElementoGasto from './ElementoGasto.vue'

const store = useGastosStore()
const filtro = ref<FiltroEstado>('todos')

const gastosVisibles = computed(() => store.filtrarGastos(filtro.value))
const destino = computed(() => mesSiguiente(store.estado.claveMes))
const etiquetaCopiar = computed(() => {
  const cantidad = store.estado.gastos.length
  const nombre = nombreMes(destino.value.numero)
  const que = cantidad > 0 ? `Exportar ${cantidad} a ${nombre}` : `Exportar a ${nombre}`
  return `${que} →`
})
</script>

<template>
  <div class="lista-gastos">
    <BarraFiltros v-model="filtro" />
    <p class="lista-gastos__pista">Tocá un gasto para marcarlo como pagado</p>

    <button type="button" class="copiar" data-testid="copiar-mes" @click="store.copiarAlMesSiguiente">
      {{ etiquetaCopiar }}
    </button>

    <p v-if="store.estado.gastos.length === 0" class="lista-gastos__vacio" data-testid="lista-vacia">
      Todavía no hay gastos en este mes. Agregá el primero arriba.
    </p>

    <ul v-else-if="gastosVisibles.length > 0" class="lista-gastos__items">
      <ElementoGasto v-for="gasto in gastosVisibles" :key="gasto.id" :gasto="gasto" />
    </ul>

    <p v-else class="lista-gastos__vacio">Ningún gasto coincide con el filtro.</p>
  </div>
</template>
