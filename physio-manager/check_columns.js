const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uomwyiapknnplqxmglnv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

const supabase = createClient(supabaseUrl, anonKey);

async function checkColumns() {
    console.log('=== VERIFICANDO COLUMNAS DE LA TABLA ===\n');

    // Get one patient to see what columns we have
    const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.log('Error:', error.message);
        return;
    }

    console.log('Columnas en la tabla patients:');
    const columns = Object.keys(patient);
    columns.forEach(col => {
        console.log(`  - ${col}: ${patient[col] === null ? 'NULL' : patient[col]}`);
    });

    console.log('\n=== COLUMNAS QUE USA LA APP (pero no existen) ===');
    const appColumns = ['body_zone', 'therapy_type', 'sessions', 'medical_history', 'reason'];
    console.log('La app intenta enviar:', appColumns.join(', '));
    console.log('Pero la tabla NO tiene:', appColumns.filter(c => !columns.includes(c)).join(', '));
}

checkColumns().catch(console.error);
