# Manual de Usuario

**Sistema:** Selah Fisioterapia & Recovery
**Versión:** v1.0
**Fecha:** 27 de mayo de 2026
**Dirigido a:** Administrador (fisioterapeuta titular) y Asistente de recepción
**Demo:** https://pyshiomanager.online

---

## 0. Portada

| | |
|---|---|
| **Sistema** | Selah Fisioterapia & Recovery |
| **Versión** | v1.0 |
| **Fecha** | 27-mayo-2026 |
| **Dirigido a** | Administrador (acceso total) · Asistente de recepción (acceso limitado) |
| **Equipo de desarrollo** | TecHome dev's: Jefte Abimael López Jarquín · Francisco Javier Jijón Cruz · Adrián de Jesús Avendaño · Perla Emigdalia García Castellanos |
| **Soporte** | https://github.com/whoami-avi/selah-fisioterapia/issues |

---

## 1. Requisitos y acceso

### 1.1. Dispositivo y navegador recomendado

- **Computadora o tablet** con resolución mínima 1024 × 768 (también funciona en celular).
- **Navegador:** Google Chrome 121+ (recomendado), Microsoft Edge 121+, Firefox 124+ o Safari 17+.
- **Conexión a internet** activa al inicio de la jornada (después puede operar offline gracias a la PWA).

### 1.2. URL de acceso

| Entorno | URL |
|---------|-----|
| **Producción** | https://pyshiomanager.online |
| **Repositorio** | https://github.com/whoami-avi/selah-fisioterapia |

### 1.3. Credenciales iniciales

| Rol | Usuario | Contraseña inicial |
|-----|---------|---------------------|
| Administrador | `admin` (o email `admin@selah.com`) | `selah2024` |
| Asistente | `selah` (o email `info@selah.com`) | `fisio123` |

> ⚠️ **Cambia tu contraseña en la primera sesión** desde *Usuarios → Editar*. Anótala en un lugar seguro.

### 1.4. Política de contraseñas recomendada

- Mínimo **8 caracteres**, con al menos una mayúscula y un número.
- No reutilizar contraseñas de otros servicios.
- Cambiar cada **6 meses** o si se sospecha que alguien externo la conoce.

### 1.5. Instalación como app (PWA)

Una vez dentro del sistema desde Chrome o Edge:
1. Verás un ícono **"Instalar"** en la barra de direcciones (a la derecha de la URL).
2. Haz click → "Instalar".
3. El sistema se agregará al escritorio / pantalla de inicio como una app independiente.

---

## 2. Flujo rápido (en 5 minutos)

Para que la asistente atienda al primer paciente del día:

| # | Acción | Resultado |
|---|--------|-----------|
| **1** | Abrir https://pyshiomanager.online → Iniciar sesión con `admin` / `selah2024` | Se muestra el Dashboard con citas de hoy. |
| **2** | Click en **Pacientes** → **+ Nuevo Paciente** → llenar nombre y teléfono → Guardar | El paciente aparece en la lista. |
| **3** | Click en **+ Nueva Cita** → seleccionar al paciente, fecha de hoy, hora, costo → Guardar | La cita aparece en el Dashboard ("Citas Hoy: 1"). |
| **4** | Al finalizar la sesión: abrir la cita → cambiar Estado de pago a **pagado** → Guardar | Ingresos del día aumentan en el Dashboard. |
| **5** | Click en el ícono de **WhatsApp** del paciente → seleccionar plantilla "Recordatorio 24h" → Enviar | WhatsApp Web se abre con el mensaje listo. |

---

## 3. Pantallas y funciones (paso a paso con capturas)

> Las capturas referenciadas están en la carpeta `evidencias/` del repositorio.

### Función 1 — Iniciar sesión

| | |
|---|---|
| **Objetivo** | Entrar al sistema con credenciales válidas. |
| **Pasos** | 1. Abrir `https://pyshiomanager.online`. <br>2. Escribir usuario (`admin` o email) en el primer campo. <br>3. Escribir contraseña en el segundo campo. <br>4. (Opcional) Marcar *Recordarme* para que recuerde el usuario la próxima vez. <br>5. Click en **Iniciar Sesión**. |
| **Resultado esperado** | El sistema te redirige al Dashboard mostrando tu nombre arriba a la derecha. |
| **Captura** | `evidencias/01_login.jpg` |

---

### Función 2 — Ver el Dashboard del día

