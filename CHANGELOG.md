# CHANGELOG — Gastos Mensuales

Historial de cambios por versión (formato: `versión (versionCode)`). Convención de
versionado en `PLAN.md` → Historial de releases.

## [1.0.7] — 2026-10-07 (code 7)

### Agregado
- Icono launcher con moneda ₲ (fondo azul noche, anillo azul), unificado con la
  marca de la cabecera; 87 recursos regenerados con `@capacitor/assets`.
- Marca SVG inline en la cabecera junto a "Gastos mensuales" (`aria-hidden`,
  0 KB extra).

## [1.0.6] — 2026-10-07 (code 6)

### Cambiado
- Botón "Copiar N a {mes}" → "Exportar N a {mes}" (vocabulario del usuario).

## [1.0.5] — 2026-10-07 (code 5)

### Cambiado
- La zona "Disponibilidad que cobrás" + input + Guardar (siempre visible,
  ~130 px) se reemplazó por saldo tocable: al tocar el número se abre el editor
  con etiqueta "INGRESO DEL MES", Guardar y Cancelar (✕); al guardar/cancelar
  vuelve a mostrar el disponible. Se edita siempre el ingreso, nunca el saldo
  calculado.

## [1.0.4] — 2026-10-07 (code 4)

### Agregado
- Filas de gasto en 2 líneas (anatomía Material Design 3: titular envolvente +
  monto trailing fijo + sublínea chip/categoría). Corrige truncamiento
  ("Gastos…", "Tarje…") y colisión nombre/monto ("Combu…100.000 gs").
- Versionado formal: APK `gastos mensuales vX.Y.Z.apk`, versión en el pie de la
  app (`src/version.ts`), `versionCode`/`versionName` en Gradle, tabla
  Historial de releases en `PLAN.md` + checklist de release.

## [1.0] — 2026-10-02 (code 1)

Primera APK instalada (Fases 0–F8): registro de disponibilidad mensual, alta de
gastos (nombre, monto, categoría), estados pendiente/pagado con un toque y
cambio de color, descuento automático del saldo, selector de meses, filtros
con contadores, persistencia offline en el celular, APK firmada sin Android
Studio.

### Rebuilds sin versionar (mismo code 1, `app-release.apk`)

- **2026-10-06 — Pulido UI (Fase 9):** píldoras del saldo en 2 líneas;
  terminología unificada pendiente/pagado (antes "realizado") con migración del
  dato guardado; inputs de moneda con miles en `blur` (`type="text"` +
  `inputmode`); borrado en 2 toques con auto-reversión + área táctil 48 dp;
  casilla ✓/☐ explícita + pista + tap-guard; color por categoría.
- **2026-10-06 — Recurrentes (Fase 10):** botón "Exportar N a {mes}" (copia al
  mes siguiente como pendientes, sin duplicar, sin tocar disponibilidad);
  edición inline por fila (✎ nombre/monto/categoría); formulario colapsable.
