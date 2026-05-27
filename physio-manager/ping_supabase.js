/**
 * Ping a Supabase para mantener el proyecto activo.
 *
 * Supabase pausa los proyectos del plan gratuito después de 7 días sin actividad.
 * Este script ejecuta un SELECT mínimo (count) sobre cada tabla principal y
 * reporta el estado. Está diseñado para correr en un cron job.
 *
 * Uso local:
 *   SUPABASE_URL=https://tuproyecto.supabase.co \
 *   SUPABASE_ANON_KEY=tu-anon-key \
 *   node ping_supabase.js
 *
 * Uso en GitHub Actions:
 *   Ver .github/workflows/keep_supabase_alive.yml
 */

const { createClient } = require('@supabase/supabase-js');

// Node < 22 no tiene WebSocket nativo; el cliente de Supabase lo requiere.
// Le proporcionamos `ws` para que no falle al inicializar el RealtimeClient.
try {
    const ws = require('ws');
    if (!global.WebSocket) global.WebSocket = ws;
} catch (_) {
    // si `ws` no está instalado, intentamos seguir sin realtime
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY');
    process.exit(1);
}

const TABLES = ['patients', 'appointments', 'users', 'templates', 'messages'];

async function ping() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const timestamp = new Date().toISOString();

    console.log(`🏓 Selah Supabase Keepalive Ping`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Project:   ${SUPABASE_URL}`);
    console.log('');

    let allOk = true;

    for (const table of TABLES) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`   ❌ ${table.padEnd(15)} → ERROR: ${error.message}`);
                allOk = false;
            } else {
                console.log(`   ✅ ${table.padEnd(15)} → ${count} fila(s)`);
            }
        } catch (e) {
            console.log(`   ❌ ${table.padEnd(15)} → EXCEPCIÓN: ${e.message}`);
            allOk = false;
        }
    }

    console.log('');
    if (allOk) {
        console.log(`🎉 Ping exitoso. Supabase activo. Próximo ping recomendado: en 5 días.`);
        process.exit(0);
    } else {
        console.log(`⚠️  Ping completado con errores. Revisar conexión o policies RLS.`);
        process.exit(1);
    }
}

ping().catch(e => {
    console.error('💥 Error inesperado:', e);
    process.exit(1);
});
