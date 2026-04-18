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
- P1: Add proper password hashing (currently plain text in password_hash)
- P1: Add RLS policies for row-level security
- P2: Add patient body_zone, sessions, medical_history columns to Supabase
- P2: Improve mobile responsive design
- P3: Add email notifications
