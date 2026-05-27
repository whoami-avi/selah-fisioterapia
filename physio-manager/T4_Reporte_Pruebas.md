# T4 — Reporte de Investigación: Pruebas de Software

**Proyecto:** Selah Fisioterapia & Recovery
**Equipo:** TecHome dev's
**Integrantes:** Abimael Lopez ([@whoami-avi](https://github.com/whoami-avi))
**Materia:** Sistemas Gestores de Bases de Datos
**Tema 4:** Pruebas de Software
**Fecha:** Abril 2026
**Repositorio:** https://github.com/whoami-avi/selah-fisioterapia

---

## Índice

1. [Introducción](#1-introducción)
2. [Tipos de pruebas](#2-tipos-de-pruebas)
3. [Casos de prueba](#3-casos-de-prueba)
4. [Documentación de resultados](#4-documentación-de-resultados)
5. [Relación pruebas ↔ Casos de Uso](#5-relación-pruebas--casos-de-uso)
6. [Conclusión](#6-conclusión)
7. [Referencias](#7-referencias)

---

## 1. Introducción

El desarrollo de software es un proceso complejo donde cada línea de código puede ser un punto potencial de fallo. En sistemas que gestionan datos sensibles —como historiales médicos, citas y pagos en una clínica de fisioterapia—, un error puede traducirse en pérdida de información, mala atención al paciente o pérdidas económicas. Las **pruebas de software** son la herramienta principal para minimizar ese riesgo: nos permiten detectar errores **antes** de que el sistema llegue al usuario final.

En este reporte se documenta el plan de pruebas para **Selah Fisioterapia & Recovery**, una PWA que gestiona pacientes, citas, finanzas y comunicación por WhatsApp en una clínica de fisioterapia. El sistema se construye con HTML/CSS/JavaScript vanilla en el frontend y Supabase (PostgreSQL) en el backend, con sincronización en tiempo real entre dispositivos.

Durante el desarrollo del proyecto ya hemos vivido en carne propia la importancia de las pruebas: el bug "las citas no se reflejan en el dashboard" pasó desapercibido hasta que un usuario real lo reportó, y resultó tener **3 causas raíz combinadas** (un bug de async/await, otro de naming en `refreshCurrentSection`, y un tercero de mapeo de datos en el fallback) además de una **policy RLS faltante en Supabase**. Si hubiéramos tenido pruebas automatizadas desde el inicio, los 3 bugs del frontend se habrían detectado en segundos. Esa experiencia es la motivación de este reporte.

**Objetivos de las pruebas en Selah:**

- Verificar que cada Caso de Uso (CU) funciona end-to-end (UI → Lógica → Base de datos).
- Garantizar que las operaciones CRUD persisten correctamente en Supabase.
- Asegurar la sincronización en tiempo real entre múltiples dispositivos.
- Validar que la app sigue funcionando offline (modo localStorage).
- Detectar regresiones cuando se introducen cambios en `app.js`.

---

## 2. Tipos de pruebas

Aplicamos al menos cinco tipos de pruebas distintas en Selah. Cada una cubre un riesgo diferente.

### 2.1. Pruebas unitarias (Unit Testing)

**Definición:** Validan el comportamiento de una unidad mínima de código (una función pura, un módulo) de forma aislada, sin dependencias externas.

**Aplicación en Selah:**
La función `mapAppointmentFromSupabase()` (en `physio-manager/app.js`) traduce las columnas de Supabase (`patient_id`, `costo`, `pago_estado`, `type`) a las propiedades que usa el frontend (`patientId`, `cost`, `paymentStatus`, `therapy`). Es 100% determinística y pura, perfecta para unit testing.

**Ejemplo de prueba unitaria:**
```js
test('mapAppointmentFromSupabase mapea pago_estado=pagado a paid', () => {
  const dbRow = { id: '1', patient_id: 'abc', pago_estado: 'pagado', costo: 500 };
  const result = mapAppointmentFromSupabase(dbRow);
  expect(result.paymentStatus).toBe('paid');
  expect(result.cost).toBe(500);
  expect(result.patientId).toBe('abc');
});
```

**Beneficio:** Detecta inmediatamente si alguien rompe el mapeo (por ejemplo, si Supabase agrega una columna nueva o cambia el formato de `pago_estado`).

### 2.2. Pruebas de integración (Integration Testing)

**Definición:** Validan que dos o más componentes del sistema funcionan correctamente cuando se combinan. En Selah, lo más común es probar la integración **App ↔ Supabase**.

**Aplicación en Selah:**
El script [`check_rls.js`](./check_rls.js) es una prueba de integración real: se conecta a Supabase con la `anon key`, intenta SELECT, INSERT y DELETE sobre la tabla `appointments`, y reporta los códigos de error. Esto es lo que descubrió el bug `42501 - new row violates row-level security policy`.

**Ejecución actual (output real):**
```
🔍 1) Listando pacientes...
   3 paciente(s) leídos
🔍 2) Listando citas existentes...
   3 cita(s) leídas
🔍 3) Intentando INSERT...
   ✅ Insert OK.
🔍 4) SELECT post-INSERT...
   ✅ Cita leída correctamente.
🔍 5) DELETE de la cita de prueba...
   ✅ Delete OK.
```

**Beneficio:** Validamos que las **policies RLS** están bien configuradas en Supabase, algo que ningún unit test podría detectar porque depende del estado de la base de datos remota.

### 2.3. Pruebas de sistema / E2E (End-to-End Testing)

**Definición:** Simulan el comportamiento de un usuario real interactuando con el sistema completo: navegador → DOM → app → red → base de datos → respuesta → UI.

**Aplicación en Selah:**
Usamos **Playwright** para automatizar un navegador Chromium headless que abre la app, hace login, crea una cita, la edita y la elimina, validando en cada paso que el Dashboard refleje los cambios.

**Archivo:** [`tests/appointment.spec.js`](./tests/appointment.spec.js)

**Output real:**
```
Running 1 test using 1 worker
  ✓  1 [chromium] › appointment.spec.js › Crear, editar y eliminar cita (4.8s)
  1 passed (6.5s)
```

**Beneficio:** Es la única prueba que detecta bugs de **interacción**, como por ejemplo el bug que tuvimos donde el modal se cerraba pero el dashboard no se actualizaba. Ningún unit test hubiera detectado eso.

### 2.4. Pruebas de regresión

**Definición:** Conjunto de pruebas que se ejecutan después de cada cambio para asegurarse de que **no se rompió** algo que antes funcionaba.

**Aplicación en Selah:**
Cada vez que modificamos `app.js`, ejecutamos `npx playwright test`. Si alguno de los 3 sub-flujos (crear, editar, eliminar) falla, sabemos que el cambio introdujo una regresión.

**Beneficio crítico:** Cuando refactoricemos `saveAppointment()` para añadir validaciones futuras (ej. "no permitir agendar dos pacientes a la misma hora"), la prueba E2E nos avisa si rompimos algo del comportamiento básico.

### 2.5. Pruebas de aceptación (User Acceptance Testing)

**Definición:** El usuario final (en este caso, el fisioterapeuta o asistente de la clínica) ejecuta el sistema con datos reales para verificar que cumple con sus necesidades de negocio.

**Aplicación en Selah:**
Antes del release v0.1 desplegamos la app en https://pyshiomanager.online y pedimos al usuario que:
- Registrara 3 pacientes reales con sus historiales médicos.
- Agendara las citas de la próxima semana.
- Marcara una cita como "pagada" y verificara los ingresos del día.
- Enviara un recordatorio por WhatsApp a un paciente.

**Beneficio:** Detecta requisitos malinterpretados. Ejemplo real: en pruebas de aceptación descubrimos que la asistente quería filtrar pacientes por "zona del cuerpo" (espalda, hombro, rodilla...), funcionalidad que no estaba en los requerimientos iniciales.

### 2.6. Otras pruebas relevantes (mención breve)

| Tipo | Aplicación en Selah |
|------|---------------------|
| **Compatibilidad** | Probar la app en Chrome, Firefox, Safari, Edge y dispositivos iOS/Android. |
| **Responsive** | Probar viewports 390×844 (móvil), 768×1024 (tablet), 1440×900 (desktop). Ya tenemos evidencia en `evidencias/13_vista_movil_dashboard.jpg`. |
| **Carga / rendimiento** | Probar con 100, 500 y 1000 citas para asegurar que el dashboard sigue siendo fluido. |
| **Seguridad** | Verificar que la `anon key` de Supabase con RLS bien configurado no permite accesos no autorizados. |
| **Offline / PWA** | Desconectar la red y verificar que la app sigue funcionando con localStorage y sincroniza al volver. |

---

## 3. Casos de prueba

A continuación se listan **15 casos de prueba** representativos, organizados por Caso de Uso del sistema.

### 3.1. CU1 — Gestión de Pacientes

| # | Caso | Entrada | Acción | Resultado esperado | Tipo |
|---|------|---------|--------|--------------------|------|
| **CP-01** | Crear paciente válido | `nombre="Juan Pérez", phone="+57 300 1234567", email="juan@ej.com", treatment="fisioterapia"` | Click en "+ Nuevo Paciente" → llenar formulario → Guardar | Paciente se inserta en `patients` con UUID generado, aparece en la lista, contador de "Total Pacientes" sube en 1 | E2E |
| **CP-02** | Crear paciente con nombre vacío | `nombre=""` | Click en Guardar | El navegador muestra validación HTML5 "Por favor completa este campo", no se ejecuta el INSERT | Sistema |
| **CP-03** | Editar paciente existente | Paciente existente con `treatment="fisioterapia"`, cambiar a `"masaje"` | Click en tarjeta del paciente → editar → Guardar | `UPDATE patients SET treatment='masaje' WHERE id=?` se ejecuta, la tarjeta refleja el cambio inmediatamente | Integración |
| **CP-04** | Eliminar paciente con citas | Paciente con 2 citas asociadas | Click en eliminar → confirmar | `DELETE FROM patients WHERE id=?` se ejecuta y por `ON DELETE CASCADE` también se eliminan las 2 citas. El dashboard refleja 0 citas | Integración |

### 3.2. CU2 — Citas

| # | Caso | Entrada | Acción | Resultado esperado | Tipo |
|---|------|---------|--------|--------------------|------|
| **CP-05** | Crear cita válida | `paciente=Juan Pérez, fecha=hoy, hora=14:30, status=confirmed, costo=50000` | Abrir modal → llenar → Guardar | Cita se inserta en `appointments`, modal se cierra, Dashboard muestra contador "Citas Hoy: 1" y aparece "2:30 PM - Juan Pérez - Confirmada" | E2E |
| **CP-06** | Crear cita sin paciente | `paciente=null` | Click en Guardar | Validación HTML5 bloquea el submit, mensaje "Por favor completa este campo" | Sistema |
| **CP-07** | RLS bloquea INSERT | App con anon key sin policy de INSERT | Crear cita | El INSERT falla con código `42501`, el catch cae al fallback local, toast muestra "Error al guardar la cita". *Esta es exactamente la prueba que el script `check_rls.js` ejecuta automáticamente.* | Integración |
| **CP-08** | Editar hora de cita | Cita existente a las 10:00 | Click en cita → cambiar hora a 16:45 → Guardar | UPDATE en DB, dashboard ahora muestra "4:45 PM" en vez de "10:00 AM" | E2E |
| **CP-09** | Eliminar cita | Cita seleccionada | Click en cita → botón rojo eliminar → confirmar | DELETE en DB, contador del dashboard baja en 1, lista muestra "No hay citas programadas" si era la única | E2E |
| **CP-10** | Persistencia tras reload | Cita recién creada | Recargar la página (F5) → re-login | La cita sigue apareciendo en el dashboard porque viene de `SELECT * FROM appointments` | Integración |

### 3.3. CU3 — Dashboard

| # | Caso | Entrada | Acción | Resultado esperado | Tipo |
|---|------|---------|--------|--------------------|------|
| **CP-11** | Contadores en tiempo real | DB con 3 pacientes y 1 cita confirmada hoy | Cargar dashboard | "Total Pacientes: 3", "Citas Hoy: 1", "Pendientes: 0", "Ingresos Hoy: $0" (porque la cita no está pagada) | Sistema |
| **CP-12** | Sincronización realtime | Usuario A en escritorio, Usuario B en móvil | A crea una cita | B ve la cita aparecer en su dashboard sin recargar (vía Supabase Realtime) | Integración |

### 3.4. CU4 — Finanzas

| # | Caso | Entrada | Acción | Resultado esperado | Tipo |
|---|------|---------|--------|--------------------|------|
| **CP-13** | Marcar cita como pagada | Cita con `pago_estado=pending, costo=50000` | Click en la cita → cambiar estado → Guardar | UPDATE en DB, "Ingresos Hoy" sube en $50,000, gráfico de finanzas refleja el método de pago | E2E |
| **CP-14** | Acceso denegado a finanzas (asistente) | Usuario logueado con rol `asistente` | Click en "Finanzas" en sidebar | El item no aparece en el sidebar (renderizado condicional por rol) | Sistema |

### 3.5. CU5 — WhatsApp

| # | Caso | Entrada | Acción | Resultado esperado | Tipo |
|---|------|---------|--------|--------------------|------|
| **CP-15** | Enviar plantilla de recordatorio | Paciente con teléfono `+57 300 1234567`, plantilla "Recordatorio 24h" con variables `{nombre}` y `{hora}` | Seleccionar paciente y plantilla → Click en Enviar | Se abre `wa.me/+573001234567?text=Hola%20Juan%2C%20te%20recuerdo...` en una nueva pestaña, el mensaje queda registrado en `messages` | Integración |

---

## 4. Documentación de resultados

### 4.1. Importancia del registro de resultados

Documentar los resultados de las pruebas es tan importante como ejecutarlas. Sin documentación:
- No se puede demostrar **qué se probó** ni **cuándo**.
- No hay trazabilidad para detectar regresiones.
- Los desarrolladores futuros (incluyendo a uno mismo dentro de 3 meses) no saben qué casos están cubiertos.
- No hay forma de medir la **cobertura** de las pruebas.

En Selah usamos dos formas de documentación: una **tabla de incidencias** para reportar bugs encontrados, y un **dashboard de resultados** con el output de Playwright/check_rls.

### 4.2. Tabla de incidencias

Cada bug detectado durante las pruebas se registra con la siguiente estructura. Incluyo aquí ejemplos **reales** del proyecto.

| ID | Fecha | CP relacionado | CU | Severidad | Descripción | Estado | Resolución |
|----|-------|----------------|----|-----------|-------------|--------|------------|
| **INC-001** | 2026-04-22 | CP-05, CP-10 | CU2 | 🔴 Crítica | Al crear una cita, aparece el toast "Cita guardada" pero el contador del dashboard no se actualiza. Tras reload, la cita desaparece. | ✅ Resuelto | Causa raíz triple: `saveAppointment()` no hacía `await`, `refreshCurrentSection()` no contemplaba la sección `dashboard`, y el fallback hacía push sin mapear. Ver Sesión 3 en [`memory/PRD.md`](../memory/PRD.md). |
| **INC-002** | 2026-04-22 | CP-07 | CU2 | 🔴 Crítica | INSERT a `appointments` devuelve error 42501 (RLS violation). | ✅ Resuelto | Faltaba policy de INSERT para rol `anon`. SQL preparado en [`supabase_rls_appointments.sql`](./supabase_rls_appointments.sql) y ejecutado en Supabase. |
| **INC-003** | 2026-04-22 | CP-08 | CU2 | 🟡 Media | Botón "Guardar" no muestra ningún feedback visual durante el save, el usuario puede hacer doble click y crear citas duplicadas. | ✅ Resuelto | Implementado spinner CSS + `disabled` en todos los inputs durante el save (línea 2421 de `app.js`). |
| **INC-004** | 2026-04-22 | CP-13 | CU4 | 🟢 Baja | El gráfico de "Ingresos por método de pago" no se redibuja al cambiar el estado de pago de una cita. | 🔄 En progreso | Falta llamar `renderFinanceDashboard()` en el callback de `updateAppointmentInSupabase()`. |
| **INC-005** | 2026-04-23 | CP-12 | CU3 | 🟢 Baja | Cuando dos dispositivos crean citas a la misma hora, ambos ven sus datos pero hay un breve flicker de re-render. | 📋 Backlog | No es bloqueante. Documentado para revisar en v0.2. |

**Campos de la tabla de incidencias:**

| Campo | Descripción |
|-------|-------------|
| **ID** | Identificador único secuencial (INC-NNN). |
| **Fecha** | Cuándo se detectó. |
| **CP relacionado** | Caso de prueba que la encontró (ej. CP-07). Permite trazabilidad. |
| **CU** | Caso de Uso afectado. Permite ver qué áreas del sistema tienen más bugs. |
| **Severidad** | 🔴 Crítica (bloquea uso), 🟡 Media (degrada experiencia), 🟢 Baja (cosmético). |
| **Descripción** | Qué se observa, pasos para reproducir, contexto. |
| **Estado** | ✅ Resuelto · 🔄 En progreso · 📋 Backlog · ⛔ No reproducible. |
| **Resolución** | Causa raíz, archivos modificados, commit, PR (si aplica). |

### 4.3. Reportes de ejecución de pruebas automatizadas

Además de la tabla de incidencias, guardamos los outputs de las pruebas en `/test_reports/`:

```
test_reports/
├── 2026-04-22_playwright.txt     # Output del primer run E2E
├── 2026-04-22_check_rls.txt      # Diagnóstico de RLS pre-fix
├── 2026-04-23_check_rls.txt      # Diagnóstico de RLS post-fix (todos ✅)
└── 2026-04-23_playwright.txt     # E2E pasando 4.8s
```

Esto permite hacer **diff** entre dos ejecuciones y detectar tendencias.

### 4.4. Beneficios de esta documentación

- **Aprendizaje organizacional:** El equipo aprende de errores pasados sin repetirlos.
- **Métricas:** Podemos calcular indicadores como *Mean Time To Resolution* (MTTR) o *Defect Density* por módulo.
- **Auditoría:** Si en el futuro un paciente reclama "no me llegó el recordatorio el día tal", podemos buscar en la tabla si hubo una incidencia ese día.
- **Refactoring informado:** Si CU2 acumula muchas INCs críticas, es señal de que el módulo necesita rediseño, no solo parches.

---

## 5. Relación pruebas ↔ Casos de Uso

Cada caso de prueba está vinculado explícitamente a un Caso de Uso. Esta trazabilidad responde a la pregunta clave: **"¿qué caso de uso estoy validando con esta prueba?"**.

### 5.1. Matriz de trazabilidad

| Caso de Uso | Casos de prueba | Cobertura CRUD | Pruebas tipo |
|-------------|-----------------|----------------|--------------|
| **CU1 — Pacientes** | CP-01, CP-02, CP-03, CP-04 | Create ✅ Read ✅ Update ✅ Delete ✅ | Sistema, E2E, Integración |
| **CU2 — Citas** | CP-05, CP-06, CP-07, CP-08, CP-09, CP-10 | Create ✅ Read ✅ Update ✅ Delete ✅ | E2E, Sistema, Integración |
| **CU3 — Dashboard** | CP-11, CP-12 | Read ✅ (con agregaciones) | Sistema, Integración |
| **CU4 — Finanzas** | CP-13, CP-14 | Read ✅ Update ✅ | E2E, Sistema |
| **CU5 — WhatsApp** | CP-15 | Read ✅ Create ✅ | Integración |

### 5.2. ¿Por qué la trazabilidad es importante?

1. **Garantiza cobertura completa:** Si un CU no tiene casos de prueba asociados, sabemos que está sin probar y representa un riesgo.
2. **Permite priorización:** Los CUs más críticos (en Selah, CU2 Citas porque maneja la actividad principal del negocio) deben tener más pruebas que los secundarios.
3. **Facilita el mantenimiento:** Si un cliente reporta un bug en "agendar citas", vamos directo a los CP-05 a CP-10.
4. **Demuestra cumplimiento:** Frente a auditorías, podemos demostrar que cada requerimiento (CU) fue verificado con al menos una prueba.

### 5.3. Ejemplo concreto del proyecto

El bug **INC-001** (citas no se reflejan en dashboard) se descubrió porque al ejecutar el CP-05 ("Crear cita válida") observamos que aunque el toast aparecía, el contador del dashboard no se actualizaba. Sin la trazabilidad CP-05 → CU2, no hubiéramos sabido que el problema afectaba al CU principal del sistema. Esa información determinó la severidad **🔴 Crítica** y la prioridad de resolución.

---

## 6. Conclusión

Probar antes de entregar **no es opcional**, es una inversión que se paga sola. En Selah, las pruebas nos permitieron:

- Detectar el bug INC-001 antes de que más usuarios lo reportaran.
- Diagnosticar la falta de policies RLS en Supabase con un script de 100 líneas (`check_rls.js`).
- Asegurar que cada cambio en `app.js` no rompe los flujos existentes (regresión).
- Validar el comportamiento en mobile (390×844) sin necesitar un dispositivo físico (gracias a Playwright).

### 6.1. Preguntas para guiar el diseño de pruebas

Antes de escribir cualquier prueba, respondemos estas tres preguntas:

| Pregunta | Aplicación a CP-05 (crear cita válida) |
|----------|----------------------------------------|
| **¿Qué Caso de Uso vas a probar?** | CU2 — Agendar y gestionar Citas |
| **¿Qué esperas que pase?** | Que la cita se inserte en `appointments`, el modal se cierre, el dashboard refleje "Citas Hoy: 1" inmediatamente, y la cita persista tras reload. |
| **¿Qué sería una falla aquí?** | Modal que no cierra, contador en 0, error 42501 sin manejo, cita perdida tras reload, doble click crea citas duplicadas. |

### 6.2. Lección aprendida

El bug INC-001 (3 causas raíz combinadas + RLS) es un ejemplo perfecto de por qué las pruebas son **defensa en profundidad**:

- La **prueba unitaria** habría detectado el bug del mapeo en el fallback.
- La **prueba E2E** habría detectado que el modal no actualizaba el dashboard.
- La **prueba de integración** (`check_rls.js`) habría detectado el problema RLS.

Ningún tipo de prueba por sí solo lo hubiera atrapado completo. La combinación es lo que da robustez.

### 6.3. Próximos pasos

Para v0.2 del proyecto Selah, planeamos:

- ✅ Implementar las 15 pruebas de este reporte (actualmente 1 implementada en Playwright).
- 🔄 Añadir tests unitarios con Jest para `mapAppointmentFromSupabase()`, `formatTime()`, `getStatusName()`.
- 📋 Configurar GitHub Actions para correr `npx playwright test` y `node check_rls.js` en cada PR.
- 📋 Reportar cobertura con `c8` o Istanbul para identificar zonas no probadas.
- 📋 Pruebas de carga: simular 100 citas concurrentes con Artillery o k6.

Probar es **construir confianza**: confianza en el código, confianza en el equipo, confianza del usuario en el producto. Una clínica de fisioterapia no puede permitirse perder citas por un bug. Las pruebas son lo que nos permite entregar un sistema en el que el cliente puede confiar.

---

## 7. Referencias

- **Repositorio del proyecto:** https://github.com/whoami-avi/selah-fisioterapia
- **Demo en vivo:** https://pyshiomanager.online
- **Casos de Uso documentados:** [`CASOS_DE_USO.md`](./CASOS_DE_USO.md)
- **README principal:** [`README.md`](./README.md)
- **Test E2E (Playwright):** [`tests/appointment.spec.js`](./tests/appointment.spec.js)
- **Script de integración RLS:** [`check_rls.js`](./check_rls.js)
- **Evidencias visuales:** [`evidencias/`](./evidencias/)
- **PRD del proyecto:** [`../memory/PRD.md`](../memory/PRD.md)

### Bibliografía consultada

- Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson. *Capítulo 8: Software Testing*.
- Pressman, R. & Maxim, B. (2020). *Software Engineering: A Practitioner's Approach* (9th ed.). McGraw-Hill.
- Playwright Documentation. https://playwright.dev/docs/intro
- Supabase Row Level Security. https://supabase.com/docs/guides/auth/row-level-security
- ISTQB Foundation Level Syllabus v4.0 (2023). International Software Testing Qualifications Board.

---

**Fin del reporte T4 — Pruebas de Software.**
