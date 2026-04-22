# Selah Fisioterapia — PRD

## Original Problem Statement
"mi app de selah tiene bugs cuando genero una cita no se ve reflejada en el dashboard"
Repo: https://github.com/whoami-avi/selah-fisioterapia.git (subfolder `physio-manager`)

## Arquitectura
- **Frontend**: HTML + CSS + JavaScript vanilla (PWA con service worker)
- **Backend / DB**: Supabase (Postgres + Auth + Realtime)
- **Deploy**: GitHub Pages (CNAME)

## User Personas
- **Admin**: Accede a dashboard, finanzas, usuarios y configuración.
- **Asistente**: Gestiona pacientes, agenda y mensajería WhatsApp.

## Core Requirements
1. CRUD de pacientes y citas con persistencia en Supabase.
2. Dashboard con contadores en tiempo real (Citas hoy, Pacientes, Pendientes, Ingresos).
3. Suscripciones realtime para sincronizar entre dispositivos.
4. Modo offline con fallback a localStorage.
5. Roles (admin / asistente) con permisos diferenciados.

## Sesión 2026-04-22 — Bug fix "citas no aparecen en dashboard"

### Causa raíz
La tabla `appointments` en Supabase tiene RLS activo SIN policies de INSERT para el rol `anon`, por lo que cada creación falla con error `42501`. El código del front tenía además 3 bugs adicionales que impedían ver la cita incluso cuando el fallback local se activaba.

### Implementado
- **Fix #1** (`app.js:300`): `refreshCurrentSection()` ahora contempla las secciones `dashboard` y `finances` (estaba `finance`).
- **Fix #2** (`app.js:2446`): `saveAppointment()` espera al `save` asíncrono antes de llamar a `renderDashboard()`.
- **Fix #3** (`app.js:428`): `saveAppointmentToSupabase()` mapea los datos antes de pushear en el fallback.
- **Extra**: `deleteAppointment()` hace update optimista del array local.
- **Loading UX** (`app.js:2421` + `styles.css`): botón "Guardar" muestra spinner + "Guardando..." mientras la request está en vuelo. Todos los inputs se deshabilitan. Si falla, se restaura el estado y se muestra toast de error.
- **Script diagnóstico RLS** (`check_rls.js`): testea SELECT/INSERT/DELETE como anon y reporta códigos de error.
- **SQL RLS** (`supabase_rls_appointments.sql`): policies listas para pegar en Supabase SQL Editor.
- **Test E2E** (`tests/appointment.spec.js` + `playwright.config.js`): valida crear, editar y eliminar cita con dashboard reflejando cambios. **Pasando en 4.8s**.

### Validación
- ✅ Playwright headless con Supabase real: test pasa.
- ✅ Screenshot validación visual: cita aparece con contador "1", hora "2:30 PM" y paciente correcto.
- ⚠️  La cita NO persiste en Supabase hasta que apliques `supabase_rls_appointments.sql`.

## Backlog
### P0 (acción del usuario)
- Ejecutar `supabase_rls_appointments.sql` en Supabase SQL Editor para habilitar persistencia real.
- "Save to GitHub" para subir los cambios al repo.

### P1
- Aplicar el mismo patrón de loading + await a `savePatient` y `saveTemplate`.
- Detectar errores RLS en `saveAppointmentToSupabase` y mostrar toast específico en vez de silenciar con fallback.
- CI: correr `npx playwright test` en cada PR vía GitHub Actions.

### P2
- Tests unitarios para `mapAppointmentFromSupabase` y `renderDashboard` con Jest.
- Modo offline más explícito con indicador "Cambios pendientes de sincronizar".