| | |
|---|---|
| **Objetivo** | Conocer de un vistazo qué citas hay hoy, cuántos pacientes están activos y cuánto se ha ingresado (solo admin). |
| **Pasos** | 1. Asegúrate de estar en la sección **Dashboard** (es la primera del menú lateral, ícono 🏠). <br>2. Revisa los 4 contadores superiores: *Total Pacientes*, *Citas Hoy*, *Pendientes*, *Ingresos Hoy*. <br>3. Más abajo verás la lista *Pacientes de hoy* ordenada por hora. <br>4. A la derecha, el bloque *Próximo paciente* destaca a quién toca atender. |
| **Resultado esperado** | Ver al menos un paciente listado por cada cita creada para hoy. Si no hay citas, aparece el mensaje "No hay citas programadas para hoy". |
| **Captura** | `evidencias/02_dashboard_inicial.jpg` · `evidencias/02b_dashboard_con_data_real.jpg` |

---

### Función 3 — Registrar un nuevo paciente

| | |
|---|---|
| **Objetivo** | Crear el expediente de un paciente que llega por primera vez. |
| **Pasos** | 1. Click en **Pacientes** en el menú lateral. <br>2. Click en el botón **+ Nuevo Paciente** (arriba a la derecha). <br>3. Llenar el formulario:<br>   • **Nombre** (obligatorio).<br>   • **Teléfono** (recomendado para WhatsApp, formato `+52 33 1234 5678`).<br>   • **Email** (opcional).<br>   • **Tipo de terapia** (Fisioterapia / Rehabilitación / Masaje).<br>   • **Zona del cuerpo** (Espalda / Hombro / Rodilla / …).<br>   • **Historial médico**, **Motivo de consulta**.<br>   • **Contacto de emergencia** (nombre y teléfono). <br>4. Click en **Guardar**. |
| **Resultado esperado** | El paciente aparece en la lista. El contador *Total Pacientes* sube en 1. La asistente lo ve aparecer en su tablet sin recargar. |
| **Captura** | `evidencias/03_lista_pacientes.jpg` |

---

### Función 4 — Agendar una cita

| | |
|---|---|
| **Objetivo** | Reservar una sesión de terapia para un paciente. |
| **Pasos** | 1. Click en **+ Nueva Cita** desde el Dashboard o desde la sección **Agenda**. <br>2. Seleccionar:<br>   • **Paciente** (lista desplegable; obligatorio).<br>   • **Fecha** (por defecto, hoy).<br>   • **Hora** (formato 24 h, ej. `14:30`).<br>   • **Duración** (15, 30, 45, 60 o 90 min).<br>   • **Tipo de terapia**.<br>   • **Estado** (Pendiente / Confirmada / Completada / Cancelada).<br>   • **Costo** ($) y **Método de pago** (Efectivo / Transferencia / Tarjeta).<br>   • **Estado de pago** (Pendiente / Parcial / Pagado).<br>   • **Notas** (opcional, ej. "Llega 10 min antes"). <br>3. Click en **Guardar**. El botón mostrará un spinner *"Guardando…"* mientras procesa. |
| **Resultado esperado** | El modal se cierra, aparece el toast verde *"Cita guardada"*, el Dashboard refleja la nueva cita en *Pacientes de hoy* (si es hoy) y los contadores se actualizan. |
| **Captura** | `evidencias/04_modal_nueva_cita.jpg` · `evidencias/05_formulario_cita_lleno.jpg` · `evidencias/06_cita_creada_dashboard.jpg` |

---

### Función 5 — Editar o eliminar una cita

| | |
|---|---|
| **Objetivo** | Cambiar la hora/estado de una cita ya creada, o eliminarla si el paciente canceló. |
| **Pasos (editar)** | 1. Ir a **Agenda** y hacer click sobre el bloque azul de la cita. <br>2. El modal se abre con todos los datos prellenados. <br>3. Cambiar lo necesario (ej. la hora) y click en **Guardar**. |
| **Pasos (eliminar)** | 1. Abrir la cita igual que para editar. <br>2. Click en el botón rojo **Eliminar** (abajo del modal). <br>3. Confirmar el mensaje *"¿Eliminar esta cita?"* → **Aceptar**. |
| **Resultado esperado** | La cita actualiza/desaparece de la Agenda y del Dashboard. El toast verde confirma la acción. |
| **Captura** | `evidencias/10_agenda_calendario.jpg` |

---

### Función 6 — Marcar una cita como pagada (Finanzas — solo Admin)

