import { chromium } from 'playwright'

const URL_BASE = 'http://localhost:5173'
const resultados = []

function verificar(nombre, condicion, detalle = '') {
  resultados.push({ nombre, ok: Boolean(condicion), detalle })
  console.log(`${condicion ? 'PASS' : 'FAIL'} | ${nombre}${detalle ? ` — ${detalle}` : ''}`)
}

const navegador = await chromium.launch({ channel: 'msedge', headless: true })
const contexto = await navegador.newContext()

const solicitudesNoLocales = []
await contexto.route('**/*', (ruta) => {
  const url = new URL(ruta.request().url())
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    solicitudesNoLocales.push(url.href)
    return ruta.abort()
  }
  return ruta.continue()
})

const pagina = await contexto.newPage()
await pagina.goto(URL_BASE, { waitUntil: 'networkidle' })

const saldo = () => pagina.locator('[data-testid="saldo"]').textContent()
const items = () => pagina.locator('.gasto').count()

verificar(
  'Carga inicial con lista vacía y 0 gs',
  (await saldo()).includes('0') && (await items()) === 0,
  `saldo=${await saldo()}`,
)

// 1. Saldo inicial configurable
await pagina.locator('[data-testid="editar-ingreso"]').click()
await pagina.locator('#disponibilidad').fill('2500000')
await pagina.locator('.disponibilidad__boton').click()
verificar('Saldo inicial configurable 2.500.000 gs', (await saldo()).includes('2.500.000'), await saldo())

// 2. Alta de gasto
await pagina.locator('[data-testid="alternar-formulario"]').click()
await pagina.locator('#nombre-gasto').fill('ANDE')
await pagina.locator('#monto-gasto').fill('350000')
await pagina.locator('.formulario__boton').click()
verificar('Alta de gasto en lista PENDIENTE', (await items()) === 1 && (await pagina.locator('.gasto').getAttribute('class')).includes('gasto--pendiente'))

// 3. Toque: color + descuento automático
const clasesAntes = await pagina.locator('.gasto').getAttribute('class')
const colorAntes = await pagina.locator('.gasto__principal').evaluate((el) => getComputedStyle(el).backgroundColor)
await pagina.locator('.gasto__principal').click()
const clasesDespues = await pagina.locator('.gasto').getAttribute('class')
const colorDespues = await pagina.locator('.gasto__principal').evaluate((el) => getComputedStyle(el).backgroundColor)
verificar('Un toque cambia el estado', clasesAntes.includes('pendiente') && clasesDespues.includes('pagado'))
verificar('El toque cambia el color', colorAntes !== colorDespues, `${colorAntes} -> ${colorDespues}`)
verificar('Descuento automático al pagar', (await saldo()).includes('2.150.000'), await saldo())

// 4. Reversibilidad del toque
await pagina.locator('.gasto__principal').click()
verificar('Segundo toque vuelve a pendiente y restaura saldo', (await pagina.locator('.gasto').getAttribute('class')).includes('pendiente') && (await saldo()).includes('2.500.000'))
await pagina.locator('.gasto__principal').click()

// 5. Selector de meses
const selectorMes = pagina.locator('.selector-mes__select').first()
await selectorMes.selectOption('11')
verificar('Mes nuevo inicia en 0 gs y vacío', (await saldo()).includes('0 gs') && (await items()) === 0)
await selectorMes.selectOption('10')
verificar('Vuelta al mes conserva datos', (await items()) === 1 && (await saldo()).includes('2.150.000'), `saldo=${await saldo()}`)

// 6. Persistencia tras recarga
await pagina.reload({ waitUntil: 'networkidle' })
verificar('Persistencia tras recargar', (await items()) === 1 && (await saldo()).includes('2.150.000'), `saldo=${await saldo()}`)

// 7. Configuración persistente (saldo inicial editado otra vez)
await pagina.locator('[data-testid="editar-ingreso"]').click()
await pagina.locator('#disponibilidad').fill('3000000')
await pagina.locator('.disponibilidad__boton').click()
await pagina.reload({ waitUntil: 'networkidle' })
verificar('Saldo inicial persiste tras recargar', (await saldo()).includes('2.650.000'), await saldo())

// 8. Offline: cero solicitudes a hosts externos
verificar('Sin solicitudes a hosts externos (offline total)', solicitudesNoLocales.length === 0, `${solicitudesNoLocales.length} externas`)

const fallos = resultados.filter((r) => !r.ok).length
console.log(`\nCHECKLIST F8.3: ${resultados.length - fallos}/${resultados.length} OK`)
await navegador.close()
process.exit(fallos === 0 ? 0 : 1)
