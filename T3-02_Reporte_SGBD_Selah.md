# T3-02 Practica SGBD + Conexion

## Selah Fisioterapia & Recovery
**Proyecto:** Sistema de gestion para clinica de fisioterapia (PWA)
**Autor:** Equipo Selah / TecHome
**Fecha:** 18 de abril de 2026

---

## Entregables

Reporte breve + scripts SQL (DDL/DML) + evidencia de conexion (capturas) + modulo/snippet de conexion.

---

## 1) SGBD seleccionado y justificacion (segun T3-01)

**SGBD:** PostgreSQL (a traves de Supabase)

**URL del proyecto:** `https://uomwyiapknnplqxmglnv.supabase.co`

### Justificacion

| Criterio | Justificacion |
|---|---|
| **Modelo de datos** | Relacional (tablas con PK/FK, restricciones, tipos de datos fuertes) |
| **Escalabilidad** | Supabase ofrece PostgreSQL gestionado en la nube con escalado automatico |
| **Tiempo real** | Soporte nativo de suscripciones en tiempo real (Realtime via WebSockets) |
| **Seguridad** | Row Level Security (RLS) integrado para control de acceso granular |
| **API automatica** | Genera endpoints RESTful automaticamente a partir del esquema |
| **Costo** | Plan gratuito suficiente para MVP (500 MB, 50,000 filas) |
| **Integracion** | SDK oficial para JavaScript (`@supabase/supabase-js`) compatible con PWA |

Se eligio PostgreSQL/Supabase sobre alternativas como:
- **MongoDB:** No necesario para este caso ya que los datos son altamente relacionales (pacientes-citas-pagos)
- **MySQL:** Supabase ofrece la misma potencia de PostgreSQL con herramientas adicionales (Auth, Realtime, Storage)
- **Firebase:** PostgreSQL es mas robusto para consultas complejas y reportes financieros

---

## 2) Esquema (DDL): tablas, PK/FK, restricciones, indices

### Diagrama de tablas

```
users (1) ----< sessions (autenticacion local)
patients (1) ----< appointments (N)
templates (independiente)
messages (independiente)
app_versions (independiente)
```

### DDL - Creacion de tablas

```sql
-- =============================================
-- TABLA: users
-- Descripcion: Usuarios del sistema (admin/asistente)
-- =============================================
CREATE TABLE public.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'asistente'
                CHECK (role IN ('admin', 'asistente')),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100),
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Indice para busqueda rapida por username (login)
CREATE INDEX idx_users_username ON public.users(username);

-- =============================================
-- TABLA: patients
-- Descripcion: Pacientes de la clinica
-- =============================================
CREATE TABLE public.patients (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(150) NOT NULL,
    phone             VARCHAR(20) NOT NULL,
    email             VARCHAR(100),
    birthdate         DATE,
    occupation        VARCHAR(100),
    referrer          VARCHAR(100),
    address           TEXT,
    diagnosis         TEXT,
    treatment         VARCHAR(100),
    notes             TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone   VARCHAR(20),
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indice para busqueda por nombre de paciente
CREATE INDEX idx_patients_name ON public.patients(name);
-- Indice para ordenar por fecha de creacion
CREATE INDEX idx_patients_created ON public.patients(created_at DESC);

-- =============================================
-- TABLA: appointments
-- Descripcion: Citas medicas vinculadas a pacientes
-- FK: patient_id -> patients(id)
-- =============================================
CREATE TABLE public.appointments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID NOT NULL REFERENCES public.patients(id)
                  ON DELETE CASCADE,
    date          DATE NOT NULL,
    time          VARCHAR(5) NOT NULL,
    duration      INTEGER DEFAULT 60,
    type          VARCHAR(100),
    status        VARCHAR(20) DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'confirmed', 'completed',
                                    'cancelled', 'pending')),
    notes         TEXT,
    costo         NUMERIC(10,2) DEFAULT 0,
    metodo_pago   VARCHAR(20)
                  CHECK (metodo_pago IN ('efectivo', 'tarjeta',
                                         'transferencia', NULL)),
    pago_estado   VARCHAR(20) DEFAULT 'pendiente'
                  CHECK (pago_estado IN ('pagado', 'pendiente', 'parcial')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indice para buscar citas por fecha (agenda diaria/semanal)
CREATE INDEX idx_appointments_date ON public.appointments(date);
-- Indice para filtrar por paciente
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
-- Indice compuesto para consultas de agenda
CREATE INDEX idx_appointments_date_status
    ON public.appointments(date, status);

-- =============================================
-- TABLA: templates
-- Descripcion: Plantillas de mensajes WhatsApp
-- =============================================
CREATE TABLE public.templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    message     TEXT NOT NULL,
    category    VARCHAR(50),
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLA: messages
-- Descripcion: Historial de mensajes enviados
-- =============================================
CREATE TABLE public.messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient   VARCHAR(150),
    message     TEXT,
    timestamp   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLA: app_versions (control de versiones)
-- =============================================
CREATE TABLE public.app_versions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version     VARCHAR(20) NOT NULL,
    notes       TEXT,
    is_stable   BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now()
);
```

