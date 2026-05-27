# Casos de Uso — Release v0.1

Documento de especificación de los **5 Casos de Uso (CU)** implementados end-to-end para la entrega T3-03. Cada CU cubre el flujo completo: **Interfaz de usuario → Lógica de negocio → Base de datos**.

---

## Índice

1. [CU1 — Gestionar Pacientes](#cu1-gestionar-pacientes)
2. [CU2 — Agendar y gestionar Citas](#cu2-agendar-y-gestionar-citas)
3. [CU3 — Visualizar Dashboard en tiempo real](#cu3-visualizar-dashboard-en-tiempo-real)
4. [CU4 — Gestionar Finanzas](#cu4-gestionar-finanzas)
5. [CU5 — Enviar mensajes WhatsApp](#cu5-enviar-mensajes-whatsapp)

---

## CU1 — Gestionar Pacientes

| Campo | Valor |
|-------|-------|
| **ID** | CU-01 |
| **Nombre** | Gestionar Pacientes |
| **Actor principal** | Admin / Asistente |
| **Precondición** | Usuario autenticado |
| **Postcondición** | Información del paciente persiste en `public.patients` |
| **Prioridad** | Alta |
| **Tabla DB** | `patients` |
| **Operaciones CRUD** | Create ✅ · Read ✅ · Update ✅ · Delete ✅ |

### Flujo principal (Crear paciente)

1. Usuario entra a la sección **"Pacientes"** del sidebar.
2. Click en **"+ Nuevo Paciente"**.
3. El sistema muestra un modal con los campos: nombre*, teléfono, email, tipo de terapia, zona del cuerpo, historial médico, motivo de consulta, contacto de emergencia.
4. Usuario completa los datos y click en **"Guardar"**.
5. El sistema valida que el campo obligatorio (`nombre`) esté completo.
6. Se ejecuta `INSERT INTO patients` en Supabase.
7. El paciente aparece en la lista inmediatamente (sin recargar).
8. Se envía evento de realtime a otros dispositivos conectados.

### Flujos alternativos

- **Editar**: Click sobre una tarjeta de paciente → se abre el modal prellenado → guardar → `UPDATE`.
- **Eliminar**: Click en el botón rojo de cada tarjeta → confirm → `DELETE FROM patients WHERE id = ?`. Las citas asociadas se eliminan en cascada (`ON DELETE CASCADE`).
- **Buscar**: Campo de búsqueda en el header filtra por nombre o teléfono (filtro client-side sobre el array cacheado).

### Referencias técnicas

- Frontend: `app.js` → funciones `openPatientModal()`, `savePatient()`, `editPatient()`, `deletePatient()`, `renderPatients()`.
- Supabase Service: `savePatientToSupabase()`, `updatePatientInSupabase()`, `deletePatientFromSupabase()`.
- Evidencia: [`evidencias/03_lista_pacientes.jpg`](./evidencias/03_lista_pacientes.jpg)

---

## CU2 — Agendar y gestionar Citas

| Campo | Valor |
|-------|-------|
| **ID** | CU-02 |
| **Nombre** | Agendar y gestionar Citas |
| **Actor principal** | Admin / Asistente |
| **Precondición** | Existe al menos un paciente registrado |
| **Postcondición** | Cita persiste en `public.appointments` y se refleja en Dashboard + Agenda |
| **Prioridad** | Alta |
| **Tabla DB** | `appointments` (FK → `patients`) |
| **Operaciones CRUD** | Create ✅ · Read ✅ · Update ✅ · Delete ✅ |

### Flujo principal (Crear cita)

1. Usuario click en **"+ Nueva Cita"** desde el Dashboard o la Agenda.
2. Se abre el modal "Nueva Cita" con los campos:
   - **Paciente** (select obligatorio)
   - **Fecha** (default: hoy)
   - **Hora** (formato 24h)
   - **Duración** (15 / 30 / 45 / 60 / 90 min)
   - **Tipo de terapia** (ej. fisioterapia, rehabilitación, masaje)
   - **Estado** (pendiente / confirmada / completada / cancelada)
   - **Costo** ($)
   - **Método de pago** (efectivo / transferencia / tarjeta)
   - **Estado de pago** (pendiente / parcial / pagado)
   - **Notas** (opcional)
3. Usuario llena el formulario y click en **"Guardar"**.
4. El botón muestra un spinner + "Guardando..." y todos los inputs se deshabilitan (previene doble click).
5. Se ejecuta `INSERT INTO appointments` en Supabase.
6. El modal se cierra, el toast muestra "Cita guardada", y el Dashboard + la Agenda se re-renderizan inmediatamente.
7. Realtime sincroniza con otros dispositivos conectados.

### Flujos alternativos

- **Editar**: Click sobre la cita en el Dashboard o Agenda → modal prellenado → `UPDATE appointments SET ...`.
- **Eliminar**: Abrir la cita → click en "Eliminar" (rojo) → confirm → la cita se remueve optimistamente del array local, luego se ejecuta `DELETE FROM appointments WHERE id = ?`.
- **Filtrar por fecha**: La Agenda muestra por defecto la semana actual; se puede navegar con flechas.

### Validaciones

- Fecha no puede ser vacía.
- Hora no puede ser vacía.
- Paciente debe existir.
- Si falla el INSERT (ej. por RLS 42501), se muestra toast de error y la cita queda solo en el fallback local con advertencia.

### Referencias técnicas

- Frontend: `app.js` → `openAppointmentModal()`, `saveAppointment()`, `editAppointment()`, `deleteAppointment()`, `renderDashboard()`, `renderCalendar()`.
- Supabase Service: `saveAppointmentToSupabase()`, `updateAppointmentInSupabase()`, `deleteAppointmentFromSupabase()`.
- Mapeo DB ↔ App: `mapAppointmentFromSupabase()` (maneja las diferencias `patient_id`↔`patientId`, `costo`↔`cost`, `type`↔`therapy`, `pago_estado`↔`paymentStatus`).
- Test E2E: [`tests/appointment.spec.js`](./tests/appointment.spec.js)
- Evidencias: [`04_modal_nueva_cita.jpg`](./evidencias/04_modal_nueva_cita.jpg), [`05_formulario_cita_lleno.jpg`](./evidencias/05_formulario_cita_lleno.jpg), [`06_cita_creada_dashboard.jpg`](./evidencias/06_cita_creada_dashboard.jpg)

---

## CU3 — Visualizar Dashboard en tiempo real

| Campo | Valor |
|-------|-------|
| **ID** | CU-03 |
| **Nombre** | Visualizar Dashboard |
| **Actor principal** | Admin / Asistente |
| **Precondición** | Usuario autenticado |
| **Postcondición** | — (solo lectura) |
| **Prioridad** | Alta |
| **Tabla DB** | `appointments`, `patients` |
| **Operaciones CRUD** | Read ✅ (con agregaciones y filtros) |

### Flujo principal

1. Al iniciar sesión, la app ejecuta `loadDataFromSupabase()` que hace:
   - `SELECT * FROM patients ORDER BY created_at DESC`
   - `SELECT * FROM appointments ORDER BY date ASC`
   - `SELECT * FROM templates`
   - `SELECT * FROM messages`
2. La función `renderDashboard()` calcula y muestra:
   - **Total de pacientes** (count de `patients`)
   - **Citas hoy** (filtro de `appointments` por fecha = hoy y status ≠ cancelada)
   - **Pendientes** (filtro por status = pending)
   - **Ingresos hoy** (solo admin — suma de `costo` de citas pagadas hoy)
   - **Pacientes de hoy** (lista con hora, nombre, terapia, estado)
   - **Próximo paciente** (cita más cercana del día)
3. Las suscripciones `realtime` escuchan cambios en las tablas `patients` y `appointments` y disparan `refreshCurrentSection()` automáticamente → el Dashboard se actualiza sin recarga.

### Reglas de negocio

- Los cálculos de **Ingresos hoy** solo se muestran si `currentUserRole === 'admin'`.
- Cuando no hay citas: muestra "No hay citas programadas para hoy".
- El formato de hora usa `formatTime()` que convierte `14:30` → `2:30 PM` (formato 12h).

### Referencias técnicas

- Frontend: `app.js` → `renderDashboard()` (línea 1834+), `refreshCurrentSection()`, `subscribeToRealtimeChanges()`.
- Evidencia: [`02_dashboard_inicial.jpg`](./evidencias/02_dashboard_inicial.jpg), [`06_cita_creada_dashboard.jpg`](./evidencias/06_cita_creada_dashboard.jpg)

---

## CU4 — Gestionar Finanzas

| Campo | Valor |
|-------|-------|
| **ID** | CU-04 |
| **Nombre** | Gestionar Finanzas |
| **Actor principal** | Admin (exclusivo) |
| **Precondición** | Usuario con rol `admin` |
| **Postcondición** | Estado de pago actualizado en `appointments` |
| **Prioridad** | Media |
| **Tabla DB** | `appointments` |
| **Operaciones CRUD** | Read ✅ (filtros + agregación) · Update ✅ (estado de pago) |

### Flujo principal

1. Usuario admin entra a la sección **"Finanzas"** del sidebar.
2. El sistema calcula y muestra:
   - **Ingresos totales** del mes actual
   - **Ingresos por método de pago** (efectivo, transferencia, tarjeta)
   - **Citas pendientes de cobrar** (status pago = pending o partial)
   - **Reporte de pagos** por paciente
3. Usuario puede hacer click en una cita pendiente para marcarla como **pagada**.
4. El sistema ejecuta `UPDATE appointments SET pago_estado = 'paid' WHERE id = ?` → el Dashboard y el reporte se actualizan.

### Filtros disponibles

- Por fecha (hoy, esta semana, este mes, personalizado).
- Por método de pago.
- Por estado (pendiente, parcial, pagado).

### Referencias técnicas

- Frontend: `app.js` → `renderFinances()`, `renderFinanceDashboard()`.
- Solo accesible si `currentUserRole === 'admin'` (validación tanto en UI como en la lógica).
- Evidencia: [`11_finanzas.jpg`](./evidencias/11_finanzas.jpg)

---

## CU5 — Enviar mensajes WhatsApp

| Campo | Valor |
|-------|-------|
| **ID** | CU-05 |
| **Nombre** | Enviar mensajes WhatsApp |
| **Actor principal** | Admin / Asistente |
| **Precondición** | Paciente con teléfono registrado |
| **Postcondición** | Mensaje registrado en `messages`; navegador abre WhatsApp Web/App |
| **Prioridad** | Media |
| **Tabla DB** | `templates`, `messages`, `patients` |
| **Operaciones CRUD** | Read (plantillas y paciente) ✅ · Create (registro de mensaje) ✅ |

### Flujo principal

1. Usuario entra a **"WhatsApp"** / **"Plantillas"** en el sidebar.
2. El sistema lista las plantillas disponibles (ej. "Confirmación de cita", "Recordatorio 24h antes", "Agradecimiento post-sesión") desde `SELECT * FROM templates`.
3. Usuario selecciona un paciente y una plantilla.
4. El sistema reemplaza las variables de la plantilla con los datos reales: `{nombre}`, `{hora}`, `{fecha}`, `{terapia}`.
5. Click en **"Enviar"** → el sistema:
   - Abre `https://wa.me/<telefono>?text=<mensaje_encodeado>` en una nueva pestaña.
   - Ejecuta `INSERT INTO messages` con el contenido y el `patient_id` para llevar registro.
6. WhatsApp Web/App se abre con el mensaje prellenado, listo para enviar con 1 click.

### Plantillas por defecto (seed)

```js
[
  { name: 'Confirmación cita',    message: 'Hola {nombre}! Te confirmo tu cita el {fecha} a las {hora}. 📅' },
  { name: 'Recordatorio 24h',     message: 'Hola {nombre}, te recuerdo que mañana a las {hora} tienes tu sesión de {terapia}.' },
  { name: 'Bienvenida',           message: 'Hola {nombre}, bienvenido/a a Selah Fisioterapia. 👋' },
  { name: 'Pago pendiente',       message: 'Hola {nombre}, te recuerdo que tienes un pago pendiente de $ {costo}.' },
]
```

### Referencias técnicas

- Frontend: `app.js` → `sendWhatsApp()`, `renderTemplates()`, `saveTemplateToSupabase()`.
- Evidencia: [`14_whatsapp_templates.jpg`](./evidencias/14_whatsapp_templates.jpg)

---

## 📊 Matriz de cobertura CRUD

| Caso de Uso | C | R | U | D | Validado en DB real |
|-------------|---|---|---|---|---------------------|
| CU1 Pacientes | ✅ | ✅ | ✅ | ✅ | ✅ |
| CU2 Citas | ✅ | ✅ | ✅ | ✅ | ✅ (ver `check_rls.js`) |
| CU3 Dashboard | — | ✅ | — | — | ✅ |
| CU4 Finanzas | — | ✅ | ✅ | — | ✅ |
| CU5 WhatsApp | ✅ | ✅ | — | — | ✅ |

**Total operaciones CRUD implementadas: 15/15**
