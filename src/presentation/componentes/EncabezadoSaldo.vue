<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGastosStore } from '../gastosStore'
import { formatarGuaranies, formatarMiles, parsearMonto } from '../../shared/formato'

const store = useGastosStore()

const disponibilidadTexto = ref(formatarMiles(store.estado.disponibilidad))
const errorDisponibilidad = ref('')
const editandoIngreso = ref(false)

watch(
  () => store.estado.disponibilidad,
  (valor) => {
    disponibilidadTexto.value = formatarMiles(valor)
  },
)

function empezarEdicionIngreso() {
  disponibilidadTexto.value = String(store.estado.disponibilidad)
  errorDisponibilidad.value = ''
  editandoIngreso.value = true
}

function cancelarEdicionIngreso() {
  disponibilidadTexto.value = formatarMiles(store.estado.disponibilidad)
  errorDisponibilidad.value = ''
  editandoIngreso.value = false
}

function guardarDisponibilidad() {
  const monto = parsearMonto(disponibilidadTexto.value)
  if (!Number.isFinite(monto) || monto < 0) {
    errorDisponibilidad.value = 'Ingresá un monto mayor o igual a cero'
    return
  }
  errorDisponibilidad.value = ''
  store.establecerDisponibilidad(monto)
  editandoIngreso.value = false
}

function editarDisponibilidad() {
  const monto = parsearMonto(disponibilidadTexto.value)
  disponibilidadTexto.value = Number.isFinite(monto) ? String(monto) : ''
}

function formatearDisponibilidad() {
  const monto = parsearMonto(disponibilidadTexto.value)
  if (Number.isFinite(monto)) disponibilidadTexto.value = formatarMiles(monto)
}
</script>

<template>
  <section class="saldo">
    <button
      v-if="!editandoIngreso"
      type="button"
      class="saldo__valor-boton"
      data-testid="editar-ingreso"
      :aria-label="`Editar ingreso del mes, actual ${formatarGuaranies(store.estado.disponibilidad)}`"
      @click="empezarEdicionIngreso"
    >
      <p class="saldo__etiqueta">Disponible del mes</p>
      <p class="saldo__valor" data-testid="saldo">{{ formatarGuaranies(store.saldo) }}</p>
    </button>

    <form v-else class="ingreso" data-testid="formulario-ingreso" @submit.prevent="guardarDisponibilidad">
      <label class="ingreso__campo" for="disponibilidad">Ingreso del mes</label>
      <div class="ingreso__fila">
        <input
          id="disponibilidad"
          v-model="disponibilidadTexto"
          class="ingreso__input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="2.500.000"
          @focus="editarDisponibilidad"
          @blur="formatearDisponibilidad"
        />
        <button class="disponibilidad__boton" type="submit">Guardar</button>
        <button class="ingreso__cancelar" type="button" @click="cancelarEdicionIngreso">
          ✕
        </button>
      </div>
      <p v-if="errorDisponibilidad" class="campo-error campo-error--claro" role="alert">
        {{ errorDisponibilidad }}
      </p>
    </form>

    <div class="saldo__detalles">
      <span class="saldo__detalle saldo__detalle--pendiente">
        <span class="saldo__detalle-etiqueta">Pendiente</span>
        <span class="saldo__detalle-valor">{{ formatarGuaranies(store.totalPendiente) }}</span>
      </span>
      <span class="saldo__detalle saldo__detalle--pagado">
        <span class="saldo__detalle-etiqueta">Pagado</span>
        <span class="saldo__detalle-valor">{{ formatarGuaranies(store.totalPagado) }}</span>
      </span>
    </div>
  </section>
</template>