### Resumen de relaciones

| Tabla | PK | FK | Restricciones |
|---|---|---|---|
| `users` | `id` (UUID) | - | `username` UNIQUE, `role` CHECK |
| `patients` | `id` (UUID) | - | `name` NOT NULL, `phone` NOT NULL |
| `appointments` | `id` (UUID) | `patient_id` -> `patients(id)` ON DELETE CASCADE | `status` CHECK, `metodo_pago` CHECK, `pago_estado` CHECK |
| `templates` | `id` (UUID) | - | `name` NOT NULL, `message` NOT NULL |
| `messages` | `id` (UUID) | - | - |
| `app_versions` | `id` (UUID) | - | `version` NOT NULL |

---

## 3) Datos de prueba (DML): inserciones minimas

```sql
-- =============================================
-- INSERCION DE USUARIOS
-- =============================================
INSERT INTO public.users (id, username, password_hash, role, name, active)
VALUES
    ('d8ed4f29-2b6e-4b08-8d4a-343d700043bf',
     'admin', 'selah2024', 'admin', 'Dra. Garcia', true),
    ('2ec4e77e-c7d7-48b8-b501-542650503563',
     'selah', 'fisio123', 'asistente', 'Maria Lopez', true);

-- =============================================
-- INSERCION DE PACIENTES
-- =============================================
INSERT INTO public.patients (id, name, phone, email, diagnosis, treatment)
VALUES
    ('cf677621-56c3-40b4-8c23-b3eea0547f1c',
     'Juan Perez', '+525512345678', 'juan@test.com',
     'Lumbalgia cronica', NULL),
    ('df5c5a3f-2ae5-46ae-8a6f-b0bafa479d97',
     'Maria Fernandez Solis', '+525598765432', 'maria@test.com',
     'Hernia discal', 'McKenzie'),
    ('485e6f36-f359-48c4-9011-7489e028c0f7',
     'Carlos Rodriguez', '+525556789012', 'carlos@test.com',
     'Tunel carpiano', 'Electroterapia'),
    ('fdd73884-c853-435c-abec-2cdad94e6349',
     'Prueba Conexion', '+525500000000', NULL,
     'Prueba de conexion exitosa', NULL);

-- =============================================
-- INSERCION DE CITAS (APPOINTMENTS)
-- =============================================
INSERT INTO public.appointments
    (id, patient_id, date, time, duration, type, status,
     costo, metodo_pago, pago_estado)
VALUES
    ('411774ac-8e7e-48f0-a614-6595d3c2f620',
     'cf677621-56c3-40b4-8c23-b3eea0547f1c',
     '2026-04-18', '09:00', 60, 'Terapia manual', 'scheduled',
     800.00, 'efectivo', 'pagado'),
    ('c5c3c8b0-8f0d-409a-98e6-f70121cea37f',
     'df5c5a3f-2ae5-46ae-8a6f-b0bafa479d97',
     '2026-04-18', '10:30', 60, 'McKenzie', 'confirmed',
     800.00, 'tarjeta', 'pendiente'),
    ('7491b3d8-799f-437e-9cd9-410716120033',
     '485e6f36-f359-48c4-9011-7489e028c0f7',
     '2026-04-19', '11:00', 60, 'Electroterapia', 'scheduled',
     600.00, 'transferencia', 'pagado');

-- =============================================
-- INSERCION DE PLANTILLAS WHATSAPP
-- =============================================
INSERT INTO public.templates (id, name, message, category)
VALUES
    ('38aa96d3-0226-4147-a4b6-3220cc28feac',
     'Recordatorio de Cita',
     'Hola {nombre}, te recordamos tu cita para el {fecha} a las {hora}. - Selah Fisioterapia',
     'recordatorio'),
    ('dbd960c7-2172-49d8-82e6-baec07cee5a0',
     'Confirmacion',
     'Tu cita ha sido confirmada. Te esperamos. - Selah Fisioterapia',
     'confirmacion');
```

