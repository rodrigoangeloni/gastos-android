<script setup lang="ts">
import { ref } from 'vue'
import { ErrorValidacionGasto } from '../../domain/errores'
import { CATEGORIAS_SUGERIDAS } from '../../domain/tipos'
import { formatarMiles, parsearMonto } from '../../shared/formato'
import { useGastosStore } from '../gastosStore'

const store = useGastosStore()

const nombre = ref('')
const monto = ref('')
const categoria = ref('Otro')
const errorNombre = ref('')
const errorMonto = ref('')
const desplegado = ref(false)

function alternar() {
  desplegado.value = !desplegado.value
}

function enviar() {
  errorNombre.value = ''
  errorMonto.value = ''
  try {
    store.agregarGasto({
      nombre: nombre.value,
      monto: parsearMonto(monto.value),
      categoria: categoria.value,
    })
    nombre.value = ''
    monto.value = ''
    categoria.value = 'Otro'
    desplegado.value = false
  } catch (error) {
    if (error instanceof ErrorValidacionGasto) {
      if (error.campo === 'nombre') errorNombre.value = error.message
      else if (error.campo === 'monto') errorMonto.value = error.message
      return
    }
    throw error
  }
}

function editarMonto() {
  const valor = parsearMonto(monto.value)
  monto.value = Number.isFinite(valor) ? String(valor) : ''
}

function formatearMonto() {
  const valor = parsearMonto(monto.value)
  if (Number.isFinite(valor)) monto.value = formatarMiles(valor)
}
</script>

<template>
  <section class="formulario-colapsable">
    <button
      type="button"
      class="formulario-colapsable__boton"
      data-testid="alternar-formulario"
      :aria-expanded="desplegado"
      aria-controls="formulario-gasto"
      @click="alternar"
    >
      <span class="formulario-colapsable__icono" aria-hidden="true">{{ desplegado ? '−' : '+' }}</span>
      Agregar gasto
    </button>

    <form
      v-if="desplegado"
      id="formulario-gasto"
      class="formulario"
      data-testid="formulario-gasto"
      @submit.prevent="enviar"
    >

    <label class="campo" for="nombre-gasto">
      <span class="campo__etiqueta">Nombre</span>
      <input
        id="nombre-gasto"
        v-model="nombre"
        class="campo__input"
        type="text"
        placeholder="ANDE, Netflix, Internet…"
        autocomplete="off"
      />
      <span v-if="errorNombre" class="campo-error" role="alert">{{ errorNombre }}</span>
    </label>

    <div class="formulario__fila">
      <label class="campo" for="monto-gasto">
        <span class="campo__etiqueta">Monto (gs)</span>
        <input
          id="monto-gasto"
          v-model="monto"
          class="campo__input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="350.000"
          @focus="editarMonto"
          @blur="formatearMonto"
        />
        <span v-if="errorMonto" class="campo-error" role="alert">{{ errorMonto }}</span>
      </label>

      <label class="campo" for="categoria-gasto">
        <span class="campo__etiqueta">Categoría</span>
        <select id="categoria-gasto" v-model="categoria" class="campo__input">
          <option v-for="opcion in CATEGORIAS_SUGERIDAS" :key="opcion" :value="opcion">
            {{ opcion }}
          </option>
        </select>
      </label>
    </div>

    <button class="formulario__boton" type="submit">Agregar gasto</button>
    </form>
  </section>
</template>
