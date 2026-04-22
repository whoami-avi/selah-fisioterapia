-- =====================================================================
-- RLS Policies para la tabla `appointments` (Selah Fisioterapia)
-- =====================================================================
-- Pegar en el SQL Editor de Supabase y ejecutar.
--
-- Contexto: la app usa la clave `anon` desde el navegador y esperaba poder
-- hacer INSERT/UPDATE/DELETE. Actualmente RLS bloquea los INSERT con el
-- error 42501 ("new row violates row-level security policy").
--
-- ⚠️  Si tu app usará login real con supabase.auth en el futuro, reemplaza
--    `USING (true)` y `WITH CHECK (true)` por algo como
--    `USING (auth.uid() = created_by)` una vez que añadas esa columna.
-- =====================================================================

-- 1) Asegúrate de que RLS está activo (normalmente ya lo está)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 2) Borra policies previas con el mismo nombre (idempotente)
DROP POLICY IF EXISTS "appointments_select_all"  ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_anon" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_anon" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_anon" ON public.appointments;

-- 3) SELECT: cualquiera con la anon key puede leer (ya funcionaba)
CREATE POLICY "appointments_select_all"
    ON public.appointments
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4) INSERT: permitir crear nuevas citas
CREATE POLICY "appointments_insert_anon"
    ON public.appointments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 5) UPDATE: permitir editar citas existentes
CREATE POLICY "appointments_update_anon"
    ON public.appointments
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6) DELETE: permitir eliminar citas
CREATE POLICY "appointments_delete_anon"
    ON public.appointments
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- =====================================================================
-- Verificación: después de ejecutar, corre `node check_rls.js` en local y
-- deberías ver ✅ en INSERT, SELECT-after-INSERT y DELETE.
-- =====================================================================
