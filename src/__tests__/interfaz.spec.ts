import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { storeGastos } from '../presentation/gastosStore'

function limpiarEstado() {
  localStorage.clear()
  for (const gasto of storeGastos.estado.gastos) {
    storeGastos.eliminarGasto(gasto.id)
  }
  storeGastos.establecerDisponibilidad(0)
  storeGastos.descartarAviso()
  storeGastos.descartarConfirmacion()
}

function elementoEn<V>(lista: readonly V[], indice: number): V {
  const elemento = lista[indice]
  if (elemento === undefined) throw new Error(`No existe el elemento en la posición ${indice}`)
  return elemento
}

function valorDeEntrada(wrapper: ReturnType<typeof mount>, selector: string): string {
  return (wrapper.find(selector).element as HTMLInputElement).value
}

async function agregarGasto(wrapper: ReturnType<typeof mount>, nombre: string, monto: string) {
  if (!wrapper.find('[data-testid="formulario-gasto"]').exists()) {
    await wrapper.find('[data-testid="alternar-formulario"]').trigger('click')
  }
  await wrapper.find('#nombre-gasto').setValue(nombre)
  await wrapper.find('#monto-gasto').setValue(monto)
  await wrapper.find('[data-testid="formulario-gasto"]').trigger('submit')
}

async function establecerDisponibilidad(wrapper: ReturnType<typeof mount>, monto: string) {
  if (!wrapper.find('[data-testid="formulario-ingreso"]').exists()) {
    await wrapper.find('[data-testid="editar-ingreso"]').trigger('click')
  }
  await wrapper.find('#disponibilidad').setValue(monto)
  await wrapper.find('[data-testid="formulario-ingreso"]').trigger('submit')
}

