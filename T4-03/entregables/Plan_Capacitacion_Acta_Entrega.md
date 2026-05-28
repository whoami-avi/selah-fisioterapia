# Plan de Capacitación + Acta de Entrega

**Proyecto:** Selah Fisioterapia & Recovery — v1.0
**Equipo:** TecHome dev's
- Jefte Abimael López Jarquín — Líder técnico / Capacitador principal ([@whoami-avi](https://github.com/whoami-avi))
- Francisco Javier Jijón Cruz — Frontend / Apoyo en demo
- Adrián de Jesús Avendaño — QA / Soporte técnico de la sesión
- Perla Emigdalia García Castellanos — Documentación / Manual de usuario
**Repositorio:** https://github.com/whoami-avi/selah-fisioterapia
**Demo:** https://pyshiomanager.online

---

## A) Plan de Capacitación

| Campo | Valor |
|-------|-------|
| **Objetivo de la capacitación** | Que el personal de la clínica (Administradora y Asistente) sea capaz de operar el sistema Selah Fisioterapia de forma autónoma: gestionar pacientes, agendar y modificar citas, consultar el Dashboard, marcar pagos y enviar mensajes por WhatsApp, **sin asistencia del equipo de desarrollo y con tasa de error < 10 %** durante la evaluación. |
| **Dirigido a (roles)** | • Administradora — Dra. Selah (rol `admin`) <br>• Asistente recepcionista — Lupita Hernández (rol `asistente`) |
| **Duración** | 60 minutos · sesión presencial en la clínica |
| **Fecha** | 27 de mayo de 2026 — 13:00 a 14:00 hrs |
| **Lugar** | Clínica Selah Fisioterapia (presencial) + soporte digital posterior vía WhatsApp |

### A.1. Agenda minuto a minuto

| Tiempo | Tema | Actividad | Material |
|:------:|------|-----------|----------|
| **00:00 – 00:05** (5') | **Bienvenida y objetivo de la sesión** | Capacitador presenta el alcance del sistema y los objetivos de la capacitación. Aclara que la sesión termina con una evaluación práctica corta. | Slide 1 (objetivo) · Manual de Usuario impreso entregado en mano |
| **00:05 – 00:15** (10') | **Tour general del sistema** | Recorrido guiado por las 6 secciones del menú (Dashboard, Pacientes, Agenda, Finanzas, WhatsApp/Plantillas, Usuarios) explicando para qué sirve cada una y quién tiene acceso. | Proyector · sistema en pantalla · Manual §3 |
| **00:15 – 00:25** (10') | **Demostración del flujo principal** | El capacitador ejecuta en vivo el flujo completo: <br>1) Login → 2) Crear paciente "María Pérez" → 3) Agendar cita hoy 15:30 → 4) Verificar Dashboard → 5) Marcar como pagada → 6) Enviar WhatsApp con plantilla "Recordatorio 24h". | Sistema en proyector · datos de prueba |
| **00:25 – 00:45** (20') | **Práctica guiada (los usuarios repiten los pasos)** | Cada participante toma su dispositivo (laptop admin / tablet asistente) y repite el flujo demostrado con datos diferentes. El capacitador acompaña sin tocar el teclado, solo guiando verbalmente. Si surgen dudas se resuelven en el momento y se anotan en el rotafolio. | Laptop de la admin · tablet de la asistente · Manual de Usuario impreso · rotafolio para notas |
| **00:45 – 00:55** (10') | **Errores comunes y cómo resolverlos** | Capacitador provoca los 3 errores más frecuentes y muestra cómo resolverlos: <br>(a) "Usuario o contraseña incorrectos" <br>(b) Cita con paciente sin teléfono al enviar WhatsApp <br>(c) Doble click en Guardar | Manual §4 (tabla de errores comunes) |
| **00:55 – 01:00** (5') | **Evaluación rápida + cierre** | Aplicar el checklist de 3 preguntas/tareas (sección A.3). Firma del acta de entrega. Recordar canal de soporte (Issues de GitHub + WhatsApp del equipo). | Hoja de evaluación · acta de entrega impresa · tarjetas con credenciales selladas |

### A.2. Material entregado al cliente al finalizar

- ☑ **Manual de Usuario impreso** (versión v1.0, PDF también enviado por correo).
- ☑ **Manual Técnico digital** (PDF + enlace al repositorio).
- ☑ **Tarjeta sellada con las credenciales** de admin y asistente.
- ☑ **Ícono PWA instalado** en el escritorio de la laptop de la admin y en la pantalla de inicio de la tablet de la asistente.
- ☑ **URL marcada como favorito** en los navegadores de ambos dispositivos.
- ☑ **Tarjeta de contacto del equipo** de soporte (correo, WhatsApp, GitHub).

### A.3. Evaluación rápida de aprendizaje (3 preguntas / checklist)

| # | Pregunta / Criterio | Respuesta esperada | Observaciones |
|:-:|---------------------|---------------------|----------------|
| **1** | **(Práctica)** Sin ayuda, el participante debe **registrar un paciente nuevo** llamado "Juan Pérez", teléfono `+52 33 1234 5678`, terapia "Rehabilitación", y guardarlo. | El paciente aparece en la lista. El contador "Total Pacientes" sube en 1. Tiempo límite: 2 minutos. | Si no logra completarlo, se anota en *Pendientes* y se le brinda refuerzo. |
| **2** | **(Práctica)** Sin ayuda, **agendar una cita** para Juan Pérez hoy a las 16:00, duración 45 min, costo $500, estado de pago "Pendiente", y verificar que aparezca en el Dashboard. | El toast verde "Cita guardada" se muestra. En el Dashboard aparece "16:00 — Juan Pérez". Tiempo límite: 2 minutos. | Esta es la tarea más crítica: si falla, repetir hasta que la haga bien (no se cierra la sesión hasta lograrlo). |
| **3** | **(Conceptual)** ¿Qué haces si **el sistema te muestra "Sin conexión"** mientras agendas una cita? | "Sigo trabajando normal porque la app funciona offline. La cita se guarda en mi dispositivo y se sincronizará automáticamente cuando vuelva la conexión." | Validar comprensión de la PWA + fallback offline. |
| **4** (extra)| **(Conceptual)** ¿Por qué la asistente **no ve el menú Finanzas**? | "Porque su rol es 'asistente', y Finanzas solo está disponible para el rol 'admin'." | Validar comprensión del modelo de roles. |
| **5** (extra) | **(Práctica)** Enviar un **mensaje de recordatorio por WhatsApp** a Juan Pérez usando la plantilla *Recordatorio 24h*. | Se abre `wa.me` en una nueva pestaña con el mensaje prellenado conteniendo el nombre y la hora de la cita. | Si el paciente no tiene teléfono, mostrar cómo editar el paciente para añadirlo. |

**Criterio de aprobación de la capacitación:** los participantes deben completar **al menos 3 de las 5 tareas/preguntas correctamente** y sin asistencia. El criterio mínimo obligatorio es completar las tareas 1 y 2 (las dos prácticas más críticas del negocio).

### A.4. Evidencias de capacitación (a recolectar el día de la sesión)

| ✅ | Evidencia | Cómo se obtiene |
|---|-----------|-----------------|
| ☑ | **Lista de asistencia** | Hoja con nombre, rol y firma de cada asistente. Se archiva en `evidencias_capacitacion/lista_asistencia.pdf`. |
| ☑ | **Capturas / fotos** | Foto de los participantes operando el sistema durante la práctica guiada. Mínimo 3 fotos. Se guardan en `evidencias_capacitacion/fotos/`. |
| ☐ | **Grabación de pantalla** (opcional) | Captura de pantalla en video (5-10 min) durante el flujo demostrado por el capacitador. Útil para futuras consultas. Se guarda en `evidencias_capacitacion/screencast.mp4`. |
| ☑ | **Material entregado en formato PDF** | Manual de Usuario y Manual Técnico en PDF, enviados al correo de la admin (`admin@selah.com`). |
| ☑ | **Hoja de evaluación rápida llenada** | Documento con las 5 preguntas/tareas, marcando ✅/❌ por participante. Se archiva como `evidencias_capacitacion/evaluacion_rapida.pdf`. |

---

## B) Acta de Entrega

| Campo | Valor |
|-------|-------|
| **Fecha** | 27 de mayo de 2026 |
| **Lugar / Modalidad** | Clínica Selah Fisioterapia — Av. Principal #123, Local 4 · Modalidad: presencial + entrega digital |
| **Sistema entregado (versión)** | **Selah Fisioterapia & Recovery — v1.0** |
| **Repositorio / URL** | • Producción: https://pyshiomanager.online <br>• Repositorio: https://github.com/whoami-avi/selah-fisioterapia <br>• Tag GitHub: `v1.0` |

### Declaración

Se hace constar que en la fecha y lugar arriba indicados, **TecHome dev's** entrega formalmente a **Clínica Selah Fisioterapia** el sistema **Selah Fisioterapia & Recovery v1.0**, junto con la documentación y capacitación que se detallan a continuación, quedando conforme el usuario responsable.

### Entregables incluidos en esta acta

| ✅ | Entregable | Formato | Ubicación |
|---|------------|---------|-----------|
| ☑ | Release final desplegado en producción | Sitio web PWA (HTTPS) | https://pyshiomanager.online |
| ☑ | Código fuente con tag `v1.0` | Repositorio Git | https://github.com/whoami-avi/selah-fisioterapia/releases/tag/v1.0 |
| ☑ | Manual de Usuario | PDF + impreso | `Manual_Usuario_Selah_v1.0.docx` (40+ páginas con capturas) |
| ☑ | Manual Técnico | PDF | `Manual_Tecnico_Selah_v1.0.docx` (instalación, BD, despliegue) |
| ☑ | Plan de Capacitación con agenda | PDF | §A de este documento |
| ☑ | Reporte Final del Proyecto T4-03 | PDF | `T4-03_Reporte_Final.docx` |
| ☑ | Informe de Incidencias T4-02 | PDF + Excel | `INFORME_T4-02_Incidencias.docx` + `T4-02_Tabla_Incidencias.xlsx` |
| ☑ | Credenciales iniciales del sistema | Tarjeta sellada física | Entregada en mano a la Administradora |
| ☑ | Backups iniciales | Snapshot Supabase | Activado el respaldo diario automático del plan Free |

### Conformidad y firmas

> Las firmas se recogen físicamente al final de la sesión de capacitación. Pueden sustituirse por evidencia digital (correo de aceptación, captura de WhatsApp confirmando recepción).

| Nombre completo | Rol | Firma (o evidencia digital) | Contacto |
|-----------------|-----|------------------------------|----------|
| **Dra. Selah Martínez** | Administradora / Propietaria — Cliente receptor | _____________________________ | admin@selah.com · WhatsApp +52 33 ▒▒▒▒ ▒▒▒▒ |
| **Lupita Hernández** | Asistente de recepción — Usuario operativo | _____________________________ | info@selah.com · WhatsApp +52 33 ▒▒▒▒ ▒▒▒▒ |
| **Jefte Abimael López Jarquín** | Líder técnico / Capacitador — TecHome dev's | _____________________________ | GitHub @whoami-avi |
| **Francisco Javier Jijón Cruz** | Frontend / Apoyo demo — TecHome dev's | _____________________________ | — |
| **Adrián de Jesús Avendaño** | QA / Soporte técnico — TecHome dev's | _____________________________ | — |
| **Perla Emigdalia García Castellanos** | Documentación / Manual de usuario — TecHome dev's | _____________________________ | — |
| **(Opcional) Testigo** | Testigo presencial | _____________________________ | — |

### Pendientes y limitaciones reconocidos al momento de la entrega

| # | Pendiente | Categoría | Plan de cierre |
|---|-----------|-----------|-----------------|
| 1 | **Migración de contraseñas a `supabase.auth` con bcrypt** | Seguridad (INC-006) | v1.1 — junio 2026 — esfuerzo 4 h |
| 2 | **Sanitización HTML para prevenir XSS** | Seguridad (INC-007) | v1.1 — junio 2026 — esfuerzo 3 h |
| 3 | **Validación de conflictos de horario** (no permite citas solapadas) | Funcionalidad (INC-010) | v1.1 — junio 2026 — esfuerzo 2 h |
| 4 | **Null-check en envío de WhatsApp** sin teléfono | UX (INC-008) | v1.1 — junio 2026 — esfuerzo 30 min |
| 5 | **`replaceAll` en plantillas** WhatsApp | Funcionalidad (INC-009) | v1.1 — junio 2026 — esfuerzo 15 min |
| 6 | **Re-render del gráfico de Finanzas** al cambiar estado de pago | UX (INC-004) | v1.1 — junio 2026 — esfuerzo 30 min |
| 7 | **Exportación a PDF/Excel** de reportes | Funcionalidad nueva | v1.2 — Q3 2026 |
| 8 | **Notificaciones push automáticas** para recordatorios 24 h | Funcionalidad nueva | v1.2 — Q3 2026 |

**Aceptación del cliente sobre los pendientes:** la Administradora acepta el sistema en su estado actual (v1.0) reconociendo los pendientes listados arriba, los cuales serán abordados en las versiones v1.1 y v1.2 sin costo adicional dentro de los siguientes 90 días.

### Condiciones de soporte post-entrega

| Período | Cobertura |
|---------|-----------|
| **0 – 30 días** | Soporte completo sin costo: corrección de bugs reportados, dudas operativas, ajustes menores. |
| **31 – 90 días** | Soporte de mantenimiento: solo corrección de incidencias críticas (P1) y entrega de v1.1. |
| **> 90 días** | Soporte bajo acuerdo separado (a definir entre las partes). |

**Canal oficial de reportes:** https://github.com/whoami-avi/selah-fisioterapia/issues
**Canal urgente (P1):** WhatsApp directo al equipo TecHome dev's.

### Cláusula de cierre

Con la firma de este documento, el cliente (**Clínica Selah Fisioterapia**) declara haber recibido el sistema funcionando, la documentación completa y la capacitación efectiva del personal designado. El equipo de desarrollo (**TecHome dev's**) declara haber entregado todos los componentes listados y se compromete al soporte indicado en el período acordado.

---

**Lugar y fecha de firma:** Clínica Selah Fisioterapia, 27 de mayo de 2026.

**Fin del Plan de Capacitación + Acta de Entrega — v1.0.**
