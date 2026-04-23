# Hola bienvenido a este repo ! 😎
# ¿Que es Selah-Fisioterapia?

> 🎉 **Release v0.1 disponible.** Para instrucciones de instalación, casos de uso y evidencias, ver [`physio-manager/README.md`](./physio-manager/README.md).

Selah Fisioterapia & Recovery
🏥 

Es una aplicación web progresiva (PWA) diseñada para la gestión integral de una clínica de fisioterapia. 

Permite administrar pacientes, citas, finanzas y comunicación con pacientes a través de WhatsApp, todo en una interfaz moderna y fácil de usar.

La aplicación cuenta con sincronización en tiempo real mediante Supabase, lo que permite que múltiples dispositivos (admin y asistente) trabajen simultáneamente con los mismos datos. 
* Es responsive y puede instalarse en cualquier dispositivo como una aplicación nativa.


## Documentacion:



✨ Características Principales:

**Gestión de Pacientes:**
* Registro completo de pacientes con datos personales, historial 
médico y diagnóstico
* Seguimiento de evolución del paciente con línea de tiempo
* Historial de citas y tratamientos
* Información de contacto de emergencia
* Búsqueda y filtrado rápido de pacientes

**Agenda y Citas:**
* Calendario semanal y diario con vista de horarios
* Creación rápida de citas con arrastrar y soltar
* Estados de cita: programada 📆, en progreso ☑️, completada ✅, cancelada ❌
* Recordatorios automáticos 🙂‍↔️
* Vista de disponibilidad

**Dashboard Financiero (Solo Admin):**
* Resumen de ingresos diarios, semanales y mensuales
* Gráficos interactivos
* Estadísticas de pacientes y citas
* Reportes de ventas por período

**Integración WhatsApp:**
* Envío de mensajes personalizados a pacientes
* Plantillas predefinidas para comunicación frecuente
* Historial de mensajes enviados
* Integración directa con WhatsApp Web

**Sistema de Usuarios:**
* Dos roles: Administrador y Asistente
* Dashboard completo para administrador
* Permisos diferenciados por rol
* Inicio de sesión seguro

**PWA (Progressive Web App):**
* Instalable en cualquier dispositivo
* Funciona offline (modo local)
* Sincronización automática cuando hay conexión
* Notificaciones push (futuro)

**Control de Versiones**
* Sistema de actualizaciones integrado
* Notificaciones de nueva versión
* Historial de cambios

## Instalación PWA:

Una PWA (Progressive Web App o Aplicación Web Progresiva) es un tipo de software de aplicación entregado a través de la web, diseñado para ofrecer una experiencia similar a una app nativa en móviles y escritorio. 

**Navegadores Soportados**:
* Google Chrome (recomendado)
* Mozilla Firefox
* Microsoft Edge
* Safari (iOS/macOS)


🔧 Requisitos Técnicos:
-
**Frontend**:
* HTML5, CSS3, JavaScript (ES6+)
* Supabase JavaScript SDK v2
* Chart.js para gráficos
* No requiere frameworks adicionales

**Backend**:
* Supabase ( PostgreSQL + Realtime + Auth )
Proyecto gratuito de Supabase


## Autores:

Equipo de Desarrrollo 
**TecHome dev´s**
- 

---

## 📦 Release v0.1 (T3-03)

Esta primera versión funcional incluye:

- ✅ **5 Casos de Uso** implementados end-to-end (ver [`physio-manager/CASOS_DE_USO.md`](./physio-manager/CASOS_DE_USO.md))
- ✅ **CRUD completo** validado contra Supabase real (Create, Read, Update, Delete)
- ✅ **Evidencias de funcionamiento** — 14 capturas en [`physio-manager/evidencias/`](./physio-manager/evidencias/)
- ✅ **Test E2E automatizado** con Playwright (pasa en 4.8s)
- ✅ **Documentación completa** de instalación, configuración y troubleshooting
- ✅ **RLS** (Row Level Security) configurado en Supabase — ver [`physio-manager/supabase_rls_appointments.sql`](./physio-manager/supabase_rls_appointments.sql)
- ✅ **PWA instalable** desplegada en https://pyshiomanager.online

**Tag GitHub**: `v0.1` — ver [Releases](https://github.com/whoami-avi/selah-fisioterapia/releases).

