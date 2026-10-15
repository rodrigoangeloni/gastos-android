# Gastos Mensuales — App Android (v1.0.7)

App para registrar pagos/gastos mensuales en guaraníes, 100% offline:
disponibilidad mensual editable tocando el saldo, lista en 2 líneas con estados
pendiente/pagado (un toque + cambio de color), descuento automático del saldo,
exportación de gastos al mes siguiente, edición inline por fila, filtros con
contadores y configuración por mes. Compilada a APK **sin Android Studio**
(Android SDK CLI + Gradle + Capacitor).

Plan completo de desarrollo: [PLAN.md](./PLAN.md).
Historial de cambios: [CHANGELOG.md](./CHANGELOG.md).

## Requisitos

- Node 22+ / npm
- JDK 17+ (instalado: JDK 22, `JAVA_HOME` configurado)
- Android SDK en `%LOCALAPPDATA%\Android\Sdk` (`ANDROID_HOME` configurado)
  - Paquetes: `platform-tools`, `platforms;android-35`, `build-tools;34.0.0`

## Comandos

| Comando | Descripción |
|---|---|
| `npm install` | Instalar dependencias |
| `npm run dev` | Servidor de desarrollo (Vite, puerto 5173) |
| `npm run check` | **Gate de calidad**: lint + type-check + tests **con cobertura** (umbral 80% en `src/domain/`) |
| `npm run test:unit` | Tests en modo watch (Vitest) |
| `npm run test:run` | Tests unitarios una vez |
| `npm run test:cov` | Tests con reporte de cobertura |
| `npm run build` | Build de producción web (`dist/`) |
| `node scripts/verificar-ui.mjs` | Verificación visual con Playwright (requiere `npm run dev` en puerto 5173) |
| `node scripts/checklist-f8.mjs` | Checklist end-to-end con Playwright (requiere `npm run dev` en puerto 5173) |

## Versiones y releases

Cada entrega versiona en 3 lugares (misma versión en los 3):
`package.json` + `android/app/build.gradle` (`versionCode`, `versionName`) +
`src/version.ts` (visible en el pie de la app). Detalle por versión:
[CHANGELOG.md](./CHANGELOG.md); checklist repetible en `PLAN.md` → Historial
de releases.

## APK

> **Importante:** `gradlew.bat` no cambia de directorio: los builds se ejecutan
> con `android/` como directorio de trabajo.

```powershell
# Tras cualquier cambio web:
npm run build
npx cap sync android

# Debug (desarrollo):
cd android; .\gradlew.bat assembleDebug; cd ..
# Salida: android\app\build\outputs\apk\debug\app-debug.apk (4,7 MB)

# Release firmada (la recomendada para instalar — ver PLAN.md F7.2/F7.3):
cd android; .\gradlew.bat assembleRelease; cd ..
# Salida: android\app\build\outputs\apk\release\gastos mensuales vX.Y.Z.apk
```

La release está firmada con `gastos.jks` (raíz del repo, gitignored) cuya
contraseña vive **fuera del repo** (`..\gastos-keystore-nota.txt`). Sin ambos no
se pueden firmar actualizaciones: guardá copias en un lugar seguro.

## Trasladar el proyecto a otra máquina

El empaquetado `gastos mensuales vX.Y.Z.zip` (junto al APK) incluye el código
fuente completo **sin** secretos ni compilados. En la máquina destino:

1. Requisitos: Node 22+ / npm, JDK 17+ (`JAVA_HOME`) y Android SDK
   (`ANDROID_HOME`) con `platform-tools`, `platforms;android-35`,
   `build-tools;34.0.0`.
2. Descomprimir el zip y entrar a la carpeta.
3. `npm ci` (instala dependencias exactas de `package-lock.json`).
4. Copiar **por separado y por un canal seguro** los 3 secretos (no viajan en
   el zip): `gastos.jks` → raíz del proyecto, `gradle.properties` → carpeta
   `android/`, y la nota con la contraseña fuera del repo.
5. `npm run check` (debe dar exit 0) y luego compilar el APK (sección anterior).

Nota: los datos de gastos viven en el celular (localStorage del WebView), no
se trasladan con el código.

La release está firmada con `gastos.jks` (raíz del repo, gitignored) cuya
contraseña vive **fuera del repo** (`..\gastos-keystore-nota.txt`). Sin ambos no
se pueden firmar actualizaciones: guardá copias en un lugar seguro.

## Estructura por capas

```
src/
  domain/        Reglas de negocio puras (tipos, cálculos, validaciones)
  data/          Adaptadores de persistencia (repositorios)
  presentation/  Componentes Vue y store
  shared/        Utilidades compartidas (formato de moneda, etc.)
```

## Stack

Vue 3 + TypeScript + Vite · Vitest + ESLint/OxLint · Capacitor 8 · Gradle (Android)
