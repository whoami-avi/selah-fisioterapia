const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uomwyiapknnplqxmglnv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

const supabase = createClient(supabaseUrl, anonKey);

async function checkUsers() {
    console.log('=== VERIFICANDO TABLA USERS ===\n');
    
    const { data: users, error } = await supabase.from('users').select('*');
    
    if (error) {
        console.log('Error:', error.message);
        return;
    }
    
    console.log('Usuarios en la DB:');
    users.forEach(u => {
        console.log(`\n- ID: ${u.id}`);
        console.log(`  username: ${u.username}`);
        console.log(`  name: ${u.name}`);
        console.log(`  email: ${u.email || '(null)'}`);
        console.log(`  role: ${u.role}`);
    });
}

checkUsers().catch(console.error);