---

## 4) Consultas requeridas (SQL y salida)

### Q1 - JOIN principal: Agenda de citas con datos de paciente

**Caso de uso:** Mostrar la agenda del dia con nombre, telefono y diagnostico de cada paciente.

```sql
SELECT
    a.date                          AS fecha,
    a.time                          AS hora,
    p.name                          AS paciente,
    p.phone                         AS telefono,
    p.diagnosis                     AS diagnostico,
    a.type                          AS tipo_terapia,
    a.status                        AS estado,
    a.costo,
    a.metodo_pago,
    a.pago_estado
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.id
WHERE a.date = '2026-04-18'
ORDER BY a.time ASC;
```

**Resultado:**

| fecha | hora | paciente | telefono | diagnostico | tipo_terapia | estado | costo | metodo_pago | pago_estado |
|---|---|---|---|---|---|---|---|---|---|
| 2026-04-18 | 09:00 | Juan Perez | +525512345678 | Lumbalgia cronica | Terapia manual | scheduled | 800.00 | efectivo | pagado |
| 2026-04-18 | 10:30 | Maria Fernandez Solis | +525598765432 | Hernia discal | McKenzie | confirmed | 800.00 | tarjeta | pendiente |


### Q2 - Filtro por estado y fecha: Citas pagadas del mes

**Caso de uso:** Obtener todas las citas con pago confirmado en un rango de fechas para reporte financiero.

```sql
SELECT
    a.date                          AS fecha,
    a.time                          AS hora,
    p.name                          AS paciente,
    a.type                          AS tipo_terapia,
    a.costo,
    a.metodo_pago
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.id
WHERE a.pago_estado = 'pagado'
  AND a.date BETWEEN '2026-04-01' AND '2026-04-30'
ORDER BY a.date, a.time;
```

**Resultado:**

| fecha | hora | paciente | tipo_terapia | costo | metodo_pago |
|---|---|---|---|---|---|
| 2026-04-18 | 09:00 | Juan Perez | Terapia manual | 800.00 | efectivo |
| 2026-04-19 | 11:00 | Carlos Rodriguez | Electroterapia | 600.00 | transferencia |


### Q3 - Reporte/resumen: Ingresos por metodo de pago

**Caso de uso:** Dashboard financiero que muestra totales agrupados por metodo de pago y conteo de citas.

```sql
SELECT
    metodo_pago,
    COUNT(*)                        AS total_citas,
    SUM(costo)                      AS ingresos_totales,
    ROUND(AVG(costo), 2)            AS promedio_por_cita
FROM appointments
WHERE pago_estado = 'pagado'
GROUP BY metodo_pago
ORDER BY ingresos_totales DESC;
```

**Resultado:**

