<script setup lang="ts">
import { useGastosStore } from './presentation/gastosStore'
import { VERSION_APP } from './version'
import SelectorMes from './presentation/componentes/SelectorMes.vue'
import EncabezadoSaldo from './presentation/componentes/EncabezadoSaldo.vue'
import FormularioGasto from './presentation/componentes/FormularioGasto.vue'
import ListaGastos from './presentation/componentes/ListaGastos.vue'

const store = useGastosStore()
</script>

<template>
  <main class="app">
    <header class="app__cabecera">
      <div class="app__marca">
        <svg class="app__logo" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <circle cx="16" cy="16" r="13" fill="#ffffff" stroke="#2563eb" stroke-width="3" />
          <text
            x="16"
            y="21.5"
            text-anchor="middle"
            font-size="14"
            font-weight="700"
            fill="#2563eb"
            font-family="system-ui, sans-serif"
          >₲</text>
        </svg>
        <h1 class="app__titulo">Gastos mensuales</h1>
      </div>
      <SelectorMes />
    </header>

    <div v-if="store.estado.aviso" class="aviso" role="alert">
      <span>{{ store.estado.aviso }}</span>
      <button type="button" class="aviso__cerrar" aria-label="Cerrar aviso" @click="store.descartarAviso">
        ✕
      </button>
    </div>

    <div
      v-if="store.estado.confirmacion"
      class="confirmacion"
      role="status"
      data-testid="confirmacion"
    >
      <span>{{ store.estado.confirmacion.texto }}</span>
      <div class="confirmacion__acciones">
        <button type="button" class="confirmacion__ver" @click="store.verMesCopiado">Ver mes</button>
        <button
          type="button"
          class="confirmacion__cerrar"
          aria-label="Cerrar confirmación"
          @click="store.descartarConfirmacion"
        >
          ✕
        </button>
      </div>
    </div>

    <EncabezadoSaldo />
    <FormularioGasto />

    <section class="seccion-gastos">
      <h2 class="seccion-gastos__titulo">Gastos del mes</h2>
      <p v-if="store.estado.cargando" class="seccion-gastos__cargando">Cargando…</p>
      <ListaGastos v-else />
    </section>

    <footer class="app__pie">Funciona sin internet · Datos guardados en tu celular · v{{ VERSION_APP }}</footer>
  </main>
</template>