describe('interfaz principal', () => {
  beforeEach(limpiarEstado)

  it('agrega un gasto desde el formulario y queda pendiente', async () => {
    const wrapper = mount(App)
    await agregarGasto(wrapper, 'ANDE', '350000')

    expect(wrapper.findAll('.gasto')).toHaveLength(1)
    expect(wrapper.find('.gasto__nombre').text()).toBe('ANDE')
    expect(wrapper.find('.gasto__chip').text()).toBe('Pendiente')
    await wrapper.find('[data-testid="alternar-formulario"]').trigger('click')
    expect(valorDeEntrada(wrapper, '#nombre-gasto')).toBe('')
    expect(valorDeEntrada(wrapper, '#monto-gasto')).toBe('')
  })

  it('las píldoras del saldo muestran etiqueta y valor por separado', async () => {
    const wrapper = mount(App)
    await agregarGasto(wrapper, 'ANDE', '350000')

    const pildora = wrapper.find('.saldo__detalle--pendiente')
    expect(pildora.find('.saldo__detalle-etiqueta').text()).toBe('Pendiente')
    expect(pildora.find('.saldo__detalle-valor').text()).toBe('350.000 gs')
  })

  it('no envía el formulario inválido y muestra el error junto al campo', async () => {
    const wrapper = mount(App)
    await wrapper.find('[data-testid="alternar-formulario"]').trigger('click')
    await wrapper.find('#nombre-gasto').setValue('   ')
    await wrapper.find('#monto-gasto').setValue('100')
    await wrapper.find('[data-testid="formulario-gasto"]').trigger('submit')

    expect(wrapper.find('.campo-error').text()).toContain('no puede estar vacío')
    expect(wrapper.findAll('.gasto')).toHaveLength(0)
  })

  it('formatea los montos con miles al salir del campo y guarda el número crudo', async () => {
    const wrapper = mount(App)

    await wrapper.find('[data-testid="editar-ingreso"]').trigger('click')
    await wrapper.find('#disponibilidad').setValue('2500000')
    await wrapper.find('#disponibilidad').trigger('blur')
    expect(valorDeEntrada(wrapper, '#disponibilidad')).toBe('2.500.000')
    await wrapper.find('[data-testid="formulario-ingreso"]').trigger('submit')
    expect(wrapper.find('[data-testid="saldo"]').text()).toBe('2.500.000 gs')
    expect(wrapper.find('[data-testid="formulario-ingreso"]').exists()).toBe(false)

    await wrapper.find('[data-testid="alternar-formulario"]').trigger('click')
    await wrapper.find('#nombre-gasto').setValue('ANDE')
    await wrapper.find('#monto-gasto').setValue('350000')
    await wrapper.find('#monto-gasto').trigger('blur')
    expect(valorDeEntrada(wrapper, '#monto-gasto')).toBe('350.000')
    await wrapper.find('[data-testid="formulario-gasto"]').trigger('submit')
    expect(wrapper.find('.gasto__monto').text()).toBe('350.000 gs')
  })

  it('tocar el saldo abre el editor aclarando que se edita el ingreso', async () => {
    const wrapper = mount(App)
    await establecerDisponibilidad(wrapper, '2500000')

    await wrapper.find('[data-testid="editar-ingreso"]').trigger('click')
    const formulario = wrapper.find('[data-testid="formulario-ingreso"]')
    expect(formulario.text()).toContain('Ingreso del mes')
    expect(valorDeEntrada(wrapper, '#disponibilidad')).toBe('2500000')

    await wrapper.find('#disponibilidad').setValue('3000000')
    await formulario.trigger('submit')
    expect(wrapper.find('[data-testid="saldo"]').text()).toBe('3.000.000 gs')
    expect(wrapper.find('[data-testid="formulario-ingreso"]').exists()).toBe(false)
  })

  it('cancelar el editor cierra sin guardar', async () => {
    const wrapper = mount(App)
    await establecerDisponibilidad(wrapper, '2500000')

    await wrapper.find('[data-testid="editar-ingreso"]').trigger('click')
    await wrapper.find('#disponibilidad').setValue('999')
    await wrapper.find('.ingreso__cancelar').trigger('click')

    expect(wrapper.find('[data-testid="saldo"]').text()).toBe('2.500.000 gs')
    expect(wrapper.find('[data-testid="formulario-ingreso"]').exists()).toBe(false)
  })

  it('el formulario arranca cerrado y se cierra solo al guardar', async () => {
    const wrapper = mount(App)
    expect(wrapper.find('[data-testid="formulario-gasto"]').exists()).toBe(false)

    const alternar = wrapper.find('[data-testid="alternar-formulario"]')
    expect(alternar.attributes('aria-expanded')).toBe('false')
    await alternar.trigger('click')
    expect(wrapper.find('[data-testid="formulario-gasto"]').exists()).toBe(true)

    await agregarGasto(wrapper, 'ANDE', '350000')
    expect(wrapper.findAll('.gasto')).toHaveLength(1)
    expect(wrapper.find('[data-testid="formulario-gasto"]').exists()).toBe(false)
  })

  it('un toque pasa el gasto a pagado y descuenta el saldo al instante', async () => {
    const wrapper = mount(App)

    await establecerDisponibilidad(wrapper, '2500000')
    await agregarGasto(wrapper, 'ANDE', '350000')

    expect(wrapper.find('.gasto').classes()).toContain('gasto--pendiente')
    expect(wrapper.find('[data-testid="saldo"]').text()).toBe('2.500.000 gs')

    await wrapper.find('.gasto__principal').trigger('click')

    expect(wrapper.find('.gasto').classes()).toContain('gasto--pagado')
    expect(wrapper.find('.gasto__chip').text()).toBe('Pagado')
    expect(wrapper.find('[data-testid="saldo"]').text()).toBe('2.150.000 gs')
  })

  it('filtra gastos por estado con contadores sin perder datos', async () => {
    const wrapper = mount(App)
    await agregarGasto(wrapper, 'ANDE', '350000')
    await agregarGasto(wrapper, 'ESAP', '50000')
    await wrapper.find('.gasto__principal').trigger('click')

    const botones = wrapper.findAll('.filtros__boton')
    const botonTodos = elementoEn(botones, 0)
    const botonPendientes = elementoEn(botones, 1)
    const botonPagados = elementoEn(botones, 2)

    expect(botonTodos.text()).toContain('Todos 2')
    expect(botonPendientes.text()).toContain('Pendientes 1')
    expect(botonPagados.text()).toContain('Pagados 1')

    await botonPagados.trigger('click')
    expect(wrapper.findAll('.gasto')).toHaveLength(1)
    expect(wrapper.find('.gasto__chip').text()).toBe('Pagado')

    await botonPendientes.trigger('click')
    expect(wrapper.findAll('.gasto')).toHaveLength(1)
    expect(wrapper.find('.gasto__chip').text()).toBe('Pendiente')

    await botonTodos.trigger('click')
    expect(wrapper.findAll('.gasto')).toHaveLength(2)
  })

  it('cambia de mes y vuelve con los datos intactos', async () => {
    const wrapper = mount(App)
    await establecerDisponibilidad(wrapper, '2500000')
    await agregarGasto(wrapper, 'ANDE', '350000')

    const selectorMes = elementoEn(wrapper.findAll('.selector-mes__select'), 0)
    await selectorMes.setValue('11')
    expect(wrapper.find('[data-testid="saldo"]').text()).toBe('0 gs')
    expect(wrapper.find('[data-testid="lista-vacia"]').exists()).toBe(true)

    await selectorMes.setValue('10')
    expect(wrapper.find('[data-testid="saldo"]').text()).toBe('2.500.000 gs')
    expect(wrapper.findAll('.gasto')).toHaveLength(1)
  })

  describe('borrado en dos toques', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('el primer toque pide confirmación y el segundo borra', async () => {
      const wrapper = mount(App)
      await agregarGasto(wrapper, 'Netflix', '130000')

      const boton = wrapper.find('.gasto__eliminar')
      await boton.trigger('click')
      expect(boton.text()).toBe('¿Eliminar?')
      expect(wrapper.findAll('.gasto')).toHaveLength(1)

      await boton.trigger('click')
      expect(wrapper.findAll('.gasto')).toHaveLength(0)
    })

    it('la confirmación se cancela sola a los 3 segundos', async () => {
      const wrapper = mount(App)
      await agregarGasto(wrapper, 'Netflix', '130000')

      const boton = wrapper.find('.gasto__eliminar')
      await boton.trigger('click')
      expect(boton.text()).toBe('¿Eliminar?')

      await vi.advanceTimersByTimeAsync(3000)
      expect(boton.text()).toBe('✕')
      expect(wrapper.findAll('.gasto')).toHaveLength(1)
    })
  })

  describe('tap-guard', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('el doble toque rápido alterna una sola vez', async () => {
      const wrapper = mount(App)
      await establecerDisponibilidad(wrapper, '2500000')
      await agregarGasto(wrapper, 'ANDE', '350000')

      const principal = wrapper.find('.gasto__principal')
      await principal.trigger('click')
      await principal.trigger('click')
      expect(wrapper.find('.gasto__chip').text()).toBe('Pagado')
      expect(wrapper.find('[data-testid="saldo"]').text()).toBe('2.150.000 gs')

      await vi.advanceTimersByTimeAsync(400)
      await principal.trigger('click')
      expect(wrapper.find('.gasto__chip').text()).toBe('Pendiente')
    })
  })

  it('muestra casilla explícita y punto de color por categoría', async () => {
    const wrapper = mount(App)
    await wrapper.find('[data-testid="alternar-formulario"]').trigger('click')
    await wrapper.find('#nombre-gasto').setValue('Netflix')
    await wrapper.find('#monto-gasto').setValue('130000')
    await wrapper.find('#categoria-gasto').setValue('Suscripciones')
    await wrapper.find('[data-testid="formulario-gasto"]').trigger('submit')

    expect(wrapper.find('.lista-gastos__pista').text()).toContain('Tocá un gasto')
    expect(wrapper.find('.gasto__casilla').text()).toBe('')
    const punto = wrapper.find('.gasto__punto')
    expect(punto.exists()).toBe(true)
    expect(punto.attributes('style') ?? '').toContain('background-color')

    await wrapper.find('.gasto__principal').trigger('click')
    expect(wrapper.find('.gasto__casilla').text()).toBe('✓')
  })

  it('oculta la categoría cuando es igual al nombre', async () => {
    const wrapper = mount(App)
    await wrapper.find('[data-testid="alternar-formulario"]').trigger('click')
    await wrapper.find('#nombre-gasto').setValue('ANDE')
    await wrapper.find('#monto-gasto').setValue('350000')
    await wrapper.find('#categoria-gasto').setValue('ANDE')
    await wrapper.find('[data-testid="formulario-gasto"]').trigger('submit')

    expect(wrapper.find('.gasto__categoria').exists()).toBe(false)
  })

  it('copia los gastos al mes siguiente como pendientes con confirmación', async () => {
    const wrapper = mount(App)
    await establecerDisponibilidad(wrapper, '2500000')
    await agregarGasto(wrapper, 'ANDE', '350000')
    await wrapper.find('.gasto__principal').trigger('click')
    expect(wrapper.find('.gasto__chip').text()).toBe('Pagado')

    expect(wrapper.find('[data-testid="copiar-mes"]').text()).toContain('Exportar 1 a ')
    await wrapper.find('[data-testid="copiar-mes"]').trigger('click')

    const confirmacion = wrapper.find('[data-testid="confirmacion"]')
    expect(confirmacion.text()).toContain('Se copió 1 gasto a ')
    await confirmacion.find('.confirmacion__ver').trigger('click')

    expect(wrapper.findAll('.gasto')).toHaveLength(1)
    expect(wrapper.find('.gasto__chip').text()).toBe('Pendiente')
    expect(wrapper.find('[data-testid="saldo"]').text()).toBe('0 gs')
  })

  it('copiar dos veces no duplica y avisa', async () => {
    const wrapper = mount(App)
    await agregarGasto(wrapper, 'ANDE', '350000')

    await wrapper.find('[data-testid="copiar-mes"]').trigger('click')
    await wrapper.find('[data-testid="copiar-mes"]').trigger('click')

    expect(wrapper.findAll('.gasto')).toHaveLength(1)
    expect(wrapper.text()).toContain('ya tiene estos gastos')
    expect(wrapper.find('[data-testid="confirmacion"]').exists()).toBe(false)
  })

  it('avisa si no hay gastos para copiar', async () => {
    const wrapper = mount(App)
    expect(wrapper.findAll('.gasto')).toHaveLength(0)

    await wrapper.find('[data-testid="copiar-mes"]').trigger('click')

    expect(wrapper.text()).toContain('No hay gastos en este mes para copiar')
  })

  it('edita el monto de un gasto desde la fila', async () => {
    const wrapper = mount(App)
    await agregarGasto(wrapper, 'ANDE', '250000')

    await wrapper.find('.gasto__editar').trigger('click')
    const montoInput = wrapper.find('input[aria-label="Monto del gasto a editar"]')
    await montoInput.setValue('273500')
    await montoInput.trigger('blur')
    expect((montoInput.element as HTMLInputElement).value).toBe('273.500')
    await wrapper.find('.edicion').trigger('submit')

    expect(wrapper.find('.edicion').exists()).toBe(false)
    expect(wrapper.find('.gasto__monto').text()).toBe('273.500 gs')
    expect(wrapper.find('.gasto__chip').text()).toBe('Pendiente')
  })

  it('muestra error inline si el monto editado es inválido', async () => {
    const wrapper = mount(App)
    await agregarGasto(wrapper, 'ANDE', '250000')

    await wrapper.find('.gasto__editar').trigger('click')
    await wrapper.find('input[aria-label="Monto del gasto a editar"]').setValue('0')
    await wrapper.find('.edicion').trigger('submit')

    expect(wrapper.find('.edicion .campo-error').text()).toContain('mayor que cero')
    expect(wrapper.find('.gasto__monto').exists()).toBe(false)
    await wrapper.find('.edicion__cancelar').trigger('click')
    expect(wrapper.find('.gasto__monto').text()).toBe('250.000 gs')
  })

  it('muestra el nombre completo junto al monto en la línea principal', async () => {
    const wrapper = mount(App)
    await wrapper.find('[data-testid="alternar-formulario"]').trigger('click')
    await wrapper.find('#nombre-gasto').setValue('Pago de tarjeta de crédito Itaú')
    await wrapper.find('#monto-gasto').setValue('300000')
    await wrapper.find('[data-testid="formulario-gasto"]').trigger('submit')

    const linea = wrapper.find('.gasto__linea')
    expect(linea.find('.gasto__nombre').text()).toBe('Pago de tarjeta de crédito Itaú')
    expect(linea.find('.gasto__monto').text()).toBe('300.000 gs')
    expect(wrapper.find('.gasto__sublinea .gasto__chip').text()).toBe('Pendiente')
  })
})
