# PLAN — App "Control de Gastos Mensuales" (APK sin Android Studio)

## 0. Contexto

- **Necesidad**: registrar disponibilidad mensual (ej. 2.500.000 gs), alta de gastos
  (ANDE, ESAP, Internet, Netflix...), estados pendiente/realizado con toque y cambio
  de color, descuento automático del saldo, configurable por mes, offline.
- **Stack**: Vue 3 + TypeScript + Vite, Capacitor 8, Android SDK (CLI), Gradle.
- **Restricciones**: sin Android Studio, sin cuentas/pago, sin admin; laptop
  Ryzen 5 3500U, 5,9 GB RAM, 758 GB libres, JDK 22, Node 22.
- **Skills**: capacitor-best-practices, capacitor-testing (cap-go), locales:
  vue-best-practices, buenas-practicas, vitest, code-review-and-quality.

## Convenciones

- ID de tarea: `F<FASE>.<N>` (ej. F2.3). Estados: pendiente | en curso | hecha.
- **Marcado visual**: `✅` junto al ID = hecha con CA verificada; encabezado con
  `✅ COMPLETADA` = fase entera cerrada.
- **Definición de hecho**: código escrito + criterio de aceptación verificado +
  `npm run check` en verde (lint, typecheck, tests).
- Cada tarea es **atómica**: no se divide; si lo requiere, se desglosa en subtareas.

---

## MCPs de visualización y verificación (activar según fase)

| MCP | Fases | Uso | Recursos |
|---|---|---|---|
| playwright | 4, 5, 8 | Ver la app: screenshots móviles (390×844), interacción (toggle), console | navegador bajo demanda |
| chrome-devtools | 8 | Lighthouse (a11y/mejores prácticas), emulación móvil, throttling | navegador bajo demanda |
| native-devtools | 7, 8 | APK en celular vía ADB: `android_screenshot` / `android_click` | solo con dispositivo |
| context7 | todas | Docs Capacitor/Gradle/Vue | ligero, bajo demanda |
| ddg | todas | Búsqueda de errores de build/SDK | ligero, bajo demanda |

Regla de ahorro de recursos: base siempre activa = `context7` + `ddg`.
Playwright desde Fase 4, chrome-devtools en Fase 8, native-devtools en Fase 7-8
(con celular conectado por depuración USB).

## Fase 0 — Entorno (gratis, sin administrador) ✅ COMPLETADA

- **F0.1** ✅ Descargar `commandlinetools-win-13114758_latest.zip` (143 MB, URL verificada 200).
  CA: archivo en disco con tamaño > 140 MB.
- **F0.2** ✅ Extraer a `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest`.
  CA: existe `...\latest\bin\sdkmanager.bat`.
- **F0.3** ✅ Aceptar licencias: `sdkmanager --licenses`. CA: "All SDK package licenses accepted".
- **F0.4** ✅ Instalar `platform-tools`, `platforms;android-35`, `build-tools;34.0.0`.
  CA: `sdkmanager --list_installed` los muestra. Dep: F0.3.
- **F0.5** ✅ `setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"` (usuario, sin UAC).
  CA: nuevo terminal con `$env:ANDROID_HOME` definido. Dep: F0.2.
- **F0.6** ✅ Validar `java -version` (22) para Gradle 8.8+; si falla, instalar Temurin 17
  per-user y fijar `JAVA_HOME`. CA: ambos comandos responden sin error.
  *(Resultado: JDK 22.0.1 OK; `JAVA_HOME` estaba vacío → fijado a `C:\Program Files\Java\jdk-22`.)*
- **F0.7** ✅ Instalar skills Capacitor (`npx skills add ... -g -y`, 2 comandos).
  CA: aparecen en la lista de skills. *Patrón: toolchain como código, reproducible.*
  *(Resultado: `capacitor-best-practices` + `capacitor-testing` en `~\.agents\skills`.)*

## Fase 1 — Scaffold y gobernanza ✅ COMPLETADA

- **F1.1** ✅ Proyecto Vite + Vue 3 + TS (`npm create vue@latest` con TS + ESLint).
  CA: `npm run dev` sirve la app. Dep: Node 22 (listo).
  *(Resultado: scaffold no interactivo en temporal + movimiento seguro; dev sirve HTTP 200.)*