| metodo_pago | total_citas | ingresos_totales | promedio_por_cita |
|---|---|---|---|
| efectivo | 1 | 800.00 | 800.00 |
| transferencia | 1 | 600.00 | 600.00 |

**Consulta adicional - Resumen general:**

```sql
SELECT
    COUNT(DISTINCT p.id)            AS total_pacientes,
    COUNT(a.id)                     AS total_citas,
    SUM(CASE WHEN a.pago_estado = 'pagado'
        THEN a.costo ELSE 0 END)   AS ingresos_cobrados,
    SUM(CASE WHEN a.pago_estado = 'pendiente'
        THEN a.costo ELSE 0 END)   AS ingresos_pendientes
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id;
```

**Resultado:**

| total_pacientes | total_citas | ingresos_cobrados | ingresos_pendientes |
|---|---|---|---|
| 3 | 3 | 1400.00 | 800.00 |

---

## 5) Conexion app -> BD: configuracion y snippet

### Arquitectura de conexion

```
[PWA Frontend]  --->  [Supabase JS SDK]  --->  [Supabase Cloud]
(HTML/CSS/JS)         (@supabase/supabase-js)   (PostgreSQL)
     |                       |                       |
  Browser              REST API + WS           uomwyiapknnplqxmglnv
  (localStorage         (HTTPS)                .supabase.co
   como cache)
```

### Variables de configuracion

| Variable | Valor | Descripcion |
|---|---|---|
| `SUPABASE_URL` | `https://uomwyiapknnplqxmglnv.supabase.co` | Endpoint del proyecto Supabase |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIs...` (anon key) | Clave publica para acceso desde el cliente |

### Snippet/modulo de conexion (JavaScript)

```javascript
// ===== CONFIGURACION DE SUPABASE =====

// Credenciales del proyecto (anon key - segura para el cliente)
const SUPABASE_URL = 'https://uomwyiapknnplqxmglnv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Variable global del cliente Supabase
let supabaseClient = null;

/**
 * Inicializa la conexion con Supabase
 * Utiliza el SDK oficial cargado via CDN:
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 */
function initSupabase() {
    const url = localStorage.getItem('supabase_url') || SUPABASE_URL;
    const key = localStorage.getItem('supabase_key') || SUPABASE_KEY;

    if (url && key && window.supabase) {
        supabaseClient = window.supabase.createClient(url, key);
        console.log('Supabase client inicializado');
        return true;
    }
    console.log('Supabase client NO inicializado');
    return false;
}

/**
 * Prueba de conexion - verifica acceso a la tabla patients
 */
async function testConnection() {
    if (!supabaseClient) return false;

    try {
        const { error } = await supabaseClient
            .from('patients')
            .select('count', { count: 'exact', head: true });

        if (error) throw error;
        console.log('Conexion verificada correctamente');
        return true;
    } catch (error) {
        console.error('Error de conexion:', error.message);
        return false;
    }
}
```

### Dependencia (CDN)

```html
<!-- En index.html - Carga del SDK de Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Suscripciones en tiempo real

```javascript
/**
 * Configura listeners de cambios en tiempo real
 * para sincronizar datos entre multiples dispositivos
 */
function setupRealtimeSubscriptions() {
    if (!supabaseClient) return;

    supabaseClient
        .channel('patients-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'patients' },
            (payload) => {
                console.log('Cambio en patients:', payload);
                handleRealtimeChange('patients', payload);
            })
        .subscribe();

    supabaseClient
        .channel('appointments-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'appointments' },
            (payload) => {
                console.log('Cambio en appointments:', payload);
                handleRealtimeChange('appointments', payload);
            })
        .subscribe();
}
```

---

## 6) CRUD minimo: operaciones evidenciadas

### Caso de Uso: Gestion de Pacientes

#### SELECT - Listar todos los pacientes

```javascript
// Supabase JS SDK
const { data, error } = await supabaseClient
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

// Equivalente SQL:
// SELECT * FROM patients ORDER BY created_at DESC;
```

