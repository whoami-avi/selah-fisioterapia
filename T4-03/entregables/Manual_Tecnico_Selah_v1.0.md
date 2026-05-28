# Manual Técnico

**Sistema:** Selah Fisioterapia & Recovery
**Versión:** v1.0
**Fecha:** 27 de mayo de 2026
**Tecnologías:** HTML5 / CSS3 / JavaScript ES6+ (vanilla, sin framework) · Supabase (PostgreSQL 15 + Realtime + Auth) · Service Worker (PWA) · Playwright (testing E2E)
**Equipo:** TecHome dev's
- Jefte Abimael López Jarquín — Líder técnico / Backend / Seguridad ([@whoami-avi](https://github.com/whoami-avi))
- Francisco Javier Jijón Cruz — Frontend / UX / Realtime
- Adrián de Jesús Avendaño — QA / Testing / Validaciones
- Perla Emigdalia García Castellanos — Documentación / Capacitación / Plantillas
**Repositorio:** https://github.com/whoami-avi/selah-fisioterapia
**Despliegue:** Cloudflare Pages — https://pyshiomanager.online

---

## 0. Portada

| | |
|---|---|
| **Sistema** | Selah Fisioterapia & Recovery |
| **Versión** | v1.0 |
| **Fecha** | 27 de mayo de 2026 |
| **Tecnologías** | Frontend: HTML5, CSS3, JavaScript ES6+ vanilla · Backend/DB: Supabase (PostgreSQL 15) · CDN/SDK: `@supabase/supabase-js v2` · Hosting: Cloudflare Pages · Testing: Playwright + Jest · PWA: Service Worker + Manifest |

---

## 1. Arquitectura y módulos

### 1.1. Vista general

```
┌─────────────────────────┐         ┌──────────────────────────┐         ┌─────────────────────────┐
│  Navegador / PWA        │ ◀────▶ │  Supabase (PostgreSQL)   │ ◀────▶ │  Realtime WebSocket     │
│  HTML + JS vanilla      │  REST   │  + RLS + Auth + Storage  │  WS     │  (postgres_changes)     │
│  Service Worker (PWA)   │         │                          │         │                         │
└──────────┬──────────────┘         └──────────────────────────┘         └─────────────────────────┘
           │ fallback offline (sin conexión)
           ▼
┌─────────────────────────┐
│  localStorage           │  cola de operaciones pendientes
│  (sync al volver online)│
└─────────────────────────┘
```

### 1.2. Módulos del frontend (`physio-manager/app.js`, 3 034 líneas)

| Módulo (sección de `app.js`) | Líneas aprox. | Responsabilidad |
|------------------------------|---------------|-----------------|
| **Inicialización & versionado** | 1-200 | Bootstrap, conexión a Supabase, registro del Service Worker, control de versiones internas. |
| **Supabase Service (CRUD)** | 200-690 | Funciones `save/update/delete...InSupabase()` para pacientes, citas, plantillas, mensajes y usuarios. Mapeo DB↔App con `mapAppointmentFromSupabase()`. |
| **Auth & usuarios** | 700-1080 | `handleLogin()`, `handleLogout()`, gestión de usuarios (admin), roles. |
| **Dashboard & realtime** | 1800-2000 | `renderDashboard()`, suscripciones `postgres_changes`, contadores y "Próximo paciente". |
| **Pacientes** | 2100-2400 | CRUD con renderizado de tarjetas y modal de creación/edición. |
| **Citas (Calendario)** | 2400-2700 | Agenda semanal, modal de cita con spinner, validaciones HTML5. |
| **Finanzas (solo admin)** | 1100-1300 | Cálculos de ingresos, gráficos Chart.js, métodos de pago. |
| **WhatsApp & plantillas** | 1370-1500 | Construcción de URL `wa.me/...`, sustitución de variables, registro en `messages`. |
| **Sincronización offline** | 1600-1700 | Push/Pull de cola pendiente en localStorage. |
| **UI helpers** | 2800-3034 | Toasts, formatos de fecha/hora, indicador de conexión. |

### 1.3. Dependencias externas

| Dependencia | Versión | Uso | Tipo |
|-------------|---------|-----|------|
| `@supabase/supabase-js` | ^2.39 | Cliente JS de Supabase (REST + Realtime + Auth) | CDN + npm (para tests) |
| `chart.js` | ^4.4 | Gráficos del Dashboard financiero | CDN |
| `@playwright/test` | ^1.42 | Pruebas E2E del flujo de citas | npm (dev) |
| Service Worker propio | `sw.js` | Cache offline, instalación PWA | nativo |
| Cloudflare Pages | — | Hosting estático + HTTPS + dominio `pyshiomanager.online` | externo |
| Supabase (free tier) | PostgreSQL 15 | DB, RLS, Realtime | externo |

---

## 2. Requisitos del entorno

### 2.1. Para desarrollo local

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **Sistema operativo** | Windows 10 · macOS 12 · Ubuntu 20.04 | Windows 11 · macOS 14 · Ubuntu 22.04 |
| **Node.js** | 16.x (solo para tests y scripts de diagnóstico) | 20.x LTS |
| **Python** | 3.7+ (solo para servidor estático local) | 3.11 |
| **Yarn o npm** | yarn 1.22 / npm 9 | yarn 1.22 |
| **Navegador** | Chrome 90 / Firefox 88 / Safari 14 / Edge 90 | Chrome 121 |
| **Cuenta Supabase** | Free tier (proyecto creado) | Free tier |
| **Git** | 2.30+ | 2.43+ |

### 2.2. Para producción (cliente final)

| Componente | Requisito |
|------------|-----------|
| Navegador de los usuarios | Chrome 121+ · Edge 121+ · Firefox 124+ · Safari 17+ |
| Conexión | Internet 1 Mbps (offline ok después del primer login) |
| Dispositivo | PC, laptop, tablet o smartphone con pantalla ≥ 360 px |

---

## 3. Instalación y ejecución (paso a paso)

### 3.1. Clonar el repositorio

```bash
git clone https://github.com/whoami-avi/selah-fisioterapia.git
cd selah-fisioterapia/physio-manager
```

### 3.2. Configurar credenciales de Supabase

Editar `physio-manager/app.js` líneas 8-9:

```javascript
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOi...TU_ANON_KEY...';
```

> La `anon key` es pública por diseño (se expone al navegador). La seguridad real la dan las **políticas RLS** del paso 4.

### 3.3. Instalar dependencias (solo para tests y scripts)

```bash
yarn install              # o: npm install
npx playwright install chromium   # solo si vas a correr tests E2E
```

### 3.4. Levantar el servidor local

**Opción A — Python (sin dependencias adicionales):**

```bash
python3 -m http.server 8099
```

**Opción B — Node `serve`:**

```bash
npx serve -p 8099
```

### 3.5. Abrir en el navegador

```
http://localhost:8099
```

### 3.6. Iniciar sesión de prueba

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `selah2024` |
| Asistente | `selah` | `fisio123` |

---

## 4. Base de datos

### 4.1. Esquema (tablas, PK / FK, índices)

| Tabla | Descripción | PK / FK | Índices |
|-------|-------------|---------|---------|
| **`patients`** | Pacientes registrados con historial médico, contacto y emergencia. | `id` UUID (PK) | `name`, `phone` (búsqueda rápida) |
| **`appointments`** | Citas: fecha, hora, duración, terapia, estado, cobro. | `id` UUID (PK), `patient_id` (FK → patients.id, **ON DELETE CASCADE**) | `date`, `status`, `pago_estado` |
| **`users`** | Usuarios del sistema con rol admin/asistente. | `id` UUID (PK), `username` UNIQUE, `email` UNIQUE | `username`, `email` |
| **`templates`** | Plantillas de WhatsApp con variables `{nombre}`, `{fecha}`, `{hora}`, `{terapia}`. | `id` UUID (PK) | — |
| **`messages`** | Historial de mensajes WhatsApp enviados. | `id` UUID (PK), `patient_id` (FK → patients.id, **ON DELETE SET NULL**) | `sent_at` |

### 4.2. Scripts SQL

**`schema.sql`** (creación de tablas — ejecutar en SQL Editor de Supabase):

```sql
-- Pacientes
CREATE TABLE IF NOT EXISTS public.patients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    phone           TEXT,
    email           TEXT,
    treatment       TEXT,
    body_zone       TEXT,
    sessions        INTEGER DEFAULT 0,
    medical_history TEXT,
    reason          TEXT,
    emergency_name  TEXT,
    emergency_phone TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Citas
CREATE TABLE IF NOT EXISTS public.appointments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    date          DATE NOT NULL,
    time          TIME NOT NULL,
    duration      INTEGER DEFAULT 60,
    type          TEXT,
    status        TEXT DEFAULT 'pending',
    costo         NUMERIC(10,2) DEFAULT 0,
    metodo_pago   TEXT,
    pago_estado   TEXT DEFAULT 'pending',
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios
CREATE TABLE IF NOT EXISTS public.users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT,
    role          TEXT DEFAULT 'asistente',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Plantillas WhatsApp
CREATE TABLE IF NOT EXISTS public.templates (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes enviados
CREATE TABLE IF NOT EXISTS public.messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    message    TEXT NOT NULL,
    sent_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_patients_name  ON public.patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_appt_date      ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appt_status    ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appt_pago      ON public.appointments(pago_estado);
```

**`supabase_rls_appointments.sql`** (políticas de seguridad — ejecutar después):

```sql
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_appointments" ON public.appointments
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_appointments" ON public.appointments
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_appointments" ON public.appointments
  FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_delete_appointments" ON public.appointments
  FOR DELETE TO anon USING (true);
```

> Repetir el mismo patrón para `patients`, `templates`, `messages` y `users`.

**`seed.sql`** (datos iniciales mínimos):

```sql
INSERT INTO public.users (username, email, password_hash, name, role)
VALUES
  ('admin', 'admin@selah.com', 'selah2024', 'Administrador',  'admin'),
  ('selah', 'info@selah.com',  'fisio123',  'Selah Fisio',    'asistente')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.templates (name, message) VALUES
  ('Confirmación cita', 'Hola {nombre}! Te confirmo tu cita el {fecha} a las {hora}. 📅'),
  ('Recordatorio 24h',  'Hola {nombre}, te recuerdo que mañana a las {hora} tienes tu sesión de {terapia}.'),
  ('Bienvenida',        'Hola {nombre}, bienvenido/a a Selah Fisioterapia. 👋'),
  ('Pago pendiente',    'Hola {nombre}, te recuerdo que tienes un pago pendiente de $ {costo}.')
ON CONFLICT DO NOTHING;
```

### 4.3. Verificación de la conexión y RLS

```bash
cd physio-manager
SUPABASE_URL=https://TU-PROYECTO.supabase.co \
SUPABASE_ANON_KEY=TU_ANON_KEY \
node check_rls.js
```

**Output esperado:**

```
🔍 1) Listando pacientes...        3 paciente(s) leídos
🔍 2) Listando citas existentes...  0 cita(s) leídas
🔍 3) Intentando INSERT...          ✅ Insert OK.
🔍 4) SELECT post-INSERT...         ✅ Cita leída correctamente.
🔍 5) DELETE de la cita de prueba... ✅ Delete OK.
```

Si aparece `42501: new row violates row-level security policy` → ejecutar de nuevo `supabase_rls_appointments.sql` (paso 4.2).

---

## 5. Operación y mantenimiento

### 5.1. Respaldo (backup)

| Recurso | Frecuencia | Método |
|---------|------------|--------|
| **Base de datos Supabase** | Diario automático (plan free) | Dashboard Supabase → Database → Backups (retención 7 días). |
| **Backup manual** | Semanal (recomendado) | `pg_dump` via Supabase CLI: `supabase db dump --db-url <CONN_STRING> > backup_$(date +%F).sql`. |
| **Código fuente** | Cada commit | GitHub conserva todo el historial; usar `git tag v1.0` para puntos estables. |
| **localStorage de usuario** | Continuo | Persiste como caché entre sesiones; se reconcilia con la nube vía realtime. |

### 5.2. Restore

```bash
# Restaurar desde un dump SQL
psql "postgresql://user:pass@db.TU-PROYECTO.supabase.co:5432/postgres" < backup_2026-05-27.sql

# O usar el Dashboard de Supabase: Database → Backups → seleccionar fecha → Restore
```

### 5.3. Monitoreo y logs

| Componente | Dónde ver logs |
|------------|----------------|
| Frontend (errores JS) | DevTools del navegador (`F12`) → Console. Errores graves se reportan al admin vía `showToast(..., 'error')`. |
| Service Worker | DevTools → Application → Service Workers (estado, cache, errores). |
| Supabase | Dashboard → Logs → API / Postgres / Realtime. Filtrar por código de error (ej. 42501). |
| Cloudflare Pages | Dashboard → tu sitio → Functions / Analytics → Logs en vivo de cada deploy. |
| Realtime | Dashboard Supabase → Realtime → Inspector (canales activos, mensajes/seg). |

### 5.4. Manejo de errores en código

- **Try/catch** en todas las funciones `*InSupabase()` (líneas 200-690 de `app.js`).
- Errores se loggean con `console.error('Error <contexto>:', error)` y se notifican al usuario con `showToast(..., 'error')`.
- Si el INSERT falla, la app cae al **fallback local** (push al array `appointments` + persistencia en localStorage) para no perder el dato del usuario.
- Códigos de error PostgreSQL comunes: `42501` (RLS violation), `23505` (unique violation), `23503` (foreign key violation).

---

## 6. Seguridad básica

### 6.1. Gestión de credenciales

- **Supabase anon key**: pública por diseño. Va en `app.js`. La seguridad real la dan las RLS policies.
- **Service role key**: ⚠️ **NUNCA** debe estar en el frontend. Solo se usa en scripts de mantenimiento del backend.
- **Contraseñas de usuarios**: actualmente en texto plano en la tabla `users.password_hash` (ver INC-006). **Migración a `supabase.auth` con bcrypt está planeada para v1.1**.

### 6.2. Roles y permisos

| Rol | Pacientes | Citas | Dashboard | Finanzas | WhatsApp | Usuarios |
|-----|:---------:|:-----:|:---------:|:--------:|:--------:|:--------:|
| **admin** | ✅ CRUD | ✅ CRUD | ✅ | ✅ | ✅ | ✅ CRUD |
| **asistente** | ✅ CRUD | ✅ CRUD | ✅ (sin ingresos) | ❌ | ✅ | ❌ |

El renderizado condicional ocurre tanto en la UI (sidebar) como en las funciones (`if (currentUserRole !== 'admin') return;`).

### 6.3. Validación de entradas

- HTML5 native (`required`, `type="email"`, `type="tel"`, `type="number"`, `min`, `max`).
- Sanitización adicional: **pendiente** (ver INC-007, planificada para v1.1 con DOMPurify).
- Validación de UUIDs antes de cada INSERT/UPDATE con `crypto.randomUUID()`.

### 6.4. Cifrado / TLS

- **HTTPS forzado** en Cloudflare Pages (cert SSL automático Let's Encrypt).
- Comunicación con Supabase: TLS 1.2+ obligatorio (lo enforza el SDK).
- Datos en reposo: cifrados por Supabase (PostgreSQL con `pgcrypto`).

### 6.5. Riesgos conocidos y mitigación (al cierre v1.0)

| Riesgo | Severidad | Mitigación actual | Cierre en |
|--------|-----------|--------------------|-----------|
| Passwords en texto plano (INC-006) | 🔴 Crítica | Acceso limitado a 2 usuarios internos confiables; URL no compartida públicamente. | v1.1 — migrar a `supabase.auth` |
| XSS por `innerHTML` (INC-007) | 🟠 Alta | Sin inputs públicos; solo usuarios autenticados pueden escribir. | v1.1 — `textContent` + DOMPurify |
| RLS faltante en otras tablas | 🟡 Media | Solo `appointments` tiene RLS. `patients`, `users`, etc. usan `anon key` con `public access`. | v1.1 — replicar policies a todas las tablas |

---

## 7. Despliegue y reversión

### 7.1. Proceso de despliegue (Cloudflare Pages)

1. **Push a `main`** en GitHub:
   ```bash
   git add .
   git commit -m "v1.0 release final"
   git tag v1.0
   git push origin main --tags
   ```
2. **Cloudflare Pages** detecta el push y construye automáticamente:
   - Production branch: `main`
   - Build command: *(vacío — sitio estático)*
   - Build output directory: `physio-manager`
3. En ≤ 90 segundos, el sitio `https://pyshiomanager.online` apunta a la nueva versión.
4. Verificar manualmente:
   - Login funciona (`admin`/`selah2024`).
   - `node check_rls.js` retorna ✅ los 5 pasos.
   - Test E2E pasa: `npx playwright test`.

### 7.2. Checklist pre-despliegue

- [ ] `npx playwright test` pasa localmente.
- [ ] `node check_rls.js` retorna ✅ los 5 pasos.
- [ ] No hay `console.error` en producción al cargar la app (DevTools limpio).
- [ ] Las variables `SUPABASE_URL` y `SUPABASE_KEY` apuntan al proyecto correcto.
- [ ] `git tag v1.0` creado y pusheado.
- [ ] Manual de usuario y técnico actualizados.

### 7.3. Plan de reversión

#### Reversión rápida (≤ 1 minuto)

1. Cloudflare Pages Dashboard → tu proyecto → **Deployments**.
2. Localizar el deploy anterior estable (etiquetado con el commit SHA).
3. Click en **...** → **Rollback to this deployment**.
4. Confirmar. En ~30 segundos el sitio vuelve a la versión previa.

#### Reversión de código (vía Git)

```bash
# Volver a la versión v1.0 y forzar push
git reset --hard v1.0
git push --force-with-lease origin main

# O hacer revert del commit problemático (más seguro, no reescribe historia)
git revert <SHA_PROBLEMA>
git push origin main
```

#### Reversión de base de datos

1. Dashboard Supabase → Database → **Backups**.
2. Seleccionar snapshot del día anterior al problema.
3. Click en **Restore**.
4. Confirmar (la operación tarda 5-10 minutos según el tamaño).
5. Verificar con `node check_rls.js` que los datos vuelven al estado esperado.

### 7.4. Testing automatizado

```bash
# Test E2E (Playwright headless Chromium)
cd physio-manager
npx playwright test
# Output esperado:
#   ✓  1 [chromium] › appointment.spec.js › Crear, editar y eliminar cita (4.8s)
#   1 passed (6.5s)

# Test de integración RLS
SUPABASE_URL=... SUPABASE_ANON_KEY=... node check_rls.js
```

### 7.5. Contacto del equipo de desarrollo

- **Issues / bugs:** https://github.com/whoami-avi/selah-fisioterapia/issues
- **Mantenedor / Líder técnico:** Jefte Abimael López Jarquín ([@whoami-avi](https://github.com/whoami-avi))
- **Equipo TecHome dev's:** Francisco Javier Jijón Cruz · Adrián de Jesús Avendaño · Perla Emigdalia García Castellanos
- **Mantenimiento futuro:** todo cambio se documenta en el `CHANGELOG.md` y se etiqueta con versión semver (`v1.x.y`).

---

**Fin del Manual Técnico — v1.0.**
