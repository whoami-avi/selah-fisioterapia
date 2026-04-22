/**
 * Diagnóstico de RLS (Row Level Security) en Supabase para la tabla `appointments`.
 *
 * Uso:
 *   node check_rls.js
 *
 * Qué hace:
 *   1. Intenta SELECT * FROM appointments (lectura como anon).
 *   2. Intenta INSERT de una cita de prueba con un UUID generado.
 *   3. Si el insert succeed, intenta SELECT de esa cita y luego la elimina.
 *   4. Reporta los errores de Supabase con códigos y hint para interpretar RLS.
 *
 * El propósito es averiguar por qué el catch de saveAppointmentToSupabase se
 * disparaba (RLS bloqueando? columna faltante? FK invalida?).
 */

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Lee credenciales desde variables de entorno. Ejemplo de uso:
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=ey... node check_rls.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan variables de entorno. Ejecuta:');
    console.error('   SUPABASE_URL=https://tuproyecto.supabase.co \\');
    console.error('   SUPABASE_ANON_KEY=tu-anon-key \\');
    console.error('   node check_rls.js');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function logErr(tag, err) {
    if (!err) return;
    console.log(`❌ ${tag}:`);
    console.log(`   code:    ${err.code || '(none)'}`);
    console.log(`   message: ${err.message}`);
    if (err.details) console.log(`   details: ${err.details}`);
    if (err.hint)    console.log(`   hint:    ${err.hint}`);
    // Códigos típicos:
    //   42501 => RLS violation (o privileges faltantes)
    //   23503 => foreign key violation (patient_id no existe)
    //   23505 => duplicate key
    //   PGRST116 => single() recibió 0 filas (suele significar RLS bloqueando el SELECT post-insert)
    if (err.code === '42501') console.log('   → Típico de RLS: la policy INSERT no permite al rol anon.');
    if (err.code === '23503') console.log('   → FK: el patient_id referido no existe en la tabla patients.');
    if (err.code === 'PGRST116') console.log('   → El insert pasó pero el SELECT está bloqueado por RLS.');
}

async function main() {
    console.log('🔍 1) Listando pacientes (para tener un patient_id válido)...');
    const { data: pats, error: patsErr } = await supabase
        .from('patients')
        .select('id, name')
        .limit(3);
    logErr('SELECT patients', patsErr);
    if (pats) console.log(`   ${pats.length} paciente(s):`, pats.map(p => `${p.name} (${p.id})`).join(', ') || '(vacío)');

    console.log('\n🔍 2) Listando citas existentes...');
    const { data: appts, error: apptsErr } = await supabase
        .from('appointments')
        .select('*')
        .limit(3);
    logErr('SELECT appointments', apptsErr);
    if (appts) console.log(`   ${appts.length} cita(s) leídas`);
    if (appts && appts.length > 0) {
        console.log('   Columnas detectadas:', Object.keys(appts[0]).join(', '));
    }

    const patientId = pats && pats.length > 0 ? pats[0].id : null;
    if (!patientId) {
        console.log('\n⚠️  No hay pacientes para probar INSERT. Crea uno manualmente y vuelve a correr.');
        return;
    }

    const testId = randomUUID();
    const testAppt = {
        id: testId,
        patient_id: patientId,
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: 60,
        type: 'fisioterapia',
        status: 'pending',
        costo: 0,
        metodo_pago: '',
        pago_estado: 'pending',
        notes: '[DIAG] test_rls.js - puede eliminarse',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    console.log(`\n🔍 3) Intentando INSERT de cita de prueba (id=${testId})...`);
    const { data: inserted, error: insErr } = await supabase
        .from('appointments')
        .insert([testAppt])
        .select()
        .single();
    logErr('INSERT appointments', insErr);
    if (inserted) {
        console.log('   ✅ Insert OK. ID:', inserted.id);
    }

    if (!insErr) {
        console.log(`\n🔍 4) SELECT de la cita recién insertada...`);
        const { data: reread, error: reErr } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', testId)
            .single();
        logErr('SELECT after INSERT', reErr);
        if (reread) console.log('   ✅ Cita leída correctamente tras insert.');

        console.log(`\n🔍 5) DELETE de la cita de prueba...`);
        const { error: delErr } = await supabase
            .from('appointments')
            .delete()
            .eq('id', testId);
        logErr('DELETE appointments', delErr);
        if (!delErr) console.log('   ✅ Delete OK. Limpieza completada.');
    }

    console.log('\n📋 Resumen:');
    console.log('   • Si INSERT falló con 42501 → revisa policies RLS de appointments para rol `anon`.');
    console.log('   • Si INSERT pasó pero SELECT/UPDATE/DELETE falló → policies son parciales.');
    console.log('   • Si columnas detectadas difieren de las que envía la app → hay un mismatch de esquema.');
}

main().catch(e => {
    console.error('Error inesperado:', e);
    process.exit(1);
});
