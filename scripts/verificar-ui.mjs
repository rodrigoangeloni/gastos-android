import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const SALIDA = join(tmpdir(), 'verificacion-ui')
mkdirSync(SALIDA, { recursive: true })

const navegador = await chromium.launch({ channel: 'msedge', headless: true })
const contexto = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'es-PY',
})
const pagina = await contexto.newPage()

const erroresConsola = []
pagina.on('console', (mensaje) => {
  if (mensaje.type() === 'error') erroresConsola.push(mensaje.text())
})

await pagina.goto('http://localhost:5173', { waitUntil: 'load' })
await pagina.evaluate(() => localStorage.clear())
await pagina.reload({ waitUntil: 'load' })
await pagina.waitForSelector('[data-testid="saldo"]')

await pagina.screenshot({ path: join(SALIDA, '1-inicial.png') })

await pagina.click('[data-testid="editar-ingreso"]')
await pagina.fill('#disponibilidad', '2500000')
await pagina.click('.disponibilidad__boton')
await pagina.click('[data-testid="alternar-formulario"]')
await pagina.fill('#nombre-gasto', 'ANDE')
await pagina.fill('#monto-gasto', '350000')
await pagina.click('.formulario__boton')
await pagina.waitForSelector('.gasto')

const saldoConPendiente = await pagina.textContent('[data-testid="saldo"]')
const claseAntes = await pagina.getAttribute('.gasto', 'class')
const chipAntes = await pagina.textContent('.gasto__chip')
await pagina.screenshot({ path: join(SALIDA, '2-pendiente.png') })

await pagina.click('.gasto__principal')
await pagina.waitForTimeout(200)

const saldoPagado = await pagina.textContent('[data-testid="saldo"]')
const claseDespues = await pagina.getAttribute('.gasto', 'class')
const chipDespues = await pagina.textContent('.gasto__chip')
const ariaPresionado = await pagina.getAttribute('.gasto__principal', 'aria-pressed')
await pagina.screenshot({ path: join(SALIDA, '3-pagado.png') })

const resultado = {
  directorio: SALIDA,
  saldoConPendiente: saldoConPendiente?.trim(),
  saldoPagado: saldoPagado?.trim(),
  chipAntes: chipAntes?.trim(),
  chipDespues: chipDespues?.trim(),
  claseAntes,
  claseDespues,
  ariaPresionado,
  erroresConsola,
}

await pagina.selectOption('.selector-mes__campo:first-child select', '11')
await pagina.waitForTimeout(200)
const saldoMesNuevo = await pagina.textContent('[data-testid="saldo"]')
const listaVaciaVisible = await pagina.isVisible('[data-testid="lista-vacia"]')
await pagina.screenshot({ path: join(SALIDA, '4-mes-nuevo.png') })

await pagina.selectOption('.selector-mes__campo:first-child select', '10')
await pagina.waitForTimeout(200)
const saldoVuelta = await pagina.textContent('[data-testid="saldo"]')
await pagina.screenshot({ path: join(SALIDA, '5-vuelta-al-mes.png') })

Object.assign(resultado, {
  saldoMesNuevo: saldoMesNuevo?.trim(),
  listaVaciaVisible,
  saldoVueltaAlMes: saldoVuelta?.trim(),
  ca: {
    pendienteNoDescuenta: resultado.saldoConPendiente === '2.500.000 gs',
    pagadoDescuenta: resultado.saldoPagado === '2.150.000 gs',
    colorCambia:
      claseAntes?.includes('gasto--pendiente') === true &&
      claseDespues?.includes('gasto--pagado') === true,
    mesNuevoEnCero: saldoMesNuevo?.trim() === '0 gs' && listaVaciaVisible === true,
    mesConservaDatos: saldoVuelta?.trim() === '2.150.000 gs',
    sinErroresConsola: erroresConsola.length === 0,
  },
})

console.log(JSON.stringify(resultado, null, 2))
await navegador.close()