- **F1.2** ✅ Capacitor: `npm i @capacitor/core @capacitor/cli`. CA: `npx cap --version` OK.
  *(Resultado: 8.5.2.)*
- **F1.3** ✅ Estructura por capas: `src/domain/`, `src/data/`, `src/presentation/`,
  `src/shared/`. CA: árbol de carpetas creado. *Patrón: arquitectura hexagonal.*
- **F1.4** ✅ Script unificado `npm run check` = lint + `vue-tsc --noEmit` + `vitest run`.
  CA: corre (aunque falle por falta de tests, compila el pipeline). Dep: F1.1.
  *(Resultado: exit 0 — oxlint 0 errores, vue-tsc OK, 1 test ✔.)*
- **F1.5** ✅ README con comandos. CA: contiene build, test, apk. Dep: F1.4.

## Fase 2 — Dominio (lógica pura, sin UI ni storage) ✅ COMPLETADA

- **F2.1** ✅ Tipos: `Gasto {id, nombre, monto, categoria, estado, fechaAlta}`,
  `EstadoGasto = 'pendiente' | 'realizado'`, `Mes`.
  CA: `vue-tsc` sin errores. *SRP: modelo sin dependencias.*
  *(Resultado: `src/domain/tipos.ts` + `DatosMes` como agregado del mes.)*
- **F2.2** ✅ `crearGasto(datos)` con validación (nombre no vacío, monto > 0) que lanza
  error tipado. CA: casos válidos/inválidos definidos. *Patrón: Factory.*
  *(Resultado: `ErrorValidacionGasto` con campo `nombre|monto|categoria` en `errores.ts`.)*
- **F2.3** ✅ `calcularSaldo(disponibilidad, gastos) = disponibilidad − Σ montos de
  realizados`. CA: 0 gastos, 1, N; negativo permitido. *Función pura.*
- **F2.4** ✅ `alternarEstado(gasto)`: pendiente→realizado y viceversa, inmutable.
  CA: ida y vuelta conservan datos. *Inmutabilidad/DRY.*
- **F2.5** ✅ `crearRepositorioGastos` como **interfaz** (guardar/cargar/eliminar).
  CA: dominio no importa `localStorage`. *Patrones: Repository + DIP.*
  *(Resultado: `RepositorioGastos { cargar, guardar, eliminar }` sobre `DatosMes`.)*
  *(Helpers de mes en `mes.ts`: `claveMes`, `mesActual`, `esMesValido`.)*
  *(CA global: `npm run check` exit 0.)*

## Fase 3 — Persistencia ✅ COMPLETADA

- **F3.1** ✅ Adaptador `LocalStorageRepositorio implements RepositorioGastos`.
  CA: round-trip guardar→cargar idéntico. Dep: F2.5. *Patrón: Adapter.*
  *(Resultado: inyección de `Pick<Storage, ...>` → testeable con fake.)*
- **F3.2** ✅ Esquema versionado `{version: 1, meses: {...}}` + `migrar(datos)`.
  CA: datos v0 sin campo se migran sin pérdida. *Patrón: migración/versionado.*
  *(Resultado: `migrarEsquema` completa `estado:'pendiente'` y `categoria:'Otro'`
  conservando nombre/monto/disponibilidad; entradas inválidas se descartan sin
  romper las válidas.)*
- **F3.3** ✅ Manejo de errores explícitos: JSON corrupto → estado vacío + aviso;
  cuota excedida → error visible al usuario. CA: tests de cada fallo.
  *Buenas prácticas: nunca silenciar excepciones.*
  *(Resultado: `ErrorPersistencia{motivo: json-corrupto|cuota-excedida|
  storage-indisponible}`; corrupto además restaura esquema vacío para recuperarse.
  9 tests en `localStorageRepositorio.spec.ts`.)*
- **F3.4** ✅ Instancia única del repositorio inyectada en el store.
  CA: un solo punto de acceso. *Patrones: Singleton + inyección.*
  *(Resultado: `src/data/repositorio.ts` exporta `repositorioGastos`;
  el store la recibirá como dependencia con default en F4.1.)*
  *(CA global: `npm run check` exit 0 — 10 tests.)*

## Fase 4 — Presentación (MVVM reactivo) ✅ COMPLETADA

