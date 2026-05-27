# T4-02 — Resumen de Pruebas (1 página)
**Proyecto:** Selah Fisioterapia & Recovery · **Release:** v0.1 · **Equipo:** TecHome dev's · **Fecha:** 27-mayo-2026

---

## Casos de prueba ejecutados

| Total CP | Pass ✅ | Fail ❌ | Tasa éxito |
|----------|---------|---------|------------|
| **20** | **11** | **9** | **55 %** |

> 15 CP del documento base T4 + 5 CP adicionales (CP-16 a CP-20) obtenidos por revisión estática de `app.js`.

### Desglose por Caso de Uso

| CU | CP | Pass | Fail |
|----|----|----|----|
| CU-01 Pacientes | 4 | 4 | 0 |
| CU-02 Citas | 7 | 4 | 3 |
| CU-03 Dashboard | 2 | 1 | 1 |
| CU-04 Finanzas | 2 | 1 | 1 |
| CU-05 WhatsApp | 3 | 1 | 2 |
| RNF Seguridad | 2 | 0 | 2 |

---

## Top 3 incidencias P1 (más críticas)

| # | ID | Título | Severidad | Estado |
|---|----|--------|-----------|--------|
| 🥇 | **INC-002** | INSERT en `appointments` falla con error 42501 (RLS) | 🔴 Crítica | ✅ **Cerrada** |
| 🥈 | **INC-006** | Contraseñas almacenadas y comparadas en texto plano | 🔴 Crítica | 🆕 Nueva |
| 🥉 | **INC-007** | Vulnerabilidad XSS por `innerHTML` sin escape | 🟠 Alta | 🆕 Nueva |

---

## Defectos corregidos vs pendientes

### ✅ Corregidos (3)

| ID | Título | Fix aplicado |
|----|--------|--------------|
| **INC-001** | Dashboard no actualiza tras crear cita | `await` en `saveAppointment` + fix de `refreshCurrentSection` + mapeo en fallback |
| **INC-002** | RLS bloquea INSERT (error 42501) | `supabase_rls_appointments.sql` ejecutado en Supabase |
| **INC-003** | Doble click crea citas duplicadas | Spinner + `disabled` en submitBtn y todos los inputs durante el save |

### 🔄 En proceso (1)

| ID | Título | Acción pendiente |
|----|--------|------------------|
| **INC-004** | Gráfico Finanzas no se redibuja | Falta llamar `renderFinanceDashboard()` en callback de update |

### 🆕 Nuevas / pendientes (6)

| ID | Título | Severidad | Prioridad |
|----|--------|-----------|-----------|
| **INC-005** | Flicker en realtime Dashboard | 🟢 Baja | P3 |
| **INC-006** | Passwords en texto plano | 🔴 Crítica | **P1** |
| **INC-007** | XSS por innerHTML | 🟠 Alta | **P1** |
| **INC-008** | TypeError sendWhatsApp sin teléfono | 🟠 Alta | P2 |
| **INC-009** | `.replace()` no reemplaza todas las variables | 🟡 Media | P2 |
| **INC-010** | Sin validación de overbooking | 🟡 Media | P2 |

---

## Veredicto

- ✅ **CU-02 (Citas)** desbloqueado: las 3 incidencias P1 históricas están **cerradas**.
- ⚠️ **2 nuevas vulnerabilidades críticas de seguridad** (INC-006 y INC-007) deben corregirse antes de cualquier despliegue público.
- 📊 La deuda total de calidad para v0.2 = **~13 h** de trabajo distribuidas entre seguridad, validaciones y rendimiento.

> Detalle completo: ver [`INFORME_T4-02_Incidencias.md`](./INFORME_T4-02_Incidencias.md) y [`T4-02_Tabla_Incidencias.csv`](./T4-02_Tabla_Incidencias.csv).
