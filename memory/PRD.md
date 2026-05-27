# Selah Fisioterapia & Recovery - PRD

## Problem Statement
Clone repo https://github.com/whoami-avi/selah-fisioterapia.git and fix database connection issues with Supabase.

## Architecture
- **Frontend:** Static HTML/CSS/JS PWA served via React CRA public folder
- **Database:** PostgreSQL via Supabase (https://uomwyiapknnplqxmglnv.supabase.co)
- **Hosting:** Cloudflare Pages (physiomanager.online)
- **SDK:** @supabase/supabase-js v2 via CDN

## What's Been Implemented (April 18, 2026)

### Session 1: Supabase Connection Fixes
- Fixed patient field mapping (Supabase `treatment` -> app `therapyType`)
- Fixed appointment field mapping (`patient_id`->`patientId`, `type`->`therapy`, `costo`->`cost`, `metodo_pago`->`paymentMethod`, `pago_estado`->`paymentStatus`)
- Fixed user login to check `password_hash` field (Supabase schema)
- Fixed status mapping (`scheduled`->`confirmed`, `pagado`->`paid`)
- Fixed `showNotification` -> `showToast` undefined function
- Added `mapPatientFromSupabase()` and `mapAppointmentFromSupabase()` mapping functions
- Fixed real-time subscription handlers to apply mappings
- Removed `temp_repo` git submodule reference causing GitHub Actions failure

### Session 2: T3-02 Report
- Created complete T3-02 SGBD report (DDL/DML/Queries/CRUD/Connection)
- Available at `/T3-02_Reporte_SGBD.html` and `/T3-02_Reporte_SGBD_Selah.md`

### Session 3: Dashboard reflection bug fix (April 22, 2026)
Reported bug: "cuando genero una cita no se ve reflejada en el dashboard".

Root cause: combination of 3 front-end bugs plus a Supabase RLS policy missing for the `anon` role on `appointments` (INSERT rejected with code 42501).

Applied fixes in `physio-manager/app.js`:
- `refreshCurrentSection()` now handles `dashboard` and `finances` sections (previously missing/misnamed `finance`). Realtime INSERTs now trigger a dashboard re-render.
- `saveAppointment()` now `await`s the async save before calling `renderDashboard()`. Also wraps the call in try/catch/finally for error handling and UI restoration.
- `saveAppointmentToSupabase()` now maps data through `mapAppointmentFromSupabase()` in the offline/error fallback path so the dashboard can render by `patientId`.
- `deleteAppointment()` now does optimistic local removal before syncing with Supabase.

UX improvements:
- Loading spinner + "Guardando..." label on the appointment save button.
- All form inputs disabled during save to prevent double submits.
- Toast error if save fails; state is restored in `finally`.

New files added in `physio-manager/`:
- `check_rls.js` — diagnostic script for Supabase RLS (Node).
- `supabase_rls_appointments.sql` — ready-to-paste SQL with SELECT/INSERT/UPDATE/DELETE policies for `anon` + `authenticated` roles.
- `tests/appointment.spec.js` + `playwright.config.js` — E2E test (passing in 4.8s) covering create/edit/delete with dashboard reflection assertions.
- CSS spinner added to `styles.css`.

## User Personas
- **Admin (Dra. Garcia):** Full access - patients, appointments, finances, users
- **Asistente (Maria Lopez):** Limited access - patients, appointments, WhatsApp

## Core Requirements
- Patient management (CRUD)
- Appointment scheduling with calendar
- Financial dashboard (admin only)
- WhatsApp message templates
- Real-time sync with Supabase
- Offline fallback to localStorage
- PWA support

## Backlog
- P0 (user action): Run `physio-manager/supabase_rls_appointments.sql` in Supabase SQL Editor so appointments actually persist in DB (not just local).
- P1: Add proper password hashing (currently plain text in password_hash)
- P1: Add RLS policies for row-level security (SQL provided for `appointments`; also apply to `patients`, `templates`, `messages`, `users`).
- P1: Apply the same loading+await pattern to `savePatient` and `saveTemplate`.
- P1: Distinguish RLS errors from network errors in `saveAppointmentToSupabase` — show specific toast instead of silent fallback.
- P2: Add patient body_zone, sessions, medical_history columns to Supabase
- P2: Improve mobile responsive design
- P2: Unit tests with Jest for `mapAppointmentFromSupabase` and `renderDashboard`.
- P3: Add email notifications
- P3: GitHub Actions workflow to run `npx playwright test` on every PR.

### Session 4: T3-03 Release v0.1 deliverable (April 23, 2026)

User executed `supabase_rls_appointments.sql` → confirmed via `check_rls.js`:
- ✅ SELECT from `appointments` works (3 existing rows)
- ✅ INSERT succeeds (no more 42501)
- ✅ SELECT-after-INSERT works
- ✅ DELETE works

Created T3-03 deliverables in `/app/physio-manager/`:
- `README.md` — comprehensive installation, configuration, troubleshooting, use cases reference
- `CASOS_DE_USO.md` — 5 CUs documented end-to-end (CU1 Pacientes, CU2 Citas, CU3 Dashboard, CU4 Finanzas, CU5 WhatsApp) with flow, preconditions, postconditions, DB tables and CRUD mappings
- `evidencias/` — 14 screenshots (desktop + mobile) covering all 5 CUs
- `evidencias/README.md` — index mapping each screenshot to its CU
- Root `README.md` updated with Release v0.1 section

Ready for user to:
- Save to GitHub (push to `main`)
- Create GitHub Release with tag `v0.1`

## Backlog