- **F4.1** ✅ `useGastosStore` (reactive): estado global + acciones delegadas al dominio.
  CA: acciones del store llaman solo a `domain/`. Dep: F2, F3. *MVVM.*
  *(Resultado: `crearStore(repositorio)` testeable + singleton `storeGastos`;
  saldo/totalPendiente/totalRealizado como getters sobre `calcularSaldo` del dominio;
  errores de persistencia → `estado.aviso` visible.)*
- **F4.2** ✅ `MonthPicker` (12 meses + persistencia del mes activo).
  CA: cambiar mes actualiza saldo y lista. Dep: F4.1.
  *(Resultado: `SelectorMes.vue` + `preferenciasUsuario.ts`; verificado:
  mes nuevo → `0 gs` y lista vacía; volver al mes → `2.150.000 gs` recuperado.)*
- **F4.3** ✅ `BalanceHeader`: saldo grande, formato `2.500.000 gs` (Intl/es-PY).
  CA: formato correcto con miles. *Patrón: formateador compartido en `shared/`.*
  *(Resultado: `EncabezadoSaldo.vue` + `shared/formato.ts`; verificado en screenshot.
  Extra fuera de plan: campo editable de "Disponibilidad que cobrás" (lo pide la
  necesidad: registrar la disponibilidad total).)*
- **F4.4** ✅ `ExpenseForm`: nombre, monto, categoría; validación en línea y reset al
  enviar. CA: no envía inválido; error visible. Dep: F4.1. *DRY con F2.2.*
  *(Resultado: `FormularioGasto.vue` captura `ErrorValidacionGasto` y muestra el
  error junto al campo; reset tras envío verificado.)*
- **F4.5** ✅ `ExpenseList` + `ExpenseItem`: chip **ámbar pendiente / verde realizado**;
  un toque alterna estado y el saldo se recalcula al instante.
  CA: tap cambia color y descuento en la misma sesión de render. Dep: F4.1.
  *(Verificación visual con **playwright**: screenshot 390×844 + clic en el chip.)*
  *(Resultado: `ListaGastos.vue` + `ElementoGasto.vue`; CAs verificadas con script
  `scripts/verificar-ui.mjs` + inspección de capturas: chip PENDIENTE→REALIZADO,
  clase `gasto--pendiente`→`gasto--realizado`, saldo 2.500.000→2.150.000 gs,
  0 errores de consola.)*
- **F4.6** ✅ Filtros: todos/pendientes/realizados + contador. CA: filtra sin mutar datos.
  *(Resultado: `BarraFiltros.vue` con contadores; `filtrarGastos` devuelve copia;
  verificado: Todos 1/Pendientes 1/Realizados 0 → tras pagar: 1/0/1.)*
- **F4.7** ✅ `App.vue` solo orquesta componentes; estado de carga/error global.
  CA: `vue-tsc` limpio. *Composición > herencia.*
  *(Resultado: banner de aviso `role="alert"`, estado "Cargando…", pie offline.
  CA global: `npm run check` exit 0 — 10 tests.)*

**Nota MCP**: los tools de Playwright/Chrome cargan al iniciar opencode; con la
activación hecha a mitad de sesión no estaban disponibles, así que la verificación
visual se hizo con **Playwright vía script + Edge del sistema** (`scripts/verificar-ui.mjs`).
En la próxima sesión los MCP ya estarán disponibles para inspección interactiva.

## Fase 5 — Tests (TDD) ✅ COMPLETADA

- **F5.1** ✅ Vitest: tests de `calcularSaldo`, `alternarEstado`, `crearGasto` (borde:
  monto 0, saldo negativo, ids duplicados). CA: verdes. Dep: F2.
  *(Resultado: `gastos.spec.ts` (15) + `mes.spec.ts` (9): monto 0/negativo/NaN,
  saldo negativo, inmutabilidad, 50 ids únicos, `claveMes` inválido → RangeError.)*
- **F5.2** ✅ Tests del repositorio con storage mockeado (incl. F3.3). CA: verdes.
  *(Resultado: cumplida en Fase 3 con `localStorageRepositorio.spec.ts` (9 tests);
  helper unificado en `__tests__/ayudas.ts`.)*
