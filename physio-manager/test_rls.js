const { createClient } = require('@supabase/supabase-js');

// Usando ANON KEY (como la app web)
const supabaseUrl = 'https://uomwyiapknnplqxmglnv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

const supabase = createClient(supabaseUrl, anonKey);

async function testRLS() {
    console.log('=== TEST CON ANON KEY (como app web) ===\n');

    // 1. Try SELECT
    console.log('1. SELECT con anon key...');
    const { data: patients, error: selectError } = await supabase.from('patients').select('*').limit(1);
    if (selectError) {
        console.log('   ❌ Error:', selectError.message);
    } else {
        console.log('   ✅ SELECT exitoso -', patients?.length, 'registros');
    }

    if (!patients?.length) {
        console.log('No hay pacientes para probar UPDATE');
        return;
    }

    const patient = patients[0];
    console.log('\n2. UPDATE con anon key...');
    console.log('   Paciente:', patient.id);

    const { data: updateData, error: updateError } = await supabase
        .from('patients')
        .update({ notes: 'Test RLS - ' + Date.now() })
        .eq('id', patient.id)
        .select()
        .single();

    if (updateError) {
        console.log('   ❌ UPDATE Error:', updateError.message);
        console.log('   Código:', updateError.code);
        console.log('   ¿Es error de RLS?', updateError.code === '42501' ? 'SÍ - Permiso denegado' : 'No');
    } else {
        console.log('   ✅ UPDATE exitoso');
    }

    // 3. Try INSERT
    console.log('\n3. INSERT con anon key...');
    const { error: insertError } = await supabase
        .from('patients')
        .insert([{
            id: crypto.randomUUID(),
            name: 'Test RLS Insert',
            phone: '+525500000003',
            diagnosis: 'Test'
        }]);

    if (insertError) {
        console.log('   ❌ INSERT Error:', insertError.message);
        console.log('   Código:', insertError.code);
    } else {
        console.log('   ✅ INSERT exitoso');
    }
}

testRLS().catch(console.error);
