import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { VERSION_APP } from '../version'

describe('App', () => {
  it('monta la interfaz principal', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Gastos mensuales')
    expect(wrapper.text()).toContain('Disponible del mes')
    expect(wrapper.text()).toContain(`v${VERSION_APP}`)
    expect(wrapper.find('.app__logo').exists()).toBe(true)
    expect(wrapper.find('.app__logo').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('[data-testid="alternar-formulario"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="formulario-gasto"]').exists()).toBe(false)
  })
})