- **F5.3** ✅ Tests de componentes clave (`ExpenseItem` toggle, `ExpenseForm`).
  CA: verdes. Dep: F4.
  *(Resultado: `interfaz.spec.ts` (5): alta desde formulario, validación con error
  inline, toque pendiente→realizado con descuento 2.500.000→2.150.000 gs,
  filtros con contadores, cambio de mes con ida y vuelta.)*
- **F5.4** ✅ Cobertura ≥80% en `src/domain/` + gate en `npm run check`.
  CA: reporte ≥80%. *Patrón: puerto/antitest en dominio.*
  *(Resultado: **96,15% stmts / 96% branch / 100% funcs** con `@vitest/coverage-v8`
  4.1.11; `check` = lint + type-check + `test:cov` con thresholds 80 en `vitest.config.ts`.)*
  *(CA global: `npm run check` exit 0 — **39 tests**.)*

## Fase 6 — Integración Android ✅ COMPLETADA

- **F6.1** ✅ `npx cap add android`. CA: carpeta `android/` generada. Dep: F0.4, F0.5.
  *Requiere `npm i @capacitor/android` previo; platform added + web assets copiados.*
- **F6.2** ✅ `gradle.properties`: `org.gradle.jvmargs=-Xmx1536m`, daemon+parallel.
  CA: build no supera 1,5 GB heap. *Mitigación RAM 5,9 GB.*
  *Xmx1536m ya venía en el template; habilitados `org.gradle.parallel=true` y `org.gradle.daemon=true`.*
- **F6.3** ✅ Configurar `applicationId`, nombre "Gastos", ícono y splash.
  CA: valores visibles en `AndroidManifest.xml`. Dep: F6.1.
  *`capacitor.config.ts` → `appId: py.gastos.mensuales`, `appName: Gastos`; applicationId+namespace
  en `app/build.gradle`, label `@string/app_name`=Gastos; ícono "G" azul pizarra + splash "Gastos"
  (System.Drawing + `@capacitor/assets` → 87 recursos en `res/`).*
- **F6.4** ✅ `npx cap sync android`. CA: "Copied native ..." sin errores.
  Dep: F6.1. *Repetible tras cada cambio web.* *(Resultado: sync 0.169s, exit 0.)*

## Fase 7 — APK (debug y release) ✅ COMPLETADA

- **F7.1** ✅ `.\android\gradlew.bat assembleDebug`.
  CA: exit 0 y existe `android\app\build\outputs\apk\debug\app-debug.apk`.
  Dep: F6.4. *Objetivo intermedio: APK instalable ya.*
  *(Resultado: ejecutar desde workdir `android/` —gradlew no cambia de dir—; APK 4,7 MB,
  `aapt2`: package `py.gastos.mensuales`, label `Gastos`, minSdk 24.)*
- **F7.2** ✅ Keystore: `keytool -genkeypair -v -keystore gastos.jks -alias gastos
  -keyalg RSA -keysize 2048 -validity 10000`. CA: archivo creado, contraseña
  guardada en nota fuera del repo (¡nunca commitear secretos!). Dep: F7.1.
  *(Resultado: `gastos.jks` creado; contraseña de 24 chars en
  `C:\proyectos-code\gastos-keystore-nota.txt`, fuera del repo.)*
- **F7.3** ✅ `signingConfigs` de release en `app/build.gradle` leyendo propiedades
  desde `gradle.properties` local (gitignored). CA: `assembleRelease` compila.
  Dep: F7.2. *Buenas prácticas: secretos fuera del VCS.*
  *(Resultado: props en `android/gradle.properties` + gitignore de `gastos.jks` y
  `android/gradle.properties`.)*
- **F7.4** ✅ `.\android\gradlew.bat assembleRelease`. CA: `app-release.apk` firmada
  en `outputs/apk/release/`. Dep: F7.3. *(Resultado: BUILD SUCCESSFUL 1m45s, 3,5 MB.)*
- **F7.5** ✅ Verificar APK (tamaño, `apksigner verify` si disponible, nombre de
  paquete). CA: APK válida. Dep: F7.4.
  *(`apksigner verify` exit 0, cert CN=Gastos SHA-256 `bb443c07…`; package y label OK.)*

## Fase 8 — QA final y entrega ✅ COMPLETADA

