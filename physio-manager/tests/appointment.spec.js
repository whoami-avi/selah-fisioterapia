/**
 * Test E2E para el flujo de creación de cita en Selah Fisioterapia.
 *
 * Valida el FIX principal: al crear/editar/eliminar una cita, el Dashboard
 * se refleja INMEDIATAMENTE sin recargar la página.
 *
 * Los 3 sub-flujos se corren en un único test porque la persistencia real
 * en Supabase depende de las policies RLS (ver supabase_rls_appointments.sql).
 * Hasta que apliques el SQL, la cita vive solo en localStorage y no sobrevive
 * a un reload, por lo que el test se ejecuta sin recargar entre acciones.
 *
 * Uso:
 *   npx playwright test
 */

const { test, expect } = require('@playwright/test');

const APP_URL = process.env.APP_URL || 'http://localhost:8099';

test('Crear, editar y eliminar cita se reflejan en el Dashboard', async ({ page }) => {
    // --- Setup: bypass login con localStorage ---
    await page.addInitScript(() => {
        localStorage.setItem('selah_logged_in', 'true');
        localStorage.setItem('selah_user', 'admin');
        localStorage.setItem('selah_user_name', 'Administrador');
        localStorage.setItem('selah_user_role', 'admin');
    });
    await page.goto(APP_URL + '/index.html');
    await page.waitForSelector('#dashboard.active', { timeout: 20_000 });
    await page.waitForFunction(
        () => typeof patients !== 'undefined' && patients.length > 0,
        { timeout: 15_000 }
    );

    const initialCount = parseInt(await page.locator('#todayAppointments').textContent());

    // ====== 1) CREAR CITA ======
    await page.evaluate(() => window.openAppointmentModal());
    await expect(page.locator('#appointmentModal.active')).toBeVisible();

    const patientId = await page.evaluate(() => patients[0].id);
    const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);

    await page.evaluate((id) => {
        const sel = document.getElementById('appointmentPatient');
        sel.value = id;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, patientId);
    await page.fill('#appointmentDate', today);
    await page.fill('#appointmentTime', '15:45');
    await page.selectOption('#appointmentStatus', 'confirmed');
    await page.fill('#appointmentCost', '42000');

    await page.locator('#appointmentModal button[type="submit"]').click();

    await expect(page.locator('#appointmentModal.active')).toBeHidden({ timeout: 15_000 });
    await expect(page.locator('#todayAppointments')).toHaveText(String(initialCount + 1));
    await expect(page.locator('#todayList')).toContainText(/15:45|3:45\s*PM/i);

    const createdId = await page.evaluate(() => appointments[appointments.length - 1].id);
    expect(createdId).toBeTruthy();

    // ====== 2) EDITAR CITA ======
    await page.evaluate((id) => window.editAppointment(id), createdId);
    await expect(page.locator('#appointmentModal.active')).toBeVisible();

    await page.fill('#appointmentTime', '18:20');
    await page.locator('#appointmentModal button[type="submit"]').click();

    await expect(page.locator('#appointmentModal.active')).toBeHidden({ timeout: 15_000 });
    await expect(page.locator('#todayList')).toContainText(/18:20|6:20\s*PM/i);
    await expect(page.locator('#todayList')).not.toContainText(/3:45\s*PM/i);

    // ====== 3) ELIMINAR CITA ======
    page.on('dialog', d => d.accept());
    await page.evaluate((id) => window.editAppointment(id), createdId);
    await expect(page.locator('#appointmentModal.active')).toBeVisible();
    await page.click('#deleteAppointmentBtn');

    await expect(page.locator('#appointmentModal.active')).toBeHidden({ timeout: 15_000 });
    await expect(page.locator('#todayAppointments')).toHaveText(String(initialCount));

    // Cleanup final por si la cita llegó a persistirse en Supabase (cuando RLS esté OK)
    await page.evaluate((id) => {
        if (typeof window.deleteAppointmentFromSupabase === 'function') {
            window.deleteAppointmentFromSupabase(id);
        }
    }, createdId);
});
