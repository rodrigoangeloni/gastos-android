<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { ErrorValidacionGasto } from '../../domain/errores'
import { CATEGORIAS_SUGERIDAS } from '../../domain/tipos'
import { useGastosStore } from '../gastosStore'
import { colorCategoria } from '../coloresCategoria'
import { formatarGuaranies, formatarMiles, parsearMonto } from '../../shared/formato'
import type { Gasto } from '../../domain/tipos'

const props = defineProps<{ gasto: Gasto }>()

const store = useGastosStore()
const confirmandoBorrado = ref(false)
let temporizador: ReturnType<typeof setTimeout> | undefined
let ultimoToque = 0

const editando = ref(false)
const nombreEdit = ref('')
const montoEdit = ref('')
const categoriaEdit = ref('Otro')
const errorNombreEdit = ref('')
const errorMontoEdit = ref('')

const mostrarCategoria = computed(
  () => props.gasto.categoria.trim().toLowerCase() !== props.gasto.nombre.trim().toLowerCase(),
)

function alternar() {
  const ahora = Date.now()
  if (ahora - ultimoToque < 350) return
  ultimoToque = ahora
  store.alternarGasto(props.gasto.id)
}

function empezarEdicion() {
  nombreEdit.value = props.gasto.nombre
  montoEdit.value = formatarMiles(props.gasto.monto)
  categoriaEdit.value = props.gasto.categoria
  errorNombreEdit.value = ''
  errorMontoEdit.value = ''
  confirmandoBorrado.value = false
  editando.value = true
}

function cancelarEdicion() {
  editando.value = false
}

function editarMonto() {
  const valor = parsearMonto(montoEdit.value)
  montoEdit.value = Number.isFinite(valor) ? String(valor) : ''
}

function formatearMontoEdit() {
  const valor = parsearMonto(montoEdit.value)
  if (Number.isFinite(valor)) montoEdit.value = formatarMiles(valor)
}

function guardarEdicion() {
  errorNombreEdit.value = ''
  errorMontoEdit.value = ''
  try {
    store.editarGasto(props.gasto.id, {
      nombre: nombreEdit.value,
      monto: parsearMonto(montoEdit.value),
      categoria: categoriaEdit.value,
    })
    editando.value = false
  } catch (error) {
    if (error instanceof ErrorValidacionGasto) {
      if (error.campo === 'nombre') errorNombreEdit.value = error.message
      else if (error.campo === 'monto') errorMontoEdit.value = error.message
      return
    }
    throw error
  }
}

function pedirBorrado() {
  if (confirmandoBorrado.value) {
    store.eliminarGasto(props.gasto.id)
    confirmandoBorrado.value = false
    return
  }
  confirmandoBorrado.value = true
  temporizador = setTimeout(() => {
    confirmandoBorrado.value = false
  }, 3000)
}

onUnmounted(() => {
  clearTimeout(temporizador)
})
</script>

<template>
  <li class="gasto" :class="`gasto--${gasto.estado}`">
    <button
      v-if="!editando"
      type="button"
      class="gasto__principal"
      :data-testid="`gasto-${gasto.id}`"
      :aria-pressed="gasto.estado === 'pagado'"
      :aria-label="`${gasto.nombre}: ${gasto.estado}`"
      @click="alternar"
    >
      <span
        class="gasto__casilla"
        :class="{ 'gasto__casilla--pagado': gasto.estado === 'pagado' }"
        aria-hidden="true"
      >
        {{ gasto.estado === 'pagado' ? '✓' : '' }}
      </span>
      <span class="gasto__textos">
        <span class="gasto__linea">
          <span class="gasto__nombre">{{ gasto.nombre }}</span>
          <span class="gasto__monto">{{ formatarGuaranies(gasto.monto) }}</span>
        </span>
        <span class="gasto__sublinea">
          <span class="gasto__chip">
            {{ gasto.estado === 'pendiente' ? 'Pendiente' : 'Pagado' }}
          </span>
          <span v-if="mostrarCategoria" class="gasto__categoria">
            <span
              class="gasto__punto"
              :style="{ backgroundColor: colorCategoria(gasto.categoria) }"
              aria-hidden="true"
            ></span>
            {{ gasto.categoria }}
          </span>
        </span>
      </span>
    </button>
    <button
      v-if="!editando"
      type="button"
      class="gasto__editar"
      :aria-label="`Editar ${gasto.nombre}`"
      @click="empezarEdicion"
    >
      ✎
    </button>
    <form v-else class="edicion" @submit.prevent="guardarEdicion">
      <input
        v-model="nombreEdit"
        class="campo__input"
        type="text"
        aria-label="Nombre del gasto a editar"
        autocomplete="off"
      />
      <span v-if="errorNombreEdit" class="campo-error" role="alert">{{ errorNombreEdit }}</span>
      <div class="edicion__fila">
        <input
          v-model="montoEdit"
          class="campo__input"
          type="text"
          inputmode="numeric"
          aria-label="Monto del gasto a editar"
          autocomplete="off"
          @focus="editarMonto"
          @blur="formatearMontoEdit"
        />
        <select v-model="categoriaEdit" class="campo__input" aria-label="Categoría del gasto a editar">
          <option v-for="opcion in CATEGORIAS_SUGERIDAS" :key="opcion" :value="opcion">
            {{ opcion }}
          </option>
        </select>
      </div>
      <span v-if="errorMontoEdit" class="campo-error" role="alert">{{ errorMontoEdit }}</span>
      <div class="edicion__acciones">
        <button class="edicion__guardar" type="submit">Guardar</button>
        <button class="edicion__cancelar" type="button" @click="cancelarEdicion">Cancelar</button>
      </div>
    </form>
    <button
      v-if="!editando"
      type="button"
      class="gasto__eliminar"
      :class="{ 'gasto__eliminar--confirmando': confirmandoBorrado }"
      :aria-label="
        confirmandoBorrado
          ? `Confirmar eliminación de ${gasto.nombre} de ${formatarGuaranies(gasto.monto)}`
          : `Eliminar ${gasto.nombre}`
      "
      @click="pedirBorrado"
    >
      {{ confirmandoBorrado ? '¿Eliminar?' : '✕' }}
    </button>
  </li>
</template>