- **F8.1** ✅ `npm run check` completo en verde. CA: lint+typecheck+tests OK.
  *(Resultado: exit 0 — 39 tests, cobertura dominio 96,15%.)*
- **F8.2** ✅ Revisión con skill `code-review-and-quality` sobre el diff completo.
  CA: hallazgos críticos corregidos. Dep: F8.1.
  *(Resultado: revisión manual 5 ejes (el subagente paralelo se abortó; se hizo
  lectura directa). Veredicto: **APPROVE** — 0 críticos; 3 opcionales + 3 nits
  diferidos con justificación en la tabla F8.4. Positivos: toggle con `<button>`
  + `aria-pressed`, salidas escapadas, dominio puro sin deps, secretos fuera del repo.
  Lighthouse/chrome-devtools no disponible a mitad de sesión (MCPs cargan al inicio).)*
- **F8.3** ✅ Checklist vs. necesidad: alta de gastos, pendiente/realizado con toque,
  cambio de color, descuento automático, saldo inicial, selector de meses,
  persistencia, offline, configuración. CA: todo ✔.
  *(Resultado: `scripts/checklist-f8.mjs` con Playwright+Edge → **12/12 OK**:
  color ámbar `rgb(254,243,199)`→verde `rgb(220,252,231)`, 0 solicitudes externas.
  Sin dispositivo conectado: no se probó APK en celular.)*
- **F8.4** ✅ Registro de hallazgos y correcciones al final del documento.
  CA: tabla de estados cerrados.

## Fase 9 — Pulido UI (benchmark de apps reales) ✅ COMPLETADA

- Origen: informe QA sobre captura de dispositivo real + benchmark (recur, Kwilio,
  BillBox, Bill-Reminder, uxpatterns.dev, NN/g, Material Design) + docs oficiales
  vía Context7 (Vue: `v-model`/limpieza de timers; Vitest: `vi.useFakeTimers`).
- **F9.1** ✅ Píldoras del saldo en 2 líneas (etiqueta chica + valor) con
  `flex: 1` (H1). CA: "Pendiente 130.000 gs" no se parte en 360 px; test de
  componente verifica etiqueta y valor. Dep: ninguna.
- **F9.2** ✅ Unificar `realizado`→`pagado` en dominio, store, UI y CSS;
  `migrarGasto` acepta el legado `'realizado'` (H2). CA: 0 ocurrencias en `src/`
  salvo migración; dato v1 del celular migra a pagado sin pérdida (test).
  Dep: F9.1.
- **F9.3** ✅ Inputs de moneda `type="text"` + `inputmode="numeric"` con formato de
  miles en `blur` vía `Intl/es-PY` (H3). CA: escribir `2500000`, salir del campo
  y ver `2.500.000`; el submit guarda el número crudo. Dep: F9.2.
  *(Incidente: `pattern="[0-9]*"` bloqueaba el submit tras formatear; se quitó el
  `pattern` y la validación quedó en código con error inline en español.)*
- **F9.4** ✅ Borrado en 2 toques (confirmación inline "¿Eliminar?" roja con
  auto-reversión a 3 s, `aria-label` con nombre y monto) + área táctil 48 dp
  (H4). CA: 1 toque no borra; 2.º toque sí; revierte sola; tests con fake timers.
  Dep: F9.3.
- **F9.5** ✅ Control explícito ✓/☐ por fila + pista "Tocá un gasto para
  marcarlo como pagado" + tap-guard 350 ms (H5). CA: doble toque rápido alterna
  una sola vez (test). Dep: F9.4.
- **F9.6** ✅ Color por categoría (punto determinista por hash + oculta la
  categoría si es igual al nombre) (H6). CA: punto visible con color; "Ande/ANDE"
  ya no se duplica (tests). Dep: F9.5.
- CA global: `npm run check` exit 0 (**56 tests**, cobertura dominio 96,15%) +
  `scripts/verificar-ui.mjs` 6/6 CA en verde + inspección de capturas 390×844 y
  verificación interactiva con MCP Playwright (toggle, formato en blur, filtros).
- **F9.7** ✅ Rebuild `app-release.apk` con Fase 9 (`npm run build` + `cap sync` +
  `assembleRelease`, 3,46 MB). CA: bundle del APK contiene "Pagados/Tocá un
  gasto/¿Eliminar?"; `apksigner verify` OK con cert `bb443c07…` (mismo keystore).

