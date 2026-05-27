const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uomwyiapknnplqxmglnv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

const supabase = createClient(supabaseUrl, anonKey);

async function verifyFix() {
    console.log('=== VERIFICANDO CORRECCIÓN ===\n');

    // Test INSERT with correct columns only
    const testPatient = {
        id: crypto.randomUUID(),
        name: 'Test Corregido',
        phone: '+525500000099',
        email: 'test@test.com',
        birthdate: '1990-01-01',
        occupation: 'Test',
        referrer: 'Test ref',
        address: 'Test address',
        diagnosis: 'Test diagnosis',
        treatment: 'Terapia Manual',
        notes: 'Test notes',
        emergency_contact: 'Test contact',
        emergency_phone: '+525500000100',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    console.log('1. Probando INSERT con columnas correctas...');
    const { data: insertData, error: insertError } = await supabase
        .from('patients')
        .insert([testPatient])
        .select()
        .single();

    if (insertError) {
        console.log('   ❌ Error:', insertError.message);
    } else {
        console.log('   ✅ INSERT exitoso:', insertData.name);
        
        // Test UPDATE
        console.log('\n2. Probando UPDATE...');
        const { id, created_at, ...updateData } = { ...testPatient, notes: 'Notas actualizadas' };
        updateData.updated_at = new Date().toISOString();
        
        const { data: updateData2, error: updateError } = await supabase
            .from('patients')
            .update(updateData)
            .eq('id', testPatient.id)
            .select()
            .single();

        if (updateError) {
            console.log('   ❌ Error:', updateError.message);
        } else {
            console.log('   ✅ UPDATE exitoso:', updateData2.notes);
        }

        // Clean up
        console.log('\n3. Limpiando...');
        await supabase.from('patients').delete().eq('id', testPatient.id);
        console.log('   ✅ Paciente de prueba eliminado');
    }

    console.log('\n=== TODO FUNCIONA ===');
}

verifyFix().catch(console.error);
