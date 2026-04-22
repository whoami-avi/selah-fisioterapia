const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uomwyiapknnplqxmglnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('=== VERIFICACIÓN DE BASE DE DATOS ===\n');

    // Check 1: Test connection
    console.log('1. Probando conexión...');
    const { data: testData, error: testError } = await supabase.from('patients').select('count', { count: 'exact', head: true });
    if (testError) {
        console.log('❌ Error de conexión:', testError.message);
    } else {
        console.log('✅ Conexión exitosa. Count:', testData);
    }

    // Check 2: List tables
    console.log('\n2. Verificando tablas...');
    const tables = ['patients', 'appointments', 'templates', 'users', 'messages'];
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(5);
        if (error) {
            console.log(`   ${table}: ❌ ${error.message}`);
        } else {
            console.log(`   ${table}: ✅ ${data?.length || 0} registros`);
        }
    }

    // Check 3: Try insert
    console.log('\n3. Probando INSERT en patients...');
    const testPatient = {
        id: 'test-' + Date.now(),
        name: 'Test Patient',
        phone: '+525512345678',
        diagnosis: 'Test diagnosis'
    };
    
    const { data: insertData, error: insertError } = await supabase
        .from('patients')
        .insert([testPatient])
        .select()
        .single();
    
    if (insertError) {
        console.log('❌ Error al insertar:', insertError.message);
        console.log('   Detalles:', JSON.stringify(insertError));
    } else {
        console.log('✅ Paciente insertado:', insertData.id);
        
        // Delete test patient
        await supabase.from('patients').delete().eq('id', testPatient.id);
        console.log('🧹 Paciente de prueba eliminado');
    }

    console.log('\n=== FIN DE VERIFICACIÓN ===');
}

checkDatabase().catch(console.error);