## Fase 10 — Gastos recurrentes (feedback: copiar mes + editar monto) ✅ COMPLETADA

- Pedido: con 10 cuentas, reescribir todo cada mes toma mucho tiempo; copiar al
  mes siguiente, editar lo que varía (ANDE), eliminar lo que no aplica.
- Decisión: copiar + editar; **solo gastos** (la disponibilidad se carga a mano).
- **F10.1** ✅ Dominio: `mesSiguiente(clave)` (dic→ene), `nombreMes`,
  `clonarParaMes` (ids nuevos, siempre pendientes). CA: tests de cada borde.
- **F10.2** ✅ Store `copiarAlMesSiguiente()`: evita duplicados por nombre,
  guarda en destino sin tocar disponibilidad, deja `confirmacion` verde con
  "Ver mes". CA: tests con repositorio fake.
- **F10.3** ✅ UI copiar: botón "Copiar N a {mes}" + banner confirmación.
  CA: copiar dos veces no duplica; "Ver mes" muestra pendientes. Dep: F10.2.
- **F10.4** ✅ Editar gasto: dominio `editarGasto` (misma validación),
  store y edición inline por fila (✎, Guardar/Cancelar). CA: flujo con monto
  250.000→273.500 y error inline con 0. Dep: F10.3.
- **F10.5** ✅ Formulario colapsable: "Agregar gasto" cerrado por defecto,
  se despliega al tocar y se cierra solo al guardar. CA: ocupa una fila cuando
  está cerrado; scripts de verificación actualizados. Dep: F10.4.
- CA global: `npm run check` exit 0 (**83 tests**, cobertura dominio 95,91%) +
  `scripts/verificar-ui.mjs` 6/6 CA en verde + inspección de capturas 390×844
  (colapsado, copiar, ✎ por fila).
- **F10.6** ✅ Rebuild `app-release.apk` con Fase 10 (3,47 MB). CA: bundle con
  "Copiar/Ver mes/¿Eliminar?/Guardar/Cancelar"; `apksigner verify` OK.
- **F10.7** ✅ Fila en 2 líneas (anatomía M3: titular envolvente + monto
  trailing fijo + sublínea chip/categoría). CA: nombre largo legible sin
  colisión en 360 px (verificado con datos reales del usuario). Dep: F10.5.
- **F10.8** ✅ Versionado: `package.json` 1.0.4 + `versionCode 4` +
  APK `gastos mensuales v1.0.4.apk` + versión en el pie. CA: aapt2 muestra
  versionCode 4/versionName 1.0.4; firma OK.

## Historial de releases

`versionCode` = n.º de build (1: APK del viernes, 2: rebuild Fase 9, 3: rebuild
Fase 10 — esos tres salieron sin versionar como `app-release.apk` 1.0).
Desde 1.0.4 cada build lleva su versión en el nombre del APK y en el pie.

| Versión | code | Contenido | APK |
|---|---|---|---|
| 1.0.4 | 4 | F10.7 (fila 2 líneas) + versionado formal | `gastos mensuales v1.0.4.apk` |
| 1.0.5 | 5 | F11.1 (editor de ingreso inline en el saldo) | `gastos mensuales v1.0.5.apk` |
| 1.0.6 | 6 | Texto "Exportar a {mes}" (vocabulario del usuario) | `gastos mensuales v1.0.6.apk` |
| 1.0.7 | 7 | Icono launcher ₲ (unificado con marca in-app) + marca SVG en cabecera | `gastos mensuales v1.0.7.apk` |

Checklist de release (repetir en cada versión): bump en `package.json` +
  `android/app/build.gradle` (`versionCode`, `versionName`) + `src/version.ts`;
  `npm run build` + `npx cap sync android` + `assembleRelease`; verificar nombre,
  `aapt2 dump badging` y `apksigner verify`.

## Fase 11 — Editor de ingreso inline en el saldo ✅ COMPLETADA

- Pedido: la zona "Disponibilidad que cobrás" + input + Guardar ocupa mucho;
  tocar el número de DISPONIBLE DEL MES para editar.
