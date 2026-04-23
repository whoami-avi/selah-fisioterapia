# Selah Fisioterapia & Recovery — Release v0.1

![Release](https://img.shields.io/badge/release-v0.1-blue) ![Status](https://img.shields.io/badge/status-funcional-success) ![License](https://img.shields.io/badge/license-MIT-lightgrey)

Sistema de gestión integral para clínica de fisioterapia: pacientes, citas, finanzas y mensajería WhatsApp. PWA con sincronización en tiempo real mediante Supabase.

**🌐 Demo en vivo:** https://pyshiomanager.online (desplegado en Cloudflare Pages)

---

## 📋 Tabla de contenidos

- [Características](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Requisitos previos](#-requisitos-previos)
- [Instalación y ejecución](#-instalación-y-ejecución)
- [Configuración de la base de datos](#-configuración-de-la-base-de-datos)
- [Casos de Uso (CU)](#-casos-de-uso-implementados)
- [Evidencias de funcionamiento](#-evidencias-de-funcionamiento)
- [Testing automatizado](#-testing-automatizado)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Credenciales de prueba](#-credenciales-de-prueba)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Características principales

- 🩺 **Gestión de pacientes** — CRUD completo con historial médico, diagnóstico y contacto de emergencia.
- 📅 **Agenda y citas** — Calendario semanal/diario, recordatorios y estados de cita (pendiente, confirmada, completada, cancelada).
- 💰 **Dashboard financiero** — Ingresos del día, métodos de pago, estado de pagos (solo admin).
- 💬 **Mensajería WhatsApp** — Plantillas personalizables con variables (nombre, hora, terapia) y envío con un click.
- 👥 **Sistema de roles** — Admin (acceso total) y Asistente (pacientes + agenda + WhatsApp).
- 🔄 **Sincronización en tiempo real** — Realtime de Supabase para que múltiples dispositivos se mantengan sincronizados.
- 📱 **PWA instalable** — Funciona offline con fallback a localStorage y se puede instalar como app nativa.
- 🔒 **RLS (Row Level Security)** — Políticas en Supabase para proteger los datos a nivel de fila.

---

## 🏗️ Arquitectura

```
┌─────────────────────┐       ┌─────────────────────┐       ┌──────────────────────┐
│  Navegador / PWA    │──────▶│  Supabase (Postgres)│──────▶│  Realtime WebSocket  │
│  HTML + JS vanilla  │  REST │  tablas + RLS        │       │  (subscripciones)    │
│  Service Worker     │◀──────│  Auth + Storage      │◀──────│                      │
└─────────────────────┘       └─────────────────────┘       └──────────────────────┘
         │                              ▲
         │ Fallback offline             │
         ▼                              │
┌──────────────────────┐                │
│  localStorage        │────────────────┘
│  (sync cuando vuelve │   reintento al volver online
│   la conexión)       │
└──────────────────────┘
```

- **Frontend:** HTML + CSS + JavaScript vanilla, servido como sitio estático.
- **Backend/DB:** Supabase (PostgreSQL 15) con Row Level Security (RLS).
- **SDK:** `@supabase/supabase-js` v2 vía CDN (también instalable vía npm para los scripts de diagnóstico).
- **Hosting:** Cloudflare Pages (dominio: `pyshiomanager.online`).
- **CI/Testing:** Playwright (E2E).

---

## 🔧 Requisitos previos

- **Node.js** ≥ 16 (solo si vas a correr los scripts de diagnóstico o los tests E2E)
- **Python** ≥ 3.7 (para el servidor estático local, alternativa: `npx serve` o cualquier HTTP server)
- **Cuenta de Supabase** con un proyecto creado
- **Navegador moderno** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/whoami-avi/selah-fisioterapia.git
cd selah-fisioterapia/physio-manager
```

### 2. Configurar las credenciales de Supabase

Abre `app.js` y edita las líneas 8-9 con tus credenciales:

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU-ANON-KEY-AQUI';
```

> ⚠️ La `anon key` de Supabase se expone al navegador por diseño. La seguridad real la dan las **policies RLS** (ver sección [Configuración de la base de datos](#-configuración-de-la-base-de-datos)).

### 3. Ejecutar el servidor local

Opción A — Python (sin dependencias):
```bash
python3 -m http.server 8099
```

Opción B — Node con `serve`:
```bash
npx serve -p 8099
```

### 4. Abrir en el navegador

```
http://localhost:8099
```

### 5. Iniciar sesión

Usa las [credenciales de prueba](#-credenciales-de-prueba). Al primer login, si no hay conexión con Supabase, la app carga los usuarios por defecto y trabaja en modo offline con localStorage.

---

## 🗄️ Configuración de la base de datos

### Paso 1 — Crear las tablas en Supabase

Ejecuta este SQL en el **SQL Editor** de tu proyecto Supabase (`https://supabase.com/dashboard/project/<id>/sql/new`):

```sql
-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS public.patients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    phone           TEXT,
    email           TEXT,
    treatment       TEXT,                    -- tipo de terapia
    body_zone       TEXT,                    -- zona del cuerpo
    sessions        INTEGER DEFAULT 0,
    medical_history TEXT,
    reason          TEXT,
    emergency_name  TEXT,
    emergency_phone TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS public.appointments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    date          DATE NOT NULL,
    time          TIME NOT NULL,
    duration      INTEGER DEFAULT 60,        -- minutos
    type          TEXT,                      -- tipo de terapia
    status        TEXT DEFAULT 'pending',    -- pending | confirmed | completed | cancelled
    costo         NUMERIC(10,2) DEFAULT 0,
    metodo_pago   TEXT,
    pago_estado   TEXT DEFAULT 'pending',    -- pending | partial | paid
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS public.users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT,
    role          TEXT DEFAULT 'asistente',  -- admin | asistente
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de plantillas de WhatsApp
CREATE TABLE IF NOT EXISTS public.templates (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes enviados
CREATE TABLE IF NOT EXISTS public.messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    message    TEXT NOT NULL,
    sent_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Paso 2 — Aplicar las policies RLS

**Ejecuta el archivo [`supabase_rls_appointments.sql`](./supabase_rls_appointments.sql)** en el mismo SQL Editor. Este archivo habilita las policies para la tabla `appointments` (las más críticas). Para las otras tablas, aplica policies similares.

### Paso 3 — Verificar la conexión

Desde la carpeta `physio-manager/`, instala las dependencias y corre el script de diagnóstico:

```bash
yarn install       # o npm install
SUPABASE_URL=https://tuproyecto.supabase.co \
SUPABASE_ANON_KEY=tu-anon-key \
node check_rls.js
```

Deberías ver algo así:

```
🔍 1) Listando pacientes...
   3 paciente(s) leídos
🔍 2) Listando citas existentes...
   0 cita(s) leídas
🔍 3) Intentando INSERT de cita de prueba...
   ✅ Insert OK.
🔍 4) SELECT de la cita recién insertada...
   ✅ Cita leída correctamente tras insert.
🔍 5) DELETE de la cita de prueba...
   ✅ Delete OK.
```

Si aparece error `42501: new row violates row-level security policy` → vuelve al Paso 2.

---

## 📘 Casos de Uso implementados

Este release v0.1 implementa **5 casos de uso completos**, cada uno cubriendo el flujo completo UI → Lógica de negocio → Base de datos. Para el detalle completo de flujos, precondiciones y postcondiciones, ver [`CASOS_DE_USO.md`](./CASOS_DE_USO.md).

| # | Caso de Uso | Actor | Operaciones CRUD | Tabla(s) |
|---|-------------|-------|------------------|----------|
| **CU1** | Gestionar pacientes | Admin / Asistente | Create, Read, Update, Delete | `patients` |
| **CU2** | Agendar y gestionar citas | Admin / Asistente | Create, Read, Update, Delete | `appointments` |
| **CU3** | Visualizar Dashboard | Admin / Asistente | Read (agregaciones) | `appointments`, `patients` |
| **CU4** | Gestionar finanzas | Admin | Read (filtros/agregación), Update (estado de pago) | `appointments` |
| **CU5** | Enviar mensajes WhatsApp | Admin / Asistente | Read (plantillas), Create (mensaje enviado) | `templates`, `messages` |

---

## 📸 Evidencias de funcionamiento

Todas las capturas están en la carpeta [`evidencias/`](./evidencias/). Ver [`evidencias/README.md`](./evidencias/README.md) para el mapeo completo captura ↔ caso de uso.

Principales:

| Captura | Muestra |
|---------|---------|
| [`01_login.jpg`](./evidencias/01_login.jpg) | Pantalla de inicio de sesión |
| [`02_dashboard_inicial.jpg`](./evidencias/02_dashboard_inicial.jpg) | Dashboard con contadores en tiempo real |
| [`03_lista_pacientes.jpg`](./evidencias/03_lista_pacientes.jpg) | CU1 — Listado de pacientes |
| [`04_modal_nueva_cita.jpg`](./evidencias/04_modal_nueva_cita.jpg) | CU2 — Modal de creación de cita |
| [`05_formulario_cita_lleno.jpg`](./evidencias/05_formulario_cita_lleno.jpg) | CU2 — Formulario de cita con datos |
| [`06_cita_creada_dashboard.jpg`](./evidencias/06_cita_creada_dashboard.jpg) | CU3 — Dashboard refleja la nueva cita |
| [`10_agenda_calendario.jpg`](./evidencias/10_agenda_calendario.jpg) | CU2 — Vista de calendario |
| [`11_finanzas.jpg`](./evidencias/11_finanzas.jpg) | CU4 — Dashboard financiero |
| [`13_vista_movil_dashboard.jpg`](./evidencias/13_vista_movil_dashboard.jpg) | Responsive móvil |

---

## 🧪 Testing automatizado

El proyecto incluye tests E2E con **Playwright** que validan el flujo completo de creación/edición/eliminación de citas con reflejo inmediato en el dashboard.

### Ejecutar los tests

```bash
cd physio-manager
yarn install              # primera vez
npx playwright install chromium  # primera vez
npx playwright test
```

Output esperado:
```
Running 1 test using 1 worker
  ✓  1 [chromium] › tests/appointment.spec.js › Crear, editar y eliminar cita (4.8s)
  1 passed (6.5s)
```

El test levanta un servidor local con Python, abre Chrome headless, crea una cita, la edita, la elimina, y valida que el Dashboard se actualice correctamente en cada paso.

---

## 📁 Estructura del proyecto

```
physio-manager/
├── index.html                       # Entry point
├── app.js                           # Lógica principal (2970+ líneas)
├── styles.css                       # Estilos + tema claro/oscuro
├── sw.js                            # Service Worker (PWA offline)
├── manifest.json                    # Manifest de PWA
├── package.json                     # Deps: @supabase/supabase-js + @playwright/test
│
├── check_rls.js                     # Diagnóstico de RLS en Supabase
├── check_columns.js                 # Verifica columnas de las tablas
├── check_db.js                      # Verifica conexión general
├── check_supabase.js                # Test de Supabase client
├── check_users.js                   # Verifica usuarios
├── supabase_rls_appointments.sql    # Policies RLS para appointments
│
├── playwright.config.js             # Config de tests E2E
├── tests/
│   └── appointment.spec.js          # Test E2E del flujo de citas
│
├── evidencias/                      # Capturas de pantalla para entrega
│   ├── 01_login.jpg
│   ├── 02_dashboard_inicial.jpg
│   ├── ...
│   └── README.md                    # Índice de evidencias
│
├── capturas/                        # Capturas anteriores (histórico)
├── dist/                            # Bundle de producción
│
├── CASOS_DE_USO.md                  # Documentación de los 5 CUs
├── README.md                        # Este archivo
└── T3-02_Reporte_SGBD.html          # Reporte SGBD (entrega T3-02)
```

---

## 🔑 Credenciales de prueba

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `selah2024` |
| Asistente | `selah` | `fisio123` |

También puedes entrar con email: `admin@selah.com` o `info@selah.com` + las mismas contraseñas.

> ⚠️ Estos son usuarios de demo. En producción reemplaza por hashes bcrypt y autenticación vía `supabase.auth`.

---

## 🐛 Troubleshooting

### "Las citas no se guardan" (error 42501)

Significa que tus policies RLS no permiten INSERT al rol anon. **Solución**: ejecuta el archivo [`supabase_rls_appointments.sql`](./supabase_rls_appointments.sql) en el SQL Editor de Supabase.

Para confirmar, corre:
```bash
SUPABASE_URL=... SUPABASE_ANON_KEY=... node check_rls.js
```

### "No puedo iniciar sesión"

1. Verifica en la consola del navegador (F12) si hay errores de conexión a Supabase.
2. Si Supabase está caído o mal configurado, usa las credenciales de demo offline (`admin` / `selah2024`) — la app cae al modo localStorage automáticamente.

### "La app no se instala como PWA"

Necesita HTTPS o `localhost`. En Cloudflare Pages ya está activo el HTTPS por defecto.

### "Cloudflare Pages muestra error después de push"

Verifica en el dashboard de Cloudflare:
- **Production branch**: `main`
- **Build command**: (vacío si es sitio estático)
- **Build output directory**: `physio-manager`

Si cambiaste archivos raíz del repo, purga el caché: Caching → Configuration → Purge Everything.

---

## 📝 Changelog

### v0.1 (Abril 2026) — Primer release funcional

- ✅ 5 Casos de Uso implementados end-to-end
- ✅ Integración completa con Supabase (CRUD validado)
- ✅ RLS configurado para tabla `appointments`
- ✅ PWA instalable con modo offline
- ✅ Responsive desktop + mobile
- ✅ Test E2E con Playwright pasando
- ✅ Dashboard con sincronización en tiempo real
- ✅ Bug fix: citas no se reflejaban en Dashboard (ver [memory/PRD.md](../memory/PRD.md) Sesión 3)

---

## 👥 Autoría

Proyecto desarrollado por **Abimael Lopez** ([@whoami-avi](https://github.com/whoami-avi)) para la asignatura T3 — Sistemas Gestores de Bases de Datos.

## 📄 Licencia

MIT © 2026 — Ver [LICENSE](../LICENSE) (si aplica).
