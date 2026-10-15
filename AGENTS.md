# AGENTS.md — Gastos Mensuales (`gastos-app`)

App Vue 3 + TS + Capacitor 8 (APK sin Android Studio). Plan y estado: `PLAN.md`.

## Convenciones (obligatorias)

- **Español** en identificadores, comentarios y UI.
- **Capas estrictas**: `src/domain/` (puro, sin imports de otras capas) →
  `src/data/` (adaptadores: `RepositorioGastos`) → `src/presentation/` (store MVVM +
  componentes) → `src/shared/` (utilidades). Nada de lógica de features en `shared/`.
- Errores de dominio tipados (`ErrorValidacionGasto`, `ErrorPersistencia` con `motivo`).
- TS estricto: `noUncheckedIndexedAccess` (usar helpers que lanzan en vez de `!`);
  oxlint prohíbe `expect` dentro de `catch` en tests (usar `capturarError` de
  `src/__tests__/ayudas.ts`) y spreads innecesarios al iterar.

## Gate de calidad

- `npm run check` = `lint` + `type-check` + `test:cov` (umbral **80%** en
  `src/domain/` vía `@vitest/coverage-v8`, fijado a la versión major de vitest).
- Todo cambio debe dejar `npm run check` en exit 0. Tests primero (TDD) para
  `domain/`; tests de componentes para flujos (alta, toggle, filtros, meses).

## Android / secretos

- `capacitor.config.ts`: `appId py.gastos.mensuales`, `appName Gastos`, `webDir dist`.
- Tras cambios web: `npm run build` + `npx cap sync android`.
- **Gradle se ejecuta con `android/` como cwd** (`gradlew.bat` no cambia de dir).
- Heap Gradle 1,5 GB (`org.gradle.jvmargs=-Xmx1536m`, laptop 5,9 GB RAM).
- **Nunca commitear secretos**: `gastos.jks` y `android/gradle.properties`
  (contiene `storePassword`) están en `.gitignore`; la contraseña vive fuera del
  repo (`..\gastos-keystore-nota.txt`).

## Progreso

- `PLAN.md` es la fuente de verdad: `✅` = tarea hecha con CA verificada.
- Toda release suma entrada en `CHANGELOG.md`, fila en Historial de releases y
  bump en `package.json` + `build.gradle` + `src/version.ts`.
- Scripts de verificación: `scripts/verificar-ui.mjs`, `scripts/checklist-f8.mjs`
  (Playwright + Edge, requieren `npm run dev` en puerto 5173).
