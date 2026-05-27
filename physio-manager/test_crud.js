const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uomwyiapknnplqxmglnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCRUD() {
    console.log('=== TEST CRUD COMPLETO ===\n');

    // 1. Get a patient to update
    console.log('1. Obteniendo paciente existente...');
    const { data: patients, error: getError } = await supabase
        .from('patients')
        .select('*')
        .limit(1);
    
    if (getError || !patients?.length) {
        console.log('❌ Error obteniendo pacientes:', getError?.message);
        return;
    }

    const patient = patients[0];
    console.log('   Paciente encontrado:', patient.id, '-', patient.name);

    // 2. Test UPDATE
    console.log('\n2. Probando UPDATE...');
    const { data: updateData, error: updateError } = await supabase
        .from('patients')
        .update({ 
            notes: 'Test update - ' + new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', patient.id)
        .select()
        .single();

    if (updateError) {
        console.log('❌ Error en UPDATE:', updateError.message);
        console.log('   Código:', updateError.code);
    } else {
        console.log('✅ UPDATE exitoso:', updateData.notes);
    }

    // 3. Test DELETE (and re-insert)
    console.log('\n3. Probando DELETE...');
    const testPatient = {
        id: crypto.randomUUID(),
        name: 'Test CRUD Delete',
        phone: '+525500000002',
        diagnosis: 'Test delete'
    };

    // First insert
    const { error: insertError } = await supabase
        .from('patients')
        .insert([testPatient]);
    
    if (insertError) {
        console.log('❌ Error insertando para delete test:', insertError.message);
    } else {
        console.log('   Paciente insertado para test');
        
        // Now delete
        const { error: deleteError } = await supabase
            .from('patients')
            .delete()
            .eq('id', testPatient.id);

        if (deleteError) {
            console.log('❌ Error en DELETE:', deleteError.message);
        } else {
            console.log('✅ DELETE exitoso');
        }
    }

    console.log('\n=== FIN TEST CRUD ===');
}

testCRUD().catch(console.error);