| | |
|---|---|
| **Objetivo** | Registrar el cobro al terminar la sesión del paciente. |
| **Pasos** | 1. Click en **Finanzas** en el menú lateral (visible solo para el rol admin). <br>2. Localizar la cita pendiente en la sección *Pagos pendientes*. <br>3. Click sobre la cita → se abre el modal de edición. <br>4. Cambiar **Estado de pago** a **Pagado** → Guardar. |
| **Resultado esperado** | El monto se suma a *Ingresos Hoy* en el Dashboard. La cita desaparece de *Pagos pendientes* y se cuenta en el gráfico *Ingresos por método de pago*. |
| **Captura** | `evidencias/11_finanzas.jpg` |

---

### Función 7 — Enviar un mensaje por WhatsApp con plantilla

| | |
|---|---|
| **Objetivo** | Enviar un recordatorio, confirmación o agradecimiento al paciente con un solo click. |
| **Pasos** | 1. Click en **Plantillas** o en el ícono de WhatsApp del listado de pacientes. <br>2. Seleccionar el paciente destinatario. <br>3. Seleccionar la plantilla (ej. *"Recordatorio 24h"*). <br>4. El sistema reemplaza automáticamente las variables `{nombre}`, `{fecha}`, `{hora}`, `{terapia}` con los datos reales. <br>5. Click en **Enviar**. |
| **Resultado esperado** | Se abre una nueva pestaña con WhatsApp Web (o la app móvil) con el mensaje listo. El paciente solo recibe el mensaje cuando tú das *Enviar* dentro de WhatsApp. |
| **Captura** | `evidencias/14_whatsapp_templates.jpg` |

---

### Función 8 — Buscar un paciente

| | |
|---|---|
| **Objetivo** | Localizar rápidamente a un paciente entre decenas o cientos. |
| **Pasos** | 1. Ir a **Pacientes**. <br>2. En el campo de búsqueda superior, escribir nombre o teléfono. <br>3. La lista se filtra automáticamente conforme escribes (sin necesidad de presionar Enter). |
| **Resultado esperado** | Solo aparecen los pacientes que coinciden con el texto. Si no hay coincidencias se muestra "No se encontraron pacientes". |
| **Captura** | `evidencias/03_lista_pacientes.jpg` |

---

### Función 9 — Vista móvil (tablet de la asistente)

| | |
|---|---|
| **Objetivo** | Usar el sistema desde una tablet o celular en el área de recepción. |
| **Pasos** | 1. Abrir Chrome o Safari en el dispositivo móvil. <br>2. Navegar a https://pyshiomanager.online y hacer login. <br>3. Tocar el ícono ☰ (menú hamburguesa) arriba a la izquierda para mostrar el menú lateral. <br>4. Para instalar como app: menú del navegador → *Agregar a pantalla de inicio*. |
| **Resultado esperado** | El sistema se adapta automáticamente al tamaño de pantalla. Todas las funciones están disponibles. |
| **Captura** | `evidencias/13_vista_movil_dashboard.jpg` · `evidencias/16_movil_pacientes.jpg` · `evidencias/17_movil_agenda.jpg` |

---

### Función 10 — Gestionar usuarios (solo Admin)

| | |
|---|---|
| **Objetivo** | Crear cuentas para nuevos asistentes o cambiar contraseñas. |
| **Pasos** | 1. Menú lateral → **Usuarios** (solo visible para admin). <br>2. Click en **+ Nuevo Usuario** o sobre la tarjeta de un usuario existente para editar. <br>3. Llenar: nombre completo, usuario (sin espacios, minúsculas), email, contraseña, rol (admin / asistente). <br>4. Guardar. |
| **Resultado esperado** | El nuevo usuario puede iniciar sesión inmediatamente con esas credenciales. |
| **Captura** | `evidencias/15_usuarios.jpg` |

---

## 4. Mensajes de error comunes y qué hacer

