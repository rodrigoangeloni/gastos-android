<script setup lang="ts">
import { computed } from 'vue'
import { NOMBRES_MESES } from '../../domain/mes'
import { useGastosStore } from '../gastosStore'

const store = useGastosStore()

const numeroMes = computed(() => Number(store.estado.claveMes.slice(5, 7)))
const anio = computed(() => Number(store.estado.claveMes.slice(0, 4)))
const anios = computed(() => [anio.value - 1, anio.value, anio.value + 1])

function cambiarMes(event: Event) {
  const valor = Number((event.target as HTMLSelectElement).value)
  store.cambiarMes({ anio: anio.value, numero: valor })
}

function cambiarAnio(event: Event) {
  const valor = Number((event.target as HTMLSelectElement).value)
  store.cambiarMes({ anio: valor, numero: numeroMes.value })
}
</script>

<template>
  <div class="selector-mes">
    <label class="selector-mes__campo">
      <span class="selector-mes__etiqueta">Mes</span>
      <select class="selector-mes__select" :value="numeroMes" @change="cambiarMes">
        <option v-for="(nombre, indice) in NOMBRES_MESES" :key="indice" :value="indice + 1">
          {{ nombre }}
        </option>
      </select>
    </label>
    <label class="selector-mes__campo">
      <span class="selector-mes__etiqueta">Año</span>
      <select class="selector-mes__select" :value="anio" @change="cambiarAnio">
        <option v-for="a in anios" :key="a" :value="a">{{ a }}</option>
      </select>
    </label>
  </div>
</template>