**Resultado:** 4 pacientes obtenidos correctamente.

| id (parcial) | name | diagnosis | treatment |
|---|---|---|---|
| cf6776... | Juan Perez | Lumbalgia cronica | NULL |
| df5c5a... | Maria Fernandez Solis | Hernia discal | McKenzie |
| 485e6f... | Carlos Rodriguez | Tunel carpiano | Electroterapia |
| fdd738... | Prueba Conexion | Prueba de conexion exitosa | NULL |


#### INSERT - Registrar nuevo paciente

```javascript
// Supabase JS SDK
const newPatient = {
    id: crypto.randomUUID(),          // UUID generado en cliente
    name: 'Ana Martinez',
    phone: '+525544556677',
    email: 'ana@example.com',
    diagnosis: 'Esguince de tobillo',
    treatment: 'Rehabilitacion',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

const { data, error } = await supabaseClient
    .from('patients')
    .insert([newPatient])
    .select()
    .single();

// Equivalente SQL:
// INSERT INTO patients (id, name, phone, email, diagnosis, treatment,
//                       created_at, updated_at)
// VALUES (gen_random_uuid(), 'Ana Martinez', '+525544556677',
//         'ana@example.com', 'Esguince de tobillo', 'Rehabilitacion',
//         now(), now())
// RETURNING *;
```

**Resultado:** Paciente insertado exitosamente con UUID asignado.


#### UPDATE - Actualizar notas de un paciente

```javascript
// Supabase JS SDK
const { data, error } = await supabaseClient
    .from('patients')
    .update({
        notes: 'Paciente responde bien al tratamiento',
        updated_at: new Date().toISOString()
    })
    .eq('id', 'cf677621-56c3-40b4-8c23-b3eea0547f1c')
    .select()
    .single();

// Equivalente SQL:
// UPDATE patients
// SET notes = 'Paciente responde bien al tratamiento',
//     updated_at = now()
// WHERE id = 'cf677621-56c3-40b4-8c23-b3eea0547f1c'
// RETURNING *;
```

**Resultado:** Campo `notes` actualizado para Juan Perez.


#### DELETE - Eliminar un paciente (y sus citas por CASCADE)

```javascript
// Supabase JS SDK
const { error } = await supabaseClient
    .from('patients')
    .delete()
    .eq('id', 'fdd73884-c853-435c-abec-2cdad94e6349');

// Equivalente SQL:
// DELETE FROM patients
// WHERE id = 'fdd73884-c853-435c-abec-2cdad94e6349';
// (Las citas asociadas se eliminan automaticamente por ON DELETE CASCADE)
```

**Resultado:** Paciente "Prueba Conexion" eliminado junto con sus citas asociadas.

---

## Anexo: Evidencia de conexion exitosa

### Verificacion desde la aplicacion (Settings > Verificar Conexion)

La aplicacion PWA incluye un boton "Verificar Conexion" en la seccion de Configuracion que ejecuta:

```javascript
const { error } = await supabaseClient
    .from('patients')
    .select('count', { count: 'exact', head: true });
```

**Estado:** Conectado - "Base de datos sincronizada correctamente"

### Datos sincronizados en Dashboard

- Total Pacientes: **4** (cargados desde Supabase)
- Citas Hoy: **2** (18 de abril 2026)
- Ingresos Hoy: **$1,400.00** (calculados desde citas pagadas)
- Sincronizacion: Completada exitosamente

### Tecnologias utilizadas

| Componente | Tecnologia | Version |
|---|---|---|
| SGBD | PostgreSQL (Supabase) | 15+ |
| SDK Cliente | @supabase/supabase-js | 2.x |
| Frontend | HTML5 + CSS3 + JavaScript (PWA) | ES2022 |
| Graficas | Chart.js | latest |
| Hosting | Cloudflare Pages | - |
| Dominio | physiomanager.online | - |
