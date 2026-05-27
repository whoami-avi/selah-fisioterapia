# T4-02 — Informe de Incidencias
## Proyecto: Selah Fisioterapia & Recovery (Release v0.1)

| Campo | Valor |
|-------|-------|
| **Equipo** | TecHome dev's |
| **Integrante** | Abimael Lopez ([@whoami-avi](https://github.com/whoami-avi)) |
| **Materia** | Pruebas de Software (T4) |
| **Repositorio** | https://github.com/whoami-avi/selah-fisioterapia |
| **Demo** | https://pyshiomanager.online |
| **Fecha de entrega** | 27-mayo-2026 |
| **Release evaluado** | v0.1 (tag GitHub `v0.1`) |
| **Documentos base** | [`CASOS_DE_USO.md`](../physio-manager/CASOS_DE_USO.md), [`T4_Reporte_Pruebas.md`](../physio-manager/T4_Reporte_Pruebas.md) |

---

## 1. Propósito

Pasar de "creo que funciona" a "tengo evidencia de pruebas y defectos controlados". Este informe documenta de forma estructurada **10 incidencias reales** detectadas durante la ejecución de los Casos de Prueba (CP) sobre la app **Selah Fisioterapia**, siguiendo el estándar ISTQB.

---

## 2. Resumen ejecutivo de pruebas

### 2.1. Casos de prueba ejecutados

| Caso de Uso | CP ejecutados | Pass ✅ | Fail ❌ | Bloqueados ⛔ |
|-------------|---------------|---------|---------|---------------|
| CU-01 Pacientes | CP-01, CP-02, CP-03, CP-04 | 4 | 0 | 0 |
| CU-02 Citas | CP-05, CP-06, CP-07, CP-08, CP-09, CP-10, **CP-20** | 4 | 3 | 0 |
| CU-03 Dashboard | CP-11, CP-12 | 1 | 1 | 0 |
| CU-04 Finanzas | CP-13, CP-14 | 1 | 1 | 0 |
| CU-05 WhatsApp | CP-15, **CP-18**, **CP-19** | 1 | 2 | 0 |
| RNF Seguridad | **CP-16**, **CP-17** | 0 | 2 | 0 |
| **TOTAL** | **20** | **11** | **9** | **0** |

> **Tasa de éxito:** 11/20 = **55 %** · **Tasa de defectos:** 9/20 = **45 %**.
> CP-16 a CP-20 fueron añadidos durante esta T4-02 a partir de la revisión estática de código (`app.js`).

### 2.2. Distribución de incidencias por severidad

| Severidad | Cantidad | % |
|-----------|----------|---|
| 🔴 Crítica | 2 (INC-002, INC-006) | 20 % |
| 🟠 Alta | 3 (INC-001, INC-007, INC-008) | 30 % |
| 🟡 Media | 3 (INC-003, INC-009, INC-010) | 30 % |
| 🟢 Baja | 2 (INC-004, INC-005) | 20 % |

### 2.3. Top 3 incidencias P1 (las más críticas)

1. **INC-002 — RLS bloquea INSERT en `appointments` (error 42501).** Bloqueaba el CU-02 (caso de uso principal del negocio). Ya **Cerrada**.
2. **INC-006 — Contraseñas en texto plano** en `localStorage` y columna `users.password`. Vulnerabilidad **Crítica de seguridad**, expone credenciales de admin. Estado: **Nueva**.
3. **INC-007 — XSS por `innerHTML` sin sanitizar** en 6 secciones del frontend (pacientes, dashboard, mensajes, plantillas, evolución). Permite ejecución de JS arbitrario. Estado: **Nueva**.

### 2.4. Estado actual de las incidencias

| Estado | Cantidad | IDs |
|--------|----------|-----|
| ✅ Cerrada (corregida y validada) | 3 | INC-001, INC-002, INC-003 |
| 🔄 En proceso | 1 | INC-004 |
| 🆕 Nueva (pendiente de corrección) | 6 | INC-005, INC-006, INC-007, INC-008, INC-009, INC-010 |

**Defectos corregidos:** 3 (todos los P1 que bloqueaban CU-02).
**Defectos pendientes:** 7 (1 en proceso + 6 nuevos detectados en esta iteración).

---

## 3. Plan de triage y corrección

Orden de corrección sugerido para v0.2 (siguiente release):

| Prioridad | INC | Acción mínima | Esfuerzo estimado |
|-----------|-----|----------------|--------------------|
| **P1** | INC-006 | Migrar a `bcrypt` (cost 10) con `supabase.auth.signInWithPassword()`. Eliminar columna `password` plain. | 4 h |
| **P1** | INC-007 | Reemplazar todos los `innerHTML` con interpolación de datos del usuario por `textContent`, o introducir `DOMPurify`. | 3 h |
| **P2** | INC-008 | Validar `if (!patient.phone) { showToast('Sin teléfono', 'warn'); return; }` antes de `.replace()`. | 30 min |
| **P2** | INC-009 | Cambiar `.replace('{nombre}', ...)` por `.replaceAll('{nombre}', ...)`. | 15 min |
| **P2** | INC-010 | Función `checkOverlap(date, time, duration)` en cliente + índice único compuesto en SQL. | 2 h |
| **P3** | INC-004 | Invocar `renderFinanceDashboard()` desde el callback `updateAppointmentInSupabase` y desde el listener realtime. | 30 min |
| **P3** | INC-005 | Implementar diffing en `renderDashboard()` (solo nodo afectado) o usar `requestAnimationFrame`. | 3 h |

**Esfuerzo total estimado de v0.2 (deuda técnica de calidad): ~13 horas.**

---

## 4. Tabla completa de incidencias (formato ISTQB)

> Versión exportable (CSV/Excel) disponible en [`T4-02_Tabla_Incidencias.csv`](./T4-02_Tabla_Incidencias.csv).

### INC-001 — Crear cita no actualiza contadores del Dashboard y la cita desaparece tras recargar

| Campo | Valor |
|-------|-------|
| **ID** | INC-001 |
| **Fecha** | 2026-04-22 |
| **Equipo** | TecHome dev's |
| **CU / RF** | CU-02 / RF-002 |
| **CP-ID** | CP-05, CP-10 |
| **Entorno** | Windows 11 · Chrome 121 · Supabase PostgreSQL 15 · Release v0.1 (commit pre-fix) · `localhost:8099` |
| **Pasos para reproducir** | 1. Iniciar sesión como admin (`admin`/`selah2024`).<br>2. Click en **+ Nueva Cita**.<br>3. Llenar formulario (paciente Juan Pérez, fecha=hoy, hora=14:30, costo=50000).<br>4. Click **Guardar**.<br>5. Observar Dashboard.<br>6. Recargar la página (F5). |
| **Resultado esperado** | El toast "Cita guardada" aparece, los contadores **Citas Hoy** y **Pendientes** suben en 1, la cita aparece en la lista *Pacientes de hoy* y persiste tras recargar. |
| **Resultado obtenido** | El toast aparece pero los contadores siguen en 0, la cita **no** se muestra en la lista y desaparece completamente tras F5. |
| **Evidencia** | `evidencias/06_cita_creada_dashboard.jpg` (estado post-fix) · log de consola Chrome con `saveAppointment resolved before insert`. |
| **Severidad** | 🟠 Alta (bloquea el caso de uso principal del negocio) |
| **Prioridad** | P1 |
| **Estado** | ✅ Cerrada |
| **Causa probable** | Triple causa raíz: (a) `saveAppointment()` no usaba `await` antes de `renderDashboard()`; (b) `refreshCurrentSection()` no contemplaba la sección `dashboard`; (c) el fallback local hacía `push` sin pasar por `mapAppointmentFromSupabase()`. |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

### INC-002 — INSERT en `appointments` falla con error 42501 (RLS violation)

| Campo | Valor |
|-------|-------|
| **ID** | INC-002 |
| **Fecha** | 2026-04-22 |
| **Equipo** | TecHome dev's |
| **CU / RF / RNF** | CU-02 / RF-002 / RNF-Seguridad |
| **CP-ID** | CP-07 |
| **Entorno** | Windows 11 · Chrome 121 · Supabase PostgreSQL 15 con RLS habilitado · Release v0.1 · `anon key` pública |
| **Pasos para reproducir** | 1. Configurar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `.env`.<br>2. Ejecutar `node check_rls.js`.<br>3. Observar paso 3 "Intentando INSERT".<br>4. Repetir manualmente desde la app web creando una cita. |
| **Resultado esperado** | El INSERT debe completarse correctamente y retornar la fila insertada con UUID generado. |
| **Resultado obtenido** | `Error 42501: new row violates row-level security policy for table 'appointments'`. El catch cae al fallback local y la cita **no** persiste en la nube. |
| **Evidencia** | Output de `check_rls.js` (`test_reports/2026-04-22_check_rls.txt`) · screenshot consola Chrome con stack trace. |
| **Severidad** | 🔴 Crítica |
| **Prioridad** | P1 |
| **Estado** | ✅ Cerrada |
| **Causa probable** | Faltaba la policy de **INSERT** para el rol `anon` en la tabla `appointments`. Solo existía policy de SELECT. Resuelto con `supabase_rls_appointments.sql`. |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

### INC-003 — Botón "Guardar" sin feedback visual permite doble click y crea citas duplicadas

| Campo | Valor |
|-------|-------|
| **ID** | INC-003 |
| **Fecha** | 2026-04-22 |
| **Equipo** | TecHome dev's |
| **CU / RNF** | CU-02 / RNF-Usabilidad |
| **CP-ID** | CP-08 |
| **Entorno** | Windows 11 · Chrome 121 · Release v0.1 · Conexión lenta (Throttling Fast 3G en DevTools) |
| **Pasos para reproducir** | 1. Login como admin.<br>2. Abrir modal **Nueva Cita**.<br>3. Llenar formulario válido.<br>4. Click rápido dos veces consecutivas en **Guardar** antes de que la primera petición termine.<br>5. Revisar la tabla `appointments` en Supabase. |
| **Resultado esperado** | El botón debe deshabilitarse al primer click, mostrar spinner + "Guardando..." y solo permitir un INSERT por submit. |
| **Resultado obtenido** | Se ejecutan dos INSERT idénticos consecutivos, resultando en **dos citas duplicadas** (mismo paciente, fecha, hora) con distinto UUID. |
| **Evidencia** | Screen recording (gif) mostrando doble click · screenshot de Supabase con dos filas duplicadas. |
| **Severidad** | 🟡 Media |
| **Prioridad** | P2 |
| **Estado** | ✅ Cerrada |
| **Causa probable** | `saveAppointment()` no deshabilitaba `submitBtn` ni mostraba spinner antes del `await`; los inputs tampoco se bloqueaban. Resuelto en `app.js:2462-2469`. |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

### INC-004 — Gráfico "Ingresos por método de pago" no se redibuja al cambiar estado de pago

| Campo | Valor |
|-------|-------|
| **ID** | INC-004 |
| **Fecha** | 2026-04-22 |
| **Equipo** | TecHome dev's |
| **CU / RF** | CU-04 / RF-004 |
| **CP-ID** | CP-13 |
| **Entorno** | Windows 11 · Chrome 121 · Chart.js v4 · rol admin · Release v0.1 |
| **Pasos para reproducir** | 1. Login como admin.<br>2. Ir a sección **Finanzas**.<br>3. Anotar el valor del gráfico (ej. Efectivo $0).<br>4. Volver al Dashboard.<br>5. Editar una cita y cambiar **Estado de pago** de pendiente a pagado.<br>6. Volver a Finanzas. |
| **Resultado esperado** | El gráfico debe re-renderizar inmediatamente y mostrar el nuevo ingreso sumado al método de pago correspondiente. |
| **Resultado obtenido** | El gráfico mantiene los valores antiguos. Solo se actualiza si el usuario refresca la página (F5). |
| **Evidencia** | Captura del gráfico antes/después · console log mostrando que `renderFinanceDashboard()` no se invoca. |
| **Severidad** | 🟢 Baja |
| **Prioridad** | P3 |
| **Estado** | 🔄 En proceso |
| **Causa probable** | Falta llamar `renderFinanceDashboard()` dentro del callback de `updateAppointmentInSupabase()` y dentro del `.on('postgres_changes')` de realtime. |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

### INC-005 — Flicker visible en Dashboard al recibir eventos realtime simultáneos

| Campo | Valor |
|-------|-------|
| **ID** | INC-005 |
| **Fecha** | 2026-04-23 |
| **Equipo** | TecHome dev's |
| **CU / RNF** | CU-03 / RNF-Rendimiento |
| **CP-ID** | CP-12 |
| **Entorno** | Windows 11 · Chrome 121 + iPhone 13 Safari · Supabase Realtime · Release v0.1 · dos dispositivos sincronizados |
| **Pasos para reproducir** | 1. Login simultáneo en dispositivo A (escritorio) y B (móvil).<br>2. Crear una cita en A.<br>3. Mientras A está renderizando, crear otra cita en B.<br>4. Observar el Dashboard de ambos durante 1-2 segundos. |
| **Resultado esperado** | El Dashboard debe actualizar incrementalmente sin parpadeos visibles ni saltos de scroll. |
| **Resultado obtenido** | Se observa un *flicker* (parpadeo) de ~200ms en ambos dispositivos y, ocasionalmente, salto de scroll cuando la lista se re-monta completa. |
| **Evidencia** | Video de 5s de ambas pantallas grabadas en paralelo (móvil + desktop). |
| **Severidad** | 🟢 Baja |
| **Prioridad** | P3 |
| **Estado** | 🆕 Nueva |
| **Causa probable** | `renderDashboard()` destruye y reconstruye todo el DOM en lugar de hacer diffing incremental. Cada evento realtime dispara un re-render completo. |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

### INC-006 — Contraseñas almacenadas y comparadas en texto plano (sin hash bcrypt)

| Campo | Valor |
|-------|-------|
| **ID** | INC-006 |
| **Fecha** | 2026-05-27 |
| **Equipo** | TecHome dev's |
| **RNF** | RNF-Seguridad-001 |
| **CP-ID** | CP-16 (nuevo) |
| **Entorno** | Windows 11 · Chrome 121 · Supabase PostgreSQL 15 · Release v0.1 · tabla `public.users` y `localStorage` |
| **Pasos para reproducir** | 1. Abrir DevTools → Application → Local Storage.<br>2. Localizar la clave `selah_users`.<br>3. Revisar el JSON: el campo `password` y `password_hash` tienen el mismo valor en claro.<br>4. Revisar `app.js:757`: la comparación es `u.password === pass \|\| u.password_hash === pass`.<br>5. Revisar `app.js:842-843`: usuarios por defecto guardan `'selah2024'` y `'fisio123'` en claro. |
| **Resultado esperado** | Las contraseñas deben almacenarse únicamente como hash bcrypt (cost ≥ 10) y la comparación debe hacerse con `bcrypt.compare()`. El campo `password` en texto plano no debe existir. |
| **Resultado obtenido** | Las contraseñas se guardan en `localStorage` y en la columna `password` de Supabase **en texto plano**. Cualquier persona con acceso al navegador o lectura de la tabla obtiene credenciales válidas. |
| **Evidencia** | Screenshot de DevTools mostrando `password: "selah2024"` · extracto de código `app.js:757` y `app.js:842-843`. |
| **Severidad** | 🔴 Crítica |
| **Prioridad** | P1 |
| **Estado** | 🆕 Nueva |
| **Causa probable** | El proyecto nunca implementó hashing. Los defaults se hardcodearon en plain text y la función `handleLogin()` admite ambas formas para "compatibilidad". |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

### INC-007 — Vulnerabilidad XSS por `innerHTML` sin escape

| Campo | Valor |
|-------|-------|
| **ID** | INC-007 |
| **Fecha** | 2026-05-27 |
| **Equipo** | TecHome dev's |
| **RNF** | RNF-Seguridad-002 |
| **CP-ID** | CP-17 (nuevo) |
| **Entorno** | Windows 11 · Chrome 121 · Release v0.1 · cualquier rol autenticado |
| **Pasos para reproducir** | 1. Login como admin.<br>2. Ir a Pacientes → Nuevo Paciente.<br>3. En el campo "nombre" escribir: `<img src=x onerror=alert('XSS')>`.<br>4. Guardar.<br>5. Volver al listado de pacientes.<br>6. Observar el dashboard y el listado. |
| **Resultado esperado** | El nombre del paciente debe renderizarse como **texto literal** (escape de HTML) y mostrar el string completo sin ejecutar código. |
| **Resultado obtenido** | El navegador ejecuta el payload y muestra un `alert('XSS')`. El payload se ejecuta también al abrir el Dashboard (Próximo paciente) y al enviar WhatsApp (historial de mensajes). |
| **Evidencia** | Screenshot del `alert('XSS')` disparado · extracto de `app.js` líneas 1075, 1212, 1425, 1921, 2222, 2643 (todos los `innerHTML` con interpolación). |
| **Severidad** | 🟠 Alta |
| **Prioridad** | P1 |
| **Estado** | 🆕 Nueva |
| **Causa probable** | Uso sistemático de `container.innerHTML = \`...${userData}...\`` sin sanitización. No se usa `textContent` ni `DOMPurify` ni se escapa HTML. |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

### INC-008 — `sendWhatsApp` lanza TypeError cuando el paciente no tiene teléfono

| Campo | Valor |
|-------|-------|
| **ID** | INC-008 |
| **Fecha** | 2026-05-27 |
| **Equipo** | TecHome dev's |
| **CU / RF** | CU-05 / RF-005 |
| **CP-ID** | CP-18 (nuevo) |
| **Entorno** | Windows 11 · Chrome 121 · Release v0.1 · paciente con `phone=null` o vacío |
| **Pasos para reproducir** | 1. Login como admin.<br>2. Crear un paciente nuevo **sin** llenar el campo "teléfono" (es opcional según el formulario).<br>3. Guardar el paciente.<br>4. Ir a WhatsApp / Plantillas.<br>5. Seleccionar al paciente recién creado.<br>6. Click en **Enviar**. |
| **Resultado esperado** | El sistema debe mostrar un mensaje claro: *"Este paciente no tiene teléfono registrado. Edítalo antes de enviar WhatsApp."* y no romper la app. |
| **Resultado obtenido** | Aparece en consola: `Uncaught TypeError: Cannot read properties of null (reading 'replace') at sendWhatsApp (app.js:1384)`. La acción no se completa y el usuario no recibe feedback visible. |
| **Evidencia** | Captura de DevTools Console con el stack trace · captura de la pantalla congelada. |
| **Severidad** | 🟠 Alta |
| **Prioridad** | P2 |
| **Estado** | 🆕 Nueva |
| **Causa probable** | `app.js:1384` y `app.js:1396` hacen `patient.phone.replace(/\D/g,'')` sin verificar primero si `phone` existe. El formulario permite `phone` vacío porque no está marcado como obligatorio. |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

### INC-009 — Variables `{nombre}`, `{hora}`, `{fecha}` en plantillas WhatsApp solo se reemplazan una vez

| Campo | Valor |
|-------|-------|
| **ID** | INC-009 |
| **Fecha** | 2026-05-27 |
| **Equipo** | TecHome dev's |
| **CU / RF** | CU-05 / RF-005 |
| **CP-ID** | CP-19 (nuevo) |
| **Entorno** | Windows 11 · Chrome 121 · Release v0.1 |
| **Pasos para reproducir** | 1. Login como admin.<br>2. Ir a Plantillas WhatsApp → Nueva Plantilla.<br>3. Crear plantilla con texto: *"Hola {nombre}, recuerda {nombre} que tu cita es el {fecha} a las {hora}. Gracias {nombre}."*<br>4. Guardar.<br>5. Seleccionar un paciente y enviar la plantilla. |
| **Resultado esperado** | Las 3 ocurrencias de `{nombre}` deben reemplazarse con el nombre real del paciente. |
| **Resultado obtenido** | Solo la **primera** ocurrencia de `{nombre}` se reemplaza. El mensaje final queda: *"Hola Juan, recuerda {nombre} que tu cita ... Gracias {nombre}."* |
| **Evidencia** | Screenshot del mensaje generado en `wa.me` con las variables sin reemplazar visibles · extracto `app.js:1379-1382`. |
| **Severidad** | 🟡 Media |
| **Prioridad** | P2 |
| **Estado** | 🆕 Nueva |
| **Causa probable** | `app.js` usa `String.prototype.replace()` en lugar de `replaceAll()` o regex con flag `/g`. Por defecto `replace` sin regex global solo sustituye la primera coincidencia. |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

### INC-010 — `saveAppointment` no detecta conflictos de horario (overbooking)

| Campo | Valor |
|-------|-------|
| **ID** | INC-010 |
| **Fecha** | 2026-05-27 |
| **Equipo** | TecHome dev's |
| **CU / RF** | CU-02 / RF-002-Validación |
| **CP-ID** | CP-20 (nuevo) |
| **Entorno** | Windows 11 · Chrome 121 · Supabase PostgreSQL 15 · Release v0.1 |
| **Pasos para reproducir** | 1. Login como admin.<br>2. Crear cita: paciente=Juan Pérez, fecha=2026-05-28, hora=10:00, duración=60min.<br>3. Sin cerrar nada, crear otra cita: paciente=María López, fecha=2026-05-28, hora=10:30, duración=45min.<br>4. Ambos guardados deben ser exitosos.<br>5. Ver la agenda del día. |
| **Resultado esperado** | El sistema debe detectar el solapamiento (10:30-11:15 entra dentro del slot 10:00-11:00) y mostrar advertencia *"Ya existe una cita en ese horario. ¿Continuar?"* o bloquear el guardado. |
| **Resultado obtenido** | Ambas citas se guardan sin advertencia. La agenda muestra dos citas solapadas que se renderizan una encima de la otra, dificultando la lectura del fisioterapeuta. |
| **Evidencia** | Screenshot de la agenda con dos citas solapadas · log de Supabase mostrando ambas filas insertadas. |
| **Severidad** | 🟡 Media |
| **Prioridad** | P2 |
| **Estado** | 🆕 Nueva |
| **Causa probable** | `saveAppointment()` (`app.js:2454`) no consulta el array `appointments` para detectar solapamientos antes del INSERT. No hay índice único compuesto `(date, time)` en la DB. |
| **Responsable** | Abimael Lopez (@whoami-avi) |

---

## 5. Glosario (ISTQB)

| Término | Definición |
|---------|------------|
| **Defecto** | Fallo en un componente o documentación de un sistema. |
| **Incidencia** | Reporte formal de un defecto observado (sinónimo práctico de "defecto reportado"). |
| **Severidad** | Impacto del defecto en el sistema. *Crítica* = bloquea uso; *Alta* = bloquea un CU pero hay workaround; *Media* = degrada experiencia; *Baja* = cosmético o de bajo impacto. |
| **Prioridad** | Urgencia con la que debe corregirse. *P1* = bloquea entrega; *P2* = importante para v0.2; *P3* = backlog. |
| **Estado** | Ciclo de vida: Nueva → En proceso → Corregida → Re-test → Cerrada. |
| **Pass/Fail** | Resultado de un CP comparando esperado vs obtenido. |

---

## 6. Conclusiones

1. La cobertura inicial (15 CP del T4) detectó 5 incidencias; la revisión estática de código añadió 5 más (CP-16 a CP-20).
2. **Todas las incidencias P1 que bloqueaban CU-02 (caso de uso crítico) están cerradas**, lo que permite usar el sistema en producción para gestión de citas.
3. Se identificaron **2 vulnerabilidades de seguridad críticas (INC-006 y INC-007)** que deben corregirse antes de cualquier despliegue público real. Mientras tanto, el sistema solo debe usarse en entornos controlados.
4. La deuda de calidad total de v0.2 es ~13 horas de trabajo, distribuidas entre seguridad, validaciones y rendimiento.
5. **Lección aprendida:** las pruebas estáticas (revisión de código) complementan eficazmente las dinámicas (E2E con Playwright). Sin la revisión estática, los bugs de seguridad INC-006/INC-007 no se habrían detectado.

---

## 7. Anexos

- 📄 [`T4-02_Tabla_Incidencias.csv`](./T4-02_Tabla_Incidencias.csv) — Tabla completa importable a Excel/Google Sheets.
- 📄 [`RESUMEN_PRUEBAS_T4-02.md`](./RESUMEN_PRUEBAS_T4-02.md) — Resumen ejecutivo separado (1 página).
- 📄 [`physio-manager/T4_Reporte_Pruebas.md`](../physio-manager/T4_Reporte_Pruebas.md) — Reporte T4 base (15 CP originales).
- 📄 [`physio-manager/CASOS_DE_USO.md`](../physio-manager/CASOS_DE_USO.md) — Especificación de los 5 CU.
- 🖼️ [`physio-manager/evidencias/`](../physio-manager/evidencias/) — 14 capturas de pantalla del sistema.

---

**Fin del informe T4-02 — Informe de Incidencias.**