- Decisión de diseño: el saldo es calculado (ingreso − pagados), así que al tocar
  la etiqueta cambia a "INGRESO DEL MES" y se edita el ingreso (nunca el saldo);
  al guardar/cancelar vuelve a mostrar el disponible. Sin bloque permanente.
- **F11.1** ✅ Saldo tocable → editor inline de ingreso con Guardar/
  Cancelar + error inline. CA: flujo tocar→editar→guardar y cancelar sin
  guardar; scripts actualizados. Dep: ninguna.
- CA global: `npm run check` exit 0 (**86 tests**, cobertura 95,91%) +
  `scripts/verificar-ui.mjs` 6/6 CA en verde + captura 390×844 (tarjeta
  compacta sin bloque permanente).
- **F11.2** ✅ Rebuild `gastos mensuales v1.0.5.apk` con Fase 11.
  CA: aapt2 code 5/name 1.0.5; firma OK. Dep: F11.1.
- **F11.3** ✅ Rebuild `gastos mensuales v1.0.6.apk` con texto Exportar.
  CA: aapt2 code 6/name 1.0.6; firma OK. Dep: F11.2.
- **F11.4** ✅ Marca SVG en cabecera (moneda ₲ con anillo azul, `aria-hidden`).
  CA: captura 390×844 revisada; check verde. Dep: F11.3.
- **F11.5** ✅ Rebuild `gastos mensuales v1.0.7.apk` con icono ₲.
  CA: launcher `mipmap-xxxhdpi` con moneda; aapt2 code 7/name 1.0.7; firma OK.
  Dep: F11.4.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| RAM 5,9 GB agota Gradle | heap 1,5 GB (F6.2); reintentar con 1 GB |
| JDK 22 incompatible | fallback Temurin 17 (F0.6) |
| Descargas bloqueadas | URLs oficiales verificadas (F0.1) |
| Secretos en repos | keystore/gitignore en F7.3 |

## Terminado global

F0–F8 completas + `app-release.apk` firmada generada + checklist F8.3 en verde.

---

## Hallazgos y correcciones (F8.4)

Revisión 5 ejes (corrección, legibilidad, arquitectura, seguridad, rendimiento).
Veredicto: **APPROVE** — sin críticos.

| # | Severidad | Ubicación | Hallazgo | Acción |
|---|---|---|---|---|
| 1 | Opcional | `src/presentation/gastosStore.ts:36` | `esClaveValida` (regex) duplica `esMesValido` (`src/domain/mes.ts:3`): dos fuentes de verdad para el formato de mes | Diferido: extraer `mesDesdeClave` en dominio cuando haya un tercer uso |
| 2 | Opcional | `src/data/localStorageRepositorio.ts:37` | `migrarGasto` acepta monto negativo / nombre vacío de un JSON manipulado (frontera no validada) | Diferido: riesgo bajo, datos solo locales del propio usuario |
| 3 | Opcional | `src/data/repositorio.ts:4` | `window.localStorage` se accede al importar el módulo; si el WebView lo bloquea, falla antes de cualquier try/catch | Diferido: no ocurre en Capacitor Android; factory perezosa si se porta a web |
| 4 | Nit | `src/presentation/gastosStore.ts:98-112` | `saldo`/`totalPendiente`/`totalRealizado` recorren el array 3 veces por render | Diferido: listas de decenas de gastos, costo despreciable |
| 5 | Nit | `src/App.vue:30` | `estado.cargando` es vestigial (la carga es síncrona, "Cargando…" nunca se muestra) | Diferido: reservado para futura fuente async |
| 6 | Nit | `src/domain/gastos.ts:30` | `datos.categoria.trim()` calculado dos veces | Diferido: trivial |
| 7 | Info | `scripts/checklist-f8.mjs` | Playwright no tiene `.trigger()` (API de Vue Test Utils); se usan clics reales | Corregido durante F8.3 |
| 8 | Info | Checklist F8.3 | 2 FAIL iniciales por expectativas stale del script (esperaba 2.500.000 con gasto realizado) | Corregido: expectativas a 2.150.000; app correcta |

Positivos verificados: toggle con `<button>` real + `aria-pressed`/`aria-label`
(`ElementoGasto.vue:13-19`); salidas escapadas con `{{ }}`; dominio puro sin
dependencias; secretos fuera del repo (`.gitignore` + nota externa).