| Mensaje | Causa probable | Acción recomendada |
|---------|----------------|--------------------|
| **"Usuario o contraseña incorrectos"** | Tipeaste mal la contraseña, o el bloqueo de mayúsculas (Caps Lock) está activado. | Revisa que *Bloq Mayús* esté apagado. Vuelve a intentar. Si lo olvidaste, pide al admin que te la reinicie desde *Usuarios → Editar*. |
| **"Error al guardar la cita. Inténtalo de nuevo."** (toast rojo) | La conexión a Supabase falló o las políticas RLS no permiten el INSERT. | Verifica tu conexión a internet (ícono en la esquina inferior izquierda). Si dice *Sin conexión*, espera unos segundos: la cita se guardará en local y se sincronizará al volver online. Si el problema persiste, contacta soporte. |
| **"No hay citas programadas para hoy"** | Realmente no hay citas, o estás viendo el día incorrecto. | Ir a **Agenda** y revisar la fecha en la cabecera. Para crear una cita: click en **+ Nueva Cita**. |
| **El Dashboard no se actualiza** tras crear una cita | Posiblemente el navegador cacheó una versión anterior. | Presiona `Ctrl + F5` (Windows) o `Cmd + Shift + R` (Mac) para refrescar forzando recarga. |
| **No veo la sección "Finanzas"** | Tu rol es *asistente*, no *admin* (las finanzas son confidenciales). | Pide al admin que cambie tu rol si necesitas acceso, desde *Usuarios → Editar*. |
| **El ícono de WhatsApp abre una pantalla en blanco** | El paciente no tiene número de teléfono registrado. | Edita al paciente → llena el campo *Teléfono* con formato internacional (`+52...`) → Guardar. |
| **Cita aparece duplicada** | Hiciste doble click en *Guardar*. | Abrir una de las duplicadas → click en **Eliminar** → confirmar. (Este bug está corregido en v1.0 con un spinner que bloquea el doble click). |
| **Aparece "Sin conexión" en la esquina** | Te quedaste sin internet o Supabase no responde. | El sistema sigue funcionando en modo offline con localStorage. Al volver la conexión, todo se sincroniza automáticamente. No cierres el navegador hasta que el ícono vuelva a verde. |

---

## 5. Preguntas frecuentes (FAQ)

**¿Puedo usar el sistema sin internet?**
Sí, parcialmente. Una vez iniciada la sesión, puedes seguir consultando datos y crear citas/pacientes en modo offline; el sistema los guarda en el navegador y los sincroniza con la nube en cuanto vuelve la conexión. Lo que **no** funciona sin internet: enviar WhatsApp, gráficos de finanzas en tiempo real con el otro dispositivo.

**¿Cuántos dispositivos pueden trabajar al mismo tiempo?**
No hay límite técnico, pero está pensado para 2: una laptop/PC del fisioterapeuta (admin) y una tablet/celular de la asistente. Los cambios se sincronizan en tiempo real (≈ 1 segundo) entre ambos dispositivos.

**¿Puedo instalar Selah como una app en mi celular?**
Sí. Abre la URL en Chrome (Android) o Safari (iPhone) → menú del navegador → *Agregar a pantalla de inicio* → confirmar. Aparecerá como una app más, con su propio ícono, sin barra de navegador.

**¿Cómo cambio mi propia contraseña?**
Por ahora desde *Usuarios* → click en tu propia tarjeta → modificar el campo *Contraseña* → Guardar. (En v1.1 habrá una pantalla dedicada de *Mi perfil*).

**¿Qué pasa si elimino a un paciente por accidente?**
Se eliminan también sus citas (en cascada). **No hay deshacer**. Si fue por error, contacta a soporte: existe un respaldo diario en Supabase del que se puede restaurar (hasta 7 días).

**¿Puedo exportar la lista de pacientes a Excel?**
En v1.0 todavía no (está en el roadmap v1.1). Mientras tanto, el equipo técnico puede entregártela como CSV si la pides por GitHub Issues.

**¿Por qué no veo el menú "Finanzas"?**
Porque tu rol es *asistente*. Los datos financieros solo son visibles para el rol *admin*. Si necesitas acceso, pide al admin que cambie tu rol.

**¿Mi información está segura?**
Los datos viven en Supabase (PostgreSQL en la nube) con Row Level Security activado para `appointments`. La conexión es por HTTPS. Recomendaciones: cambia las contraseñas por defecto, no compartas tu cuenta y cierra sesión cuando dejes la computadora desatendida.

**¿Quién mantiene el sistema?**
TecHome dev's (equipo de 4 integrantes: Jefte Abimael López Jarquín, Francisco Javier Jijón Cruz, Adrián de Jesús Avendaño y Perla Emigdalia García Castellanos). Para reportar bugs o pedir nuevas funciones, abre un Issue en https://github.com/whoami-avi/selah-fisioterapia/issues o contacta directamente al equipo.

**¿Cada cuánto se actualiza?**
La próxima versión (v1.1) está planeada con mejoras de seguridad, exportes y notificaciones push. Verás un aviso en la app cuando esté lista.

---

**Fin del Manual de Usuario — v1.0.**
