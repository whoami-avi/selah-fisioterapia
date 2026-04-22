const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uomwyiapknnplqxmglnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('=== TEST INSERT CON UUID ===\n');

    // Generate a valid UUID
    const id = crypto.randomUUID();
    console.log('ID generado:', id);

    const testPatient = {
        id: id,
        name: 'Test Patient Automatico',
        phone: '+525500000001',
        email: 'test@test.com',
        diagnosis: 'Test automatico'
    };

    console.log('Intentando insertar...');
    const { data, error } = await supabase
        .from('patients')
        .insert([testPatient])
        .select()
        .single();

    if (error) {
        console.log('❌ Error al insertar:', error.message);
        console.log('   Código:', error.code);
        console.log('   Detalles:', JSON.stringify(error));
    } else {
        console.log('✅ Paciente insertado exitosamente!');
        console.log('   ID:', data.id);
        console.log('   Nombre:', data.name);

        // Delete test patient
        await supabase.from('patients').delete().eq('id', id);
        console.log('🧹 Paciente de prueba eliminado');
    }
}

testInsert().catch(console.error);
