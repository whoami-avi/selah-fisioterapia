const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uomwyiapknnplqxmglnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('=== Verificando tablas ===\n');
    
    // Check patients
    const { data: patients, error: pError } = await supabase.from('patients').select('*');
    console.log('PATIENTS:', patients?.length || 0, 'registros');
    if (pError) console.log('Error:', pError.message);
    else if (patients) console.log(patients);
    
    console.log('\n---\n');
    
    // Check appointments
    const { data: appointments, error: aError } = await supabase.from('appointments').select('*');
    console.log('APPOINTMENTS:', appointments?.length || 0, 'registros');
    if (aError) console.log('Error:', aError.message);
    
    console.log('\n---\n');
    
    // Check RLS policies
    const { data: policies, error: polError } = await supabase.rpc('pg_catalog.pg_policies', { tablename: 'patients' }).select('*').limit(5);
    console.log('Policies:', policies);
}

checkTables().catch(console.error);
