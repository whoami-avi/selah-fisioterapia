const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uomwyiapknnplqxmglnv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

const supabase = createClient(supabaseUrl, anonKey);

async function debug() {
    console.log('=== DEBUG COMPLETO ===\n');

    // 1. Get all patients
    console.log('1. Pacientes en la DB:');
    const { data: patients, error: pError } = await supabase.from('patients').select('*');
    if (pError) {
        console.log('   ❌ Error:', pError.message);
    } else {
        console.log('   ✅ Total:', patients?.length);
        patients?.forEach(p => {
            console.log(`   - ${p.id}: ${p.name} (${p.diagnosis})`);
        });
    }

    // 2. Test INSERT with exact same structure as app.js
    console.log('\n2. Probando INSERT exactamente como la app:');
    const testPatient = {
        id: crypto.randomUUID(),
        name: 'Test Debug',
        phone: '+525500000004',
        email: 'debug@test.com',
        birthdate: '1990-01-01',
        occupation: 'Test',
        referrer: 'Test ref',
        address: 'Test address',
        diagnosis: 'Test diagnosis',
        body_zone: 'lumbar',
        therapy_type: 'terapia_manual',
        sessions: 5,
        medical_history: 'Test history',
        reason: 'Test reason',
        notes: 'Test notes',
        emergency_contact: 'Test contact',
        emergency_phone: '+525500000005',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    console.log('   Datos a insertar:', JSON.stringify(testPatient, null, 2).substring(0, 200) + '...');
    
    const { data: insertData, error: insertError } = await supabase
        .from('patients')
        .insert([testPatient])
        .select()
        .single();

    if (insertError) {
        console.log('   ❌ INSERT Error:', insertError.message);
        console.log('   Código:', insertError.code);
    } else {
        console.log('   ✅ INSERT exitoso');
        console.log('   ID:', insertData.id);
        
        // 3. Test UPDATE on this patient
        console.log('\n3. Probando UPDATE:');
        const { id, created_at, ...updateData } = { ...testPatient, notes: 'Updated notes' };
        updateData.updated_at = new Date().toISOString();
        
        console.log('   Datos a actualizar:', JSON.stringify(updateData, null, 2));
        
        const { data: updateResult, error: updateError } = await supabase
            .from('patients')
            .update(updateData)
            .eq('id', testPatient.id)
            .select()
            .single();

        if (updateError) {
            console.log('   ❌ UPDATE Error:', updateError.message);
            console.log('   Código:', updateError.code);
        } else {
            console.log('   ✅ UPDATE exitoso');
        }

        // 4. Clean up
        console.log('\n4. Limpiando datos de prueba...');
        await supabase.from('patients').delete().eq('id', testPatient.id);
        console.log('   ✅ Limpiado');
    }

    console.log('\n=== FIN DEBUG ===');
}

debug().catch(console.error);
