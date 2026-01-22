// Selah Fisioterapia & Recovery - Application Logic v2.0

// ===== SUPABASE INTEGRATION =====
let supabaseClient = null;
let isOnline = navigator.onLine;

// Supabase credentials
const SUPABASE_URL = 'https://uomwyiapknnplqxmglnv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbXd5aWFwa25ucGxxeG1nbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDI3NjgsImV4cCI6MjA4NDYxODc2OH0.GIv1VcTjGxnNV2RnNBrtgC-I1yOp5Bu_ulA0DiS0A1U';

// Current user info
let currentUser = null;
let currentUserRole = 'asistente';

// Finance chart instance
let incomeChart = null;
let currentFinancePeriod = 'day';

// ===== VERSION CONTROL =====
const APP_VERSION = '2.1.0';
const APP_VERSION_DATE = '2026-01-22';
const VERSION_CHECK_URL = 'app_versions'; // Supabase table name

// Version history (embedded for offline access)
const VERSION_HISTORY = [
    { version: '2.0.0', date: '2026-01-22', notes: 'Sistema de roles (Admin/Asistente), Dashboard financiero, Control de versiones' },
    { version: '1.5.0', date: '2026-01-15', notes: 'Integración WhatsApp, recordatorios automáticos' },
    { version: '1.0.0', date: '2026-01-01', notes: 'Lanzamiento inicial - Agenda, Pacientes, PWA' }
];

function initSupabase() {
    const url = localStorage.getItem('supabase_url') || SUPABASE_URL;
    const key = localStorage.getItem('supabase_key') || SUPABASE_KEY;
    
    if (!localStorage.getItem('supabase_url')) {
        localStorage.setItem('supabase_url', SUPABASE_URL);
        localStorage.setItem('supabase_key', SUPABASE_KEY);
    }
    
    if (url && key && window.supabase) {
        supabaseClient = window.supabase.createClient(url, key);
        return true;
    }
    return false;
}

// ===== DATA STORAGE =====
let patients = JSON.parse(localStorage.getItem('selah_patients')) || [];
let appointments = JSON.parse(localStorage.getItem('selah_appointments')) || [];
let templates = JSON.parse(localStorage.getItem('selah_templates')) || getDefaultTemplates();
let pendingChanges = JSON.parse(localStorage.getItem('selah_pending')) || [];
let messageHistory = JSON.parse(localStorage.getItem('selah_messages')) || [];

// Calendar State
let currentDate = new Date();
let currentView = 'week';
let currentPatientEvolution = [];

// App Language
let appLanguage = localStorage.getItem('selah_language') || 'es';

// ===== SPLASH SCREEN & AUTH =====
document.addEventListener('DOMContentLoaded', function() {
    showSplashScreen();
});

function showSplashScreen() {
    const splash = document.getElementById('splashScreen');
    const statusText = splash.querySelector('.splash-status');
    
    setTimeout(() => { statusText.textContent = 'Verificando sesión...'; }, 500);
    setTimeout(() => { statusText.textContent = 'Cargando datos...'; }, 1200);
    setTimeout(() => { statusText.textContent = 'Preparando interfaz...'; }, 1800);
    
    setTimeout(() => {
        splash.classList.add('hidden');
        checkAuthentication();
    }, 2500);
}

async function checkAuthentication() {
    // Check for active Supabase session
    if (supabaseClient) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session) {
                // Valid session exists
                const userId = session.user.id;
                const userEmail = session.user.email;
                
                // Get user profile
                const { data: profile } = await supabaseClient
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                
                currentUser = {
                    id: userId,
                    email: userEmail,
                    name: profile?.name || userEmail.split('@')[0],
                    role: profile?.role || 'asistente'
                };
                currentUserRole = currentUser.role;
                
                localStorage.setItem('selah_logged_in', 'true');
                localStorage.setItem('selah_user', userEmail);
                localStorage.setItem('selah_user_name', currentUser.name);
                localStorage.setItem('selah_user_role', currentUserRole);
                localStorage.setItem('selah_user_id', userId);
                
                showApp();
                return;
            }
        } catch (err) {
            console.log('Session check error:', err);
        }
    }
    
    // Fallback to localStorage check
    const isLoggedIn = localStorage.getItem('selah_logged_in') === 'true';
    const rememberedUser = localStorage.getItem('selah_user');
    
    if (isLoggedIn && rememberedUser) {
        currentUserRole = localStorage.getItem('selah_user_role') || 'asistente';
        showApp();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    
    // Show login form, hide forgot password form
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    
    const rememberedUser = localStorage.getItem('selah_remembered_user');
    if (rememberedUser) {
        document.getElementById('loginEmail').value = rememberedUser;
        document.getElementById('rememberMe').checked = true;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;
    const remember = document.getElementById('rememberMe').checked;
    const errorDiv = document.getElementById('loginError');
    const successDiv = document.getElementById('loginSuccess');
    const loginBtn = document.querySelector('#loginForm .login-btn');
    
    errorDiv.textContent = '';
    successDiv.classList.remove('show');
    loginBtn.textContent = 'Verificando...';
    loginBtn.disabled = true;
    
    try {
        if (!supabaseClient) {
            throw new Error('No hay conexión con el servidor');
        }
        
        // Authenticate with Supabase Auth
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: pass
        });
        
        if (error) {
            throw error;
        }
        
        // Get user profile with role
        const { data: profile, error: profileError } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
            console.log('Profile not found, using default');
        }
        
        const userRole = profile?.role || 'asistente';
        const userName = profile?.name || data.user.email.split('@')[0];
        
        // Store session info
        localStorage.setItem('selah_logged_in', 'true');
        localStorage.setItem('selah_user', data.user.email);
        localStorage.setItem('selah_user_name', userName);
        localStorage.setItem('selah_user_role', userRole);
        localStorage.setItem('selah_user_id', data.user.id);
        
        if (remember) {
            localStorage.setItem('selah_remembered_user', email);
        } else {
            localStorage.removeItem('selah_remembered_user');
        }
        
        currentUser = {
            id: data.user.id,
            email: data.user.email,
            name: userName,
            role: userRole
        };
        currentUserRole = userRole;
        
        showApp();
        showToast(`Bienvenido, ${userName}`, 'success');
        
    } catch (err) {
        console.error('Login error:', err);
        
        // Translate common errors
        let errorMessage = 'Error al iniciar sesión';
        if (err.message.includes('Invalid login credentials')) {
            errorMessage = 'Correo o contraseña incorrectos';
        } else if (err.message.includes('Email not confirmed')) {
            errorMessage = 'Por favor confirma tu correo electrónico';
        } else if (err.message.includes('No hay conexión')) {
            errorMessage = 'Sin conexión al servidor';
        }
        
        errorDiv.textContent = errorMessage;
        document.getElementById('loginPass').value = '';
    }
    
    loginBtn.textContent = 'Iniciar Sesión';
    loginBtn.disabled = false;
}

// Show/hide login forms
function showForgotPassword(event) {
    event.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.getElementById('resetError').textContent = '';
    document.getElementById('resetSuccess').classList.remove('show');
}

function showLoginForm() {
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    const errorDiv = document.getElementById('resetError');
    const successDiv = document.getElementById('resetSuccess');
    const submitBtn = document.querySelector('#forgotPasswordForm .login-btn');
    
    errorDiv.textContent = '';
    successDiv.classList.remove('show');
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    try {
        if (!supabaseClient) {
            throw new Error('No hay conexión con el servidor');
        }
        
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
        });
        
        if (error) throw error;
        
        successDiv.textContent = '¡Enlace enviado! Revisa tu correo electrónico.';
        successDiv.classList.add('show');
        
    } catch (err) {
        console.error('Reset password error:', err);
        errorDiv.textContent = 'Error al enviar el enlace. Verifica el correo.';
    }
    
    submitBtn.textContent = 'Enviar enlace';
    submitBtn.disabled = false;
}

async function handleLogout() {
    if (confirm('¿Deseas cerrar sesión?')) {
        // Sign out from Supabase
        if (supabaseClient) {
            try {
                await supabaseClient.auth.signOut();
            } catch (err) {
                console.log('Logout error:', err);
            }
        }
        
        // Clear local storage
        localStorage.removeItem('selah_logged_in');
        localStorage.removeItem('selah_user');
        localStorage.removeItem('selah_user_role');
        localStorage.removeItem('selah_user_id');
        localStorage.removeItem('selah_user_name');
        
        currentUser = null;
        currentUserRole = 'asistente';
        document.body.classList.remove('role-admin', 'role-asistente');
        showLoginScreen();
        showToast('Sesión cerrada', 'success');
    }
}

// ===== USER MANAGEMENT =====
async function getRegisteredUsers() {
    const defaultUsers = [
        { username: 'admin', password: 'selah2024', name: 'Administrador', email: 'admin@selah.com', role: 'admin' },
        { username: 'selah', password: 'fisio123', name: 'Selah Fisio', email: 'info@selah.com', role: 'asistente' }
    ];
    
    if (supabaseClient && isOnline) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*');
            
            if (!error && data && data.length > 0) {
                return data;
            }
        } catch (e) {
            console.log('Using local users');
        }
    }
    
    return JSON.parse(localStorage.getItem('selah_users')) || defaultUsers;
}

async function saveRegisteredUsers(users) {
    localStorage.setItem('selah_users', JSON.stringify(users));
}

async function saveUserToSupabase(user) {
    if (supabaseClient && isOnline) {
        try {
            const { error } = await supabaseClient
                .from('users')
                .upsert({
                    username: user.username,
                    password: user.password,
                    name: user.name,
                    email: user.email,
                    role: user.role || 'asistente',
                    created_at: user.createdAt || new Date().toISOString()
                });
            
            if (!error) return true;
        } catch (e) {
            console.log('Could not save to Supabase');
        }
    }
    return false;
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    
    // Load user info
    currentUserRole = localStorage.getItem('selah_user_role') || 'asistente';
    const userName = localStorage.getItem('selah_user_name') || 'Usuario';
    
    // Apply role to body
    document.body.classList.remove('role-admin', 'role-asistente');
    document.body.classList.add('role-' + currentUserRole);
    
    // Update user info in sidebar
    updateUserInfoDisplay(userName, currentUserRole);
    
    initializeApp();
}

function updateUserInfoDisplay(name, role) {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = name;
    if (userRoleEl) userRoleEl.textContent = role === 'admin' ? 'Administrador' : 'Asistente';
    if (userAvatarEl) userAvatarEl.textContent = name.charAt(0).toUpperCase();
}

function initializeApp() {
    initSupabase();
    initNavigation();
    initFormTabs();
    initViewToggle();
    initOnlineStatus();
    updateCurrentDate();
    loadSupabaseConfig();
    renderDashboard();
    renderCalendar();
    renderPatients();
    renderTemplates();
    renderMessageHistory();
    populatePatientSelect();
    updateSettingsStats();
    updateDbConnectionStatus();
    loadLanguagePreference();
    
    // Admin-only renders
    if (currentUserRole === 'admin') {
        renderUsers();
        renderFinances();
    }
    
    if (isOnline && supabaseClient) {
        syncData();
    }
}

// ===== USERS MANAGEMENT (Admin Only) =====
function openUserModal() {
    document.getElementById('userModal').classList.add('active');
    document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('editUserId').value = '';
    document.getElementById('deleteUserBtn').style.display = 'none';
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

async function editUser(username) {
    const users = await getRegisteredUsers();
    const user = users.find(u => u.username === username);
    if (!user) return;
    
    openUserModal();
    document.getElementById('userModalTitle').textContent = 'Editar Usuario';
    document.getElementById('deleteUserBtn').style.display = 'block';
    
    document.getElementById('editUserId').value = user.username;
    document.getElementById('newUserName').value = user.name;
    document.getElementById('newUserUsername').value = user.username;
    document.getElementById('newUserEmail').value = user.email;
    document.getElementById('newUserPassword').value = user.password;
    document.getElementById('newUserRole').value = user.role || 'asistente';
}

async function saveUser(event) {
    event.preventDefault();
    
    const editId = document.getElementById('editUserId').value;
    const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
    const password = document.getElementById('newUserPassword').value;
    const name = document.getElementById('newUserName').value.trim();
    const role = document.getElementById('newUserRole').value;
    
    // Validate password strength for new users
    if (!editId && password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    const saveBtn = document.querySelector('#userForm button[type="submit"]');
    if (saveBtn) {
        saveBtn.textContent = 'Guardando...';
        saveBtn.disabled = true;
    }
    
    try {
        if (!editId) {
            // Creating new user with Supabase Auth
            if (!supabaseClient) {
                throw new Error('No hay conexión con el servidor');
            }
            
            // Sign up new user
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name,
                        role: role
                    }
                }
            });
            
            if (authError) {
                throw authError;
            }
            
            // Create user profile in profiles table
            const { error: profileError } = await supabaseClient
                .from('user_profiles')
                .insert({
                    user_id: authData.user.id,
                    email: email,
                    name: name,
                    role: role,
                    created_at: new Date().toISOString()
                });
            
            if (profileError) {
                console.log('Profile creation error:', profileError);
            }
            
            showToast('Usuario creado. Se enviará un correo de confirmación.', 'success');
            
        } else {
            // Editing existing user - update profile only
            const { error } = await supabaseClient
                .from('user_profiles')
                .update({
                    name: name,
                    role: role
                })
                .eq('email', editId);
            
            if (error) throw error;
            
            showToast('Usuario actualizado', 'success');
        }
        
        closeUserModal();
        renderUsers();
        
    } catch (err) {
        console.error('Save user error:', err);
        
        let errorMessage = 'Error al guardar usuario';
        if (err.message.includes('already registered')) {
            errorMessage = 'Este correo ya está registrado';
        } else if (err.message.includes('valid email')) {
            errorMessage = 'Ingresa un correo válido';
        } else if (err.message.includes('Password')) {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        }
        
        showToast(errorMessage, 'error');
    }
    
    if (saveBtn) {
        saveBtn.textContent = 'Guardar';
        saveBtn.disabled = false;
    }
}

async function deleteUser() {
    const username = document.getElementById('editUserId').value;
    if (!username) return;
    
    if (username === localStorage.getItem('selah_user')) {
        showToast('No puedes eliminar tu propio usuario', 'error');
        return;
    }
    
    if (confirm('¿Eliminar este usuario?')) {
        let users = await getRegisteredUsers();
        users = users.filter(u => u.username !== username);
        await saveRegisteredUsers(users);
        
        if (supabaseClient && isOnline) {
            try {
                await supabaseClient.from('users').delete().eq('username', username);
            } catch (e) {
                console.log('Could not delete from cloud');
            }
        }
        
        closeUserModal();
        renderUsers();
        showToast('Usuario eliminado', 'success');
    }
}

async function renderUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    const users = await getRegisteredUsers();
    
    container.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-card-header">
                <div class="user-card-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div class="user-card-info">
                    <h3>${user.name}</h3>
                    <p>${user.email}</p>
                </div>
            </div>
            <span class="user-card-role ${user.role || 'asistente'}">${user.role === 'admin' ? 'Administrador' : 'Asistente'}</span>
            <div class="user-card-footer">
                <button class="btn-secondary" onclick="editUser('${user.username}')">Editar</button>
            </div>
        </div>
    `).join('');
}

// ===== FINANCES (Admin Only) =====
function setFinancePeriod(period) {
    currentFinancePeriod = period;
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    renderFinances();
}

function renderFinances() {
    if (currentUserRole !== 'admin') return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate, endDate;
    
    if (currentFinancePeriod === 'day') {
        startDate = today;
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
    } else if (currentFinancePeriod === 'week') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
    } else {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    
    // Filter appointments in period
    const periodAppts = appointments.filter(a => {
        const apptDate = new Date(a.date);
        apptDate.setHours(0, 0, 0, 0);
        return apptDate >= startDate && apptDate <= endDate;
    });
    
    // Calculate totals
    let totalIncome = 0;
    let pendingPaymentsTotal = 0;
    let completedCount = 0;
    const paymentMethods = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    const pendingList = [];
    
    periodAppts.forEach(a => {
        const cost = parseFloat(a.cost) || 0;
        
        if (a.paymentStatus === 'paid') {
            totalIncome += cost;
            if (a.paymentMethod && paymentMethods.hasOwnProperty(a.paymentMethod)) {
                paymentMethods[a.paymentMethod] += cost;
            }
        } else if (a.paymentStatus === 'pending' || !a.paymentStatus) {
            if (cost > 0) {
                pendingPaymentsTotal += cost;
                const patient = patients.find(p => p.id === a.patientId);
                pendingList.push({
                    patient: patient ? patient.name : 'Desconocido',
                    date: a.date,
                    amount: cost
                });
            }
        }
        
        if (a.status === 'completed') completedCount++;
    });
    
    // Update stats
    document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('pendingPayments').textContent = `$${pendingPaymentsTotal.toFixed(2)}`;
    document.getElementById('completedAppointments').textContent = completedCount;
    document.getElementById('todayIncome').textContent = `$${totalIncome.toFixed(2)}`;
    
    // Payment methods breakdown
    const methodsContainer = document.getElementById('paymentMethodsBreakdown');
    if (methodsContainer) {
        methodsContainer.innerHTML = `
            <div class="payment-method-item">
                <div class="payment-method-info">
                    <div class="payment-method-icon efectivo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                    </div>
                    <span class="payment-method-name">Efectivo</span>
                </div>
                <span class="payment-method-amount">$${paymentMethods.efectivo.toFixed(2)}</span>
            </div>
            <div class="payment-method-item">
                <div class="payment-method-info">
                    <div class="payment-method-icon tarjeta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                    </div>
                    <span class="payment-method-name">Tarjeta</span>
                </div>
                <span class="payment-method-amount">$${paymentMethods.tarjeta.toFixed(2)}</span>
            </div>
            <div class="payment-method-item">
                <div class="payment-method-info">
                    <div class="payment-method-icon transferencia">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                    </div>
                    <span class="payment-method-name">Transferencia</span>
                </div>
                <span class="payment-method-amount">$${paymentMethods.transferencia.toFixed(2)}</span>
            </div>
        `;
    }
    
    // Pending payments list
    const pendingContainer = document.getElementById('pendingPaymentsList');
    if (pendingContainer) {
        if (pendingList.length === 0) {
            pendingContainer.innerHTML = '<p class="no-data">No hay pagos pendientes</p>';
        } else {
            pendingContainer.innerHTML = pendingList.slice(0, 10).map(p => `
                <div class="pending-payment-item">
                    <div class="pending-payment-info">
                        <span class="pending-payment-name">${p.patient}</span>
                        <span class="pending-payment-date">${formatDate(p.date)}</span>
                    </div>
                    <span class="pending-payment-amount">$${p.amount.toFixed(2)}</span>
                </div>
            `).join('');
        }
    }
    
    // Render chart
    renderIncomeChart(startDate, endDate);
}

function renderIncomeChart(startDate, endDate) {
    const canvas = document.getElementById('incomeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (incomeChart) {
        incomeChart.destroy();
    }
    
    // Generate labels and data based on period
    const labels = [];
    const incomeData = [];
    
    if (currentFinancePeriod === 'day') {
        // Hours of the day
        for (let h = 7; h <= 20; h++) {
            labels.push(`${h}:00`);
            const hourIncome = appointments
                .filter(a => {
                    const apptDate = new Date(a.date);
                    apptDate.setHours(0, 0, 0, 0);
                    const [apptHour] = (a.time || '00:00').split(':').map(Number);
                    return apptDate.getTime() === startDate.getTime() && 
                           apptHour === h && 
                           a.paymentStatus === 'paid';
                })
                .reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0);
            incomeData.push(hourIncome);
        }
    } else if (currentFinancePeriod === 'week') {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            labels.push(dayNames[i]);
            
            const dayIncome = appointments
                .filter(a => {
                    const apptDate = new Date(a.date);
                    apptDate.setHours(0, 0, 0, 0);
                    return apptDate.getTime() === day.getTime() && a.paymentStatus === 'paid';
                })
                .reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0);
            incomeData.push(dayIncome);
        }
    } else {
        // Month - by week
        const weeksInMonth = Math.ceil(endDate.getDate() / 7);
        for (let w = 1; w <= weeksInMonth; w++) {
            labels.push(`Semana ${w}`);
            const weekStart = new Date(startDate);
            weekStart.setDate((w - 1) * 7 + 1);
            const weekEnd = new Date(startDate);
            weekEnd.setDate(w * 7);
            
            const weekIncome = appointments
                .filter(a => {
                    const apptDate = new Date(a.date);
                    return apptDate >= weekStart && apptDate <= weekEnd && a.paymentStatus === 'paid';
                })
                .reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0);
            incomeData.push(weekIncome);
        }
    }
    
    incomeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos',
                data: incomeData,
                backgroundColor: 'rgba(30, 90, 168, 0.7)',
                borderColor: 'rgba(30, 90, 168, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// ===== WHATSAPP FUNCTIONS =====
function sendRemindersToday() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.date === today && a.status !== 'cancelled');
    
    if (todayAppts.length === 0) {
        showToast('No hay citas para hoy', 'warning');
        return;
    }
    
    todayAppts.forEach(appt => {
        const patient = patients.find(p => p.id === appt.patientId);
        if (patient) {
            sendWhatsApp(patient.id, appt.id);
        }
    });
    
    showToast(`Recordatorios enviados a ${todayAppts.length} pacientes`, 'success');
}

function sendRemindersTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const tomorrowAppts = appointments.filter(a => a.date === tomorrowStr && a.status !== 'cancelled');
    
    if (tomorrowAppts.length === 0) {
        showToast('No hay citas para mañana', 'warning');
        return;
    }
    
    tomorrowAppts.forEach(appt => {
        const patient = patients.find(p => p.id === appt.patientId);
        if (patient) {
            sendWhatsApp(patient.id, appt.id);
        }
    });
    
    showToast(`Recordatorios enviados a ${tomorrowAppts.length} pacientes`, 'success');
}

function sendWhatsApp(patientId, appointmentId) {
    const patient = patients.find(p => p.id === patientId);
    const appointment = appointments.find(a => a.id === appointmentId);
    
    if (!patient) return;
    
    const template = templates[0];
    
    let message = template.message
        .replace('{nombre}', patient.name)
        .replace('{fecha}', appointment ? formatDate(appointment.date) : '')
        .replace('{hora}', appointment ? formatTime(appointment.time) : '')
        .replace('{terapia}', getTherapyName(appointment?.therapy || patient.therapyType));
    
    const phone = patient.phone.replace(/\D/g, '');
    
    // Log message to history
    addMessageToHistory(patient.name, message);
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

function sendWhatsAppToPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const phone = patient.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
}

function addMessageToHistory(recipient, message) {
    messageHistory.unshift({
        recipient,
        message,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 messages
    if (messageHistory.length > 50) {
        messageHistory = messageHistory.slice(0, 50);
    }
    
    localStorage.setItem('selah_messages', JSON.stringify(messageHistory));
    renderMessageHistory();
}

function renderMessageHistory() {
    const container = document.getElementById('messageHistory');
    if (!container) return;
    
    if (messageHistory.length === 0) {
        container.innerHTML = '<p class="no-data">No hay mensajes enviados aún</p>';
        return;
    }
    
    container.innerHTML = messageHistory.slice(0, 10).map(msg => `
        <div class="message-history-item">
            <div class="message-info">
                <div class="message-recipient">${msg.recipient}</div>
                <div class="message-preview">${msg.message.substring(0, 50)}...</div>
            </div>
            <div class="message-time">${formatDateTime(msg.timestamp)}</div>
        </div>
    `).join('');
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ===== LANGUAGE =====
const translations = {
    es: {
        dashboard: 'Dashboard',
        agenda: 'Agenda',
        patients: 'Pacientes',
        templates: 'WhatsApp',
        finances: 'Finanzas',
        users: 'Usuarios',
        settings: 'Configuración',
        sync: 'Sincronizar',
        logout: 'Cerrar Sesión',
        online: 'En línea',
        offline: 'Sin conexión'
    },
    en: {
        dashboard: 'Dashboard',
        agenda: 'Schedule',
        patients: 'Patients',
        templates: 'WhatsApp',
        finances: 'Finances',
        users: 'Users',
        settings: 'Settings',
        sync: 'Sync',
        logout: 'Log Out',
        online: 'Online',
        offline: 'Offline'
    }
};

function changeLanguage(lang) {
    appLanguage = lang;
    localStorage.setItem('selah_language', lang);
    applyTranslations(lang);
    showToast(lang === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English', 'success');
}

function loadLanguagePreference() {
    const savedLang = localStorage.getItem('selah_language') || 'es';
    appLanguage = savedLang;
    const radio = document.querySelector(`input[name="appLanguage"][value="${savedLang}"]`);
    if (radio) radio.checked = true;
    applyTranslations(savedLang);
}

function applyTranslations(lang) {
    const t = translations[lang];
    
    document.querySelectorAll('.nav-item').forEach(item => {
        const section = item.dataset.section;
        const span = item.querySelector('span');
        if (span && t[section]) span.textContent = t[section];
    });
    
    const syncText = document.getElementById('syncBtnText');
    if (syncText) syncText.textContent = t.sync;
    
    const logoutBtn = document.querySelector('.logout-btn span');
    if (logoutBtn) logoutBtn.textContent = t.logout;
    
    const connText = document.getElementById('connectionText');
    if (connText) connText.textContent = isOnline ? t.online : t.offline;
}

// ===== DB CONNECTION STATUS =====
function updateDbConnectionStatus() {
    const statusCard = document.getElementById('dbConnectionStatus');
    if (!statusCard) return;
    
    const indicator = statusCard.querySelector('.connection-indicator');
    const details = statusCard.querySelector('.connection-details');
    
    if (supabaseClient && isOnline) {
        statusCard.classList.remove('disconnected');
        indicator.classList.remove('offline');
        indicator.querySelector('span').textContent = 'Conectado';
        details.textContent = 'Base de datos sincronizada correctamente';
    } else {
        statusCard.classList.add('disconnected');
        indicator.classList.add('offline');
        indicator.querySelector('span').textContent = 'Sin conexión';
        details.textContent = 'Trabajando en modo offline';
    }
}

// ===== ONLINE/OFFLINE STATUS =====
function initOnlineStatus() {
    updateConnectionStatus();
    
    window.addEventListener('online', () => {
        isOnline = true;
        updateConnectionStatus();
        showToast('Conexión restaurada', 'success');
        if (supabaseClient && pendingChanges.length > 0) {
            syncData();
        }
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        updateConnectionStatus();
        showToast('Sin conexión - Modo offline', 'warning');
    });
}

function updateConnectionStatus() {
    const statusDiv = document.getElementById('connectionStatus');
    if (!statusDiv) return;
    
    const dot = statusDiv.querySelector('.status-dot');
    const text = document.getElementById('connectionText');
    
    dot.className = 'status-dot';
    
    if (!isOnline) {
        dot.classList.add('offline');
        text.textContent = 'Sin conexión';
    } else if (pendingChanges.length > 0) {
        dot.classList.add('syncing');
        text.textContent = `${pendingChanges.length} pendientes`;
    } else {
        dot.classList.add('online');
        text.textContent = 'En línea';
    }
}

// ===== SYNC FUNCTIONALITY =====
async function syncData() {
    if (!isOnline) {
        showToast('No hay conexión a internet', 'error');
        return;
    }
    
    if (!supabaseClient) {
        showToast('Configura Supabase primero', 'warning');
        return;
    }
    
    const syncBtn = document.getElementById('syncBtn');
    const syncText = document.getElementById('syncBtnText');
    const syncStatus = document.getElementById('syncStatus');
    
    if (syncBtn) syncBtn.classList.add('syncing');
    if (syncText) syncText.textContent = 'Sincronizando...';
    
    try {
        if (pendingChanges.length > 0) {
            for (const change of pendingChanges) {
                await pushChange(change);
            }
            pendingChanges = [];
            localStorage.setItem('selah_pending', JSON.stringify(pendingChanges));
        }
        
        await pullFromSupabase();
        
        if (syncStatus) syncStatus.textContent = `Última sync: ${new Date().toLocaleTimeString()}`;
        showToast('Sincronización completada', 'success');
    } catch (error) {
        console.error('Sync error:', error);
        showToast('Error al sincronizar', 'error');
        if (syncStatus) syncStatus.textContent = 'Error en sincronización';
    }
    
    if (syncBtn) syncBtn.classList.remove('syncing');
    if (syncText) syncText.textContent = 'Sincronizar';
    updateConnectionStatus();
}

async function pushChange(change) {
    if (!supabaseClient) return;
    
    try {
        if (change.type === 'patient') {
            if (change.action === 'delete') {
                await supabaseClient.from('patients').delete().eq('id', change.id);
            } else {
                await supabaseClient.from('patients').upsert(change.data);
            }
        } else if (change.type === 'appointment') {
            if (change.action === 'delete') {
                await supabaseClient.from('appointments').delete().eq('id', change.id);
            } else {
                await supabaseClient.from('appointments').upsert(change.data);
            }
        }
    } catch (error) {
        console.error('Push error:', error);
        throw error;
    }
}

async function pullFromSupabase() {
    if (!supabaseClient) return;
    
    try {
        const { data: cloudPatients, error: patientsError } = await supabaseClient
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!patientsError && cloudPatients) {
            const mergedPatients = mergeData(patients, cloudPatients);
            patients = mergedPatients;
            saveLocalData();
        }
        
        const { data: cloudAppointments, error: appointmentsError } = await supabaseClient
            .from('appointments')
            .select('*')
            .order('date', { ascending: true });
        
        if (!appointmentsError && cloudAppointments) {
            const mergedAppointments = mergeData(appointments, cloudAppointments);
            appointments = mergedAppointments;
            saveLocalData();
        }
        
        renderDashboard();
        renderCalendar();
        renderPatients();
        populatePatientSelect();
        updateSettingsStats();
        
        if (currentUserRole === 'admin') {
            renderFinances();
        }
        
    } catch (error) {
        console.error('Pull error:', error);
        throw error;
    }
}

function mergeData(local, cloud) {
    const merged = new Map();
    
    cloud.forEach(item => {
        merged.set(item.id, item);
    });
    
    local.forEach(item => {
        const cloudItem = merged.get(item.id);
        if (!cloudItem || new Date(item.updatedAt || 0) > new Date(cloudItem.updated_at || 0)) {
            merged.set(item.id, item);
        }
    });
    
    return Array.from(merged.values());
}

function addPendingChange(type, action, data, id = null) {
    pendingChanges.push({ type, action, data, id, timestamp: new Date().toISOString() });
    localStorage.setItem('selah_pending', JSON.stringify(pendingChanges));
    updateConnectionStatus();
    updateSettingsStats();
}

// ===== SUPABASE CONFIG =====
function loadSupabaseConfig() {
    const url = localStorage.getItem('supabase_url') || '';
    const key = localStorage.getItem('supabase_key') || '';
    
    const urlEl = document.getElementById('supabaseUrl');
    const keyEl = document.getElementById('supabaseKey');
    if (urlEl) urlEl.value = url;
    if (keyEl) keyEl.value = key;
}

async function testConnection() {
    const resultDiv = document.getElementById('connectionTest');
    const statusCard = document.getElementById('dbConnectionStatus');
    
    if (!resultDiv || !statusCard) return;
    
    const indicator = statusCard.querySelector('.connection-indicator');
    const details = statusCard.querySelector('.connection-details');
    
    resultDiv.className = 'connection-test-result';
    resultDiv.textContent = 'Verificando conexión...';
    
    if (!supabaseClient) {
        resultDiv.className = 'connection-test-result error';
        resultDiv.textContent = 'No hay conexión configurada';
        return;
    }
    
    try {
        const { error } = await supabaseClient.from('patients').select('count', { count: 'exact', head: true });
        
        if (error) throw error;
        
        resultDiv.className = 'connection-test-result success';
        resultDiv.textContent = 'Conexión verificada correctamente';
        
        statusCard.classList.remove('disconnected');
        indicator.classList.remove('offline');
        indicator.querySelector('span').textContent = 'Conectado';
        details.textContent = 'Base de datos sincronizada correctamente';
        
        showToast('Conexión exitosa', 'success');
    } catch (error) {
        resultDiv.className = 'connection-test-result error';
        resultDiv.textContent = `Error: ${error.message}`;
        
        statusCard.classList.add('disconnected');
        indicator.classList.add('offline');
        indicator.querySelector('span').textContent = 'Error de conexión';
        details.textContent = error.message;
    }
}

// ===== DEFAULT TEMPLATES =====
function getDefaultTemplates() {
    return [
        {
            id: 1,
            name: 'Recordatorio de Cita',
            message: 'Hola {nombre}, te recordamos tu cita en Selah Fisioterapia para el {fecha} a las {hora}. Te esperamos.'
        },
        {
            id: 2,
            name: 'Confirmación de Cita',
            message: 'Hola {nombre}, tu cita ha sido confirmada para el {fecha} a las {hora}. Tipo de terapia: {terapia}. Gracias por confiar en Selah.'
        },
        {
            id: 3,
            name: 'Seguimiento Post-Sesión',
            message: 'Hola {nombre}, esperamos que te sientas mejor después de tu sesión de {terapia}. Recuerda seguir las indicaciones. - Selah'
        }
    ];
}

// ===== NAVIGATION =====
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // Check if admin-only section
            if (this.classList.contains('admin-only') && currentUserRole !== 'admin') {
                return;
            }
            
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const sectionId = this.dataset.section;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
            
            if (sectionId === 'dashboard') renderDashboard();
            if (sectionId === 'agenda') renderCalendar();
            if (sectionId === 'patients') renderPatients();
            if (sectionId === 'templates') { renderTemplates(); renderMessageHistory(); }
            if (sectionId === 'finances' && currentUserRole === 'admin') renderFinances();
            if (sectionId === 'users' && currentUserRole === 'admin') renderUsers();
            if (sectionId === 'settings') updateSettingsStats();
        });
    });
}

function initFormTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('tab-' + tabId).classList.add('active');
        });
    });
}

function initViewToggle() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            renderCalendar();
        });
    });
}

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const el = document.getElementById('currentDate');
    if (el) el.textContent = new Date().toLocaleDateString('es-ES', options);
}

function updateSettingsStats() {
    const localPatientsEl = document.getElementById('localPatients');
    const localApptsEl = document.getElementById('localAppointments');
    const pendingSyncEl = document.getElementById('pendingSync');
    
    if (localPatientsEl) localPatientsEl.textContent = patients.length;
    if (localApptsEl) localApptsEl.textContent = appointments.length;
    if (pendingSyncEl) pendingSyncEl.textContent = pendingChanges.length;
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== DASHBOARD =====
function renderDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAppts = appointments.filter(a => {
        const apptDate = new Date(a.date);
        apptDate.setHours(0, 0, 0, 0);
        return apptDate.getTime() === today.getTime() && a.status !== 'cancelled';
    }).sort((a, b) => a.time.localeCompare(b.time));
    
    const pendingAppts = appointments.filter(a => a.status === 'pending');
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    const weekAppts = appointments.filter(a => {
        const apptDate = new Date(a.date);
        return apptDate >= weekStart && apptDate < weekEnd && a.status !== 'cancelled';
    });
    
    // Calculate today's income for admin
    let todayIncome = 0;
    if (currentUserRole === 'admin') {
        todayIncome = todayAppts
            .filter(a => a.paymentStatus === 'paid')
            .reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0);
    }
    
    const totalPatientsEl = document.getElementById('totalPatients');
    const todayApptsEl = document.getElementById('todayAppointments');
    const pendingApptsEl = document.getElementById('pendingAppointments');
    const todayIncomeEl = document.getElementById('todayIncome');
    
    if (totalPatientsEl) totalPatientsEl.textContent = patients.length;
    if (todayApptsEl) todayApptsEl.textContent = todayAppts.length;
    if (pendingApptsEl) pendingApptsEl.textContent = pendingAppts.length;
    if (todayIncomeEl) todayIncomeEl.textContent = `$${todayIncome.toFixed(2)}`;
    
    // Today's list
    const todayList = document.getElementById('todayList');
    if (todayList) {
        if (todayAppts.length === 0) {
            todayList.innerHTML = '<p class="no-data">No hay citas programadas para hoy</p>';
        } else {
            todayList.innerHTML = todayAppts.map(appt => {
                const patient = patients.find(p => p.id === appt.patientId);
                if (!patient) return '';
                return `
                    <div class="appointment-item">
                        <span class="appointment-time">${formatTime(appt.time)}</span>
                        <div class="appointment-info">
                            <div class="name">${patient.name}</div>
                            <div class="therapy">${getTherapyName(appt.therapy || patient.therapyType)}</div>
                        </div>
                        <span class="appointment-status status-${appt.status}">${getStatusName(appt.status)}</span>
                        <div class="appointment-actions">
                            <button class="whatsapp-btn" onclick="sendWhatsApp('${patient.id}', '${appt.id}')" title="Enviar WhatsApp">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Next patient
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const nextAppt = todayAppts.find(a => a.time >= currentTimeStr && a.status !== 'cancelled' && a.status !== 'completed');
    const nextPatientDiv = document.getElementById('nextPatient');
    
    if (nextPatientDiv) {
        if (nextAppt) {
            const patient = patients.find(p => p.id === nextAppt.patientId);
            if (patient) {
                nextPatientDiv.innerHTML = `
                    <div class="patient-name">${patient.name}</div>
                    <div class="patient-time">${formatTime(nextAppt.time)}</div>
                    <div class="patient-therapy">${getTherapyName(nextAppt.therapy || patient.therapyType)}</div>
                    <button class="btn-primary" onclick="sendWhatsApp('${patient.id}', '${nextAppt.id}')">
                        Enviar Recordatorio
                    </button>
                `;
            }
        } else {
            nextPatientDiv.innerHTML = '<p class="no-data">No hay más citas para hoy</p>';
        }
    }
}

// ===== CALENDAR =====
function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;
    
    updateCalendarTitle();
    
    if (currentView === 'week') renderWeekView(container);
    else if (currentView === 'day') renderDayView(container);
    else renderMonthView(container);
}

function updateCalendarTitle() {
    const titleEl = document.getElementById('calendarTitle');
    if (!titleEl) return;
    
    const options = { month: 'long', year: 'numeric' };
    let title = '';
    
    if (currentView === 'week') {
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
            title = weekStart.toLocaleDateString('es-ES', options);
        } else {
            title = `${weekStart.toLocaleDateString('es-ES', { month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', options)}`;
        }
    } else if (currentView === 'day') {
        title = currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else {
        title = currentDate.toLocaleDateString('es-ES', options);
    }
    
    titleEl.textContent = title;
}

function getWeekStart(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

function renderWeekView(container) {
    const weekStart = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push(day);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const hours = [];
    for (let h = 7; h <= 20; h++) hours.push(h);
    
    let html = '<div class="week-view">';
    
    html += '<div class="week-header">';
    html += '<div class="week-header-cell"></div>';
    days.forEach((day, i) => {
        const isToday = day.getTime() === today.getTime();
        html += `
            <div class="week-header-cell ${isToday ? 'today' : ''}">
                <div class="day-name">${dayNames[i]}</div>
                <div class="day-number">${day.getDate()}</div>
            </div>
        `;
    });
    html += '</div>';
    
    html += '<div class="time-column">';
    hours.forEach(h => html += `<div class="time-slot">${h}:00</div>`);
    html += '</div>';
    
    days.forEach(day => {
        html += '<div class="day-column">';
        hours.forEach(h => {
            const dateStr = day.toISOString().split('T')[0];
            html += `<div class="day-slot" onclick="quickAddAppointment('${dateStr}', '${h}:00')"></div>`;
        });
        
        const dayAppts = appointments.filter(a => {
            const apptDate = new Date(a.date);
            apptDate.setHours(0, 0, 0, 0);
            const dayDate = new Date(day);
            dayDate.setHours(0, 0, 0, 0);
            return apptDate.getTime() === dayDate.getTime();
        });
        
        dayAppts.forEach(appt => {
            const patient = patients.find(p => p.id === appt.patientId);
            if (!patient) return;
            
            const [hour, min] = appt.time.split(':').map(Number);
            const startHour = hour - 7;
            const top = (startHour * 60) + min;
            const height = appt.duration || 60;
            
            html += `
                <div class="calendar-event status-${appt.status}" 
                     style="top: ${top}px; height: ${height}px;"
                     onclick="editAppointment('${appt.id}')">
                    <strong>${formatTime(appt.time)}</strong> ${patient.name}
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderDayView(container) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);
    const isToday = current.getTime() === today.getTime();
    
    const hours = [];
    for (let h = 7; h <= 20; h++) hours.push(h);
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayAppts = appointments.filter(a => a.date === dateStr);
    
    let html = '<div class="week-view" style="grid-template-columns: 80px 1fr;">';
    
    html += '<div class="week-header">';
    html += '<div class="week-header-cell"></div>';
    html += `<div class="week-header-cell ${isToday ? 'today' : ''}">${currentDate.toLocaleDateString('es-ES', { weekday: 'short' })} ${currentDate.getDate()}</div>`;
    html += '</div>';
    
    html += '<div class="time-column">';
    hours.forEach(h => html += `<div class="time-slot">${h}:00</div>`);
    html += '</div>';
    
    html += '<div class="day-column">';
    hours.forEach(h => html += `<div class="day-slot" onclick="quickAddAppointment('${dateStr}', '${h}:00')"></div>`);
    
    dayAppts.forEach(appt => {
        const patient = patients.find(p => p.id === appt.patientId);
        if (!patient) return;
        
        const [hour, min] = appt.time.split(':').map(Number);
        const startHour = hour - 7;
        const top = (startHour * 60) + min;
        const height = appt.duration || 60;
        
        html += `
            <div class="calendar-event status-${appt.status}" 
                 style="top: ${top}px; height: ${height}px;"
                 onclick="editAppointment('${appt.id}')">
                <strong>${formatTime(appt.time)}</strong> ${patient.name}
            </div>
        `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

function renderMonthView(container) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    let html = '<div style="display:grid; grid-template-columns:repeat(7, 1fr);">';
    
    dayNames.forEach(name => {
        html += `<div style="padding:12px; text-align:center; background:var(--secondary); font-weight:600; color:var(--primary);">${name}</div>`;
    });
    
    for (let i = 0; i < startDay; i++) {
        html += '<div style="padding:8px; min-height:80px; background:var(--bg-light);"></div>';
    }
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(year, month, d);
        date.setHours(0, 0, 0, 0);
        const isToday = date.getTime() === today.getTime();
        const dateStr = date.toISOString().split('T')[0];
        
        const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
        
        html += `
            <div style="padding:8px; min-height:80px; border:1px solid var(--border); cursor:pointer; ${isToday ? 'background:var(--secondary);' : 'background:var(--white);'}" onclick="goToDay('${dateStr}')">
                <div style="font-weight:${isToday ? '700' : '500'}; color:${isToday ? 'var(--primary)' : 'var(--text-dark)'};">${d}</div>
                ${dayAppts.slice(0, 3).map(a => {
                    const p = patients.find(pt => pt.id === a.patientId);
                    return `<div style="font-size:0.7rem; padding:2px 4px; background:var(--primary); color:white; border-radius:3px; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${formatTime(a.time)} ${p ? p.name.split(' ')[0] : ''}</div>`;
                }).join('')}
                ${dayAppts.length > 3 ? `<div style="font-size:0.7rem; color:var(--text-light);">+${dayAppts.length - 3} más</div>` : ''}
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function navigateCalendar(direction) {
    if (currentView === 'week') currentDate.setDate(currentDate.getDate() + (direction * 7));
    else if (currentView === 'day') currentDate.setDate(currentDate.getDate() + direction);
    else currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

function goToDay(dateStr) {
    currentDate = new Date(dateStr);
    currentView = 'day';
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.view-btn[data-view="day"]').classList.add('active');
    renderCalendar();
}

function quickAddAppointment(date, time) {
    openAppointmentModal();
    document.getElementById('appointmentDate').value = date;
    document.getElementById('appointmentTime').value = time;
}

// ===== PATIENTS =====
function renderPatients() {
    const container = document.getElementById('patientsList');
    if (!container) return;
    
    if (patients.length === 0) {
        container.innerHTML = '<p class="no-data" style="grid-column:1/-1;">No hay pacientes registrados.</p>';
        return;
    }
    
    container.innerHTML = patients.map(patient => `
        <div class="patient-card">
            <div class="patient-card-header">
                <div>
                    <h3>${patient.name}</h3>
                    <p class="diagnosis">${patient.diagnosis || 'Sin diagnóstico'}</p>
                </div>
                <span class="appointment-status status-confirmed">${patient.sessions || 0} sesiones</span>
            </div>
            <div class="patient-card-body">
                <div class="patient-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.61.67 2.36a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.31 1.55.54 2.36.67A2 2 0 0 1 22 16.92z"/></svg>
                    ${patient.phone}
                </div>
                ${patient.bodyZone ? `<div class="patient-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>Zona: ${getBodyZoneName(patient.bodyZone)}</div>` : ''}
                <div class="patient-tags">
                    ${patient.therapyType ? `<span class="tag">${getTherapyName(patient.therapyType)}</span>` : ''}
                </div>
            </div>
            <div class="patient-card-footer">
                <button class="btn-edit" onclick="editPatient('${patient.id}')">Editar</button>
                <button class="btn-schedule" onclick="scheduleForPatient('${patient.id}')">Cita</button>
                <button class="btn-whatsapp" onclick="sendWhatsAppToPatient('${patient.id}')">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

function filterPatients() {
    const search = document.getElementById('patientSearch').value.toLowerCase();
    const therapyFilter = document.getElementById('therapyFilter').value;
    
    const filtered = patients.filter(p => {
        const matchName = p.name.toLowerCase().includes(search);
        const matchTherapy = !therapyFilter || p.therapyType === therapyFilter;
        return matchName && matchTherapy;
    });
    
    const container = document.getElementById('patientsList');
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data" style="grid-column:1/-1;">No se encontraron pacientes.</p>';
        return;
    }
    
    container.innerHTML = filtered.map(patient => `
        <div class="patient-card">
            <div class="patient-card-header">
                <div>
                    <h3>${patient.name}</h3>
                    <p class="diagnosis">${patient.diagnosis || 'Sin diagnóstico'}</p>
                </div>
            </div>
            <div class="patient-card-body">
                <div class="patient-detail">${patient.phone}</div>
            </div>
            <div class="patient-card-footer">
                <button class="btn-edit" onclick="editPatient('${patient.id}')">Editar</button>
                <button class="btn-schedule" onclick="scheduleForPatient('${patient.id}')">Cita</button>
            </div>
        </div>
    `).join('');
}

// ===== TEMPLATES =====
function renderTemplates() {
    const container = document.getElementById('templatesList');
    if (!container) return;
    
    container.innerHTML = templates.map(template => `
        <div class="template-card">
            <div>
                <h3>${template.name}</h3>
                <p>${template.message}</p>
            </div>
            <div class="template-actions">
                <button class="btn-secondary" onclick="editTemplate('${template.id}')">Editar</button>
                <button class="btn-danger" onclick="deleteTemplate('${template.id}')">Eliminar</button>
            </div>
        </div>
    `).join('');
}

// ===== MODALS =====

function openPatientModal() {
    document.getElementById('patientModal').classList.add('active');
    document.getElementById('patientModalTitle').textContent = 'Nuevo Paciente';
    document.getElementById('patientForm').reset();
    document.getElementById('patientId').value = '';
    document.getElementById('patientSessions').value = '0';
    document.getElementById('deletePatientBtn').style.display = 'none';
    currentPatientEvolution = [];
    renderEvolutionTimeline();
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab-btn[data-tab="personal"]').classList.add('active');
    document.getElementById('tab-personal').classList.add('active');
}

function closePatientModal() {
    document.getElementById('patientModal').classList.remove('active');
}

function editPatient(id) {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    
    openPatientModal();
    document.getElementById('patientModalTitle').textContent = 'Editar Paciente';
    document.getElementById('deletePatientBtn').style.display = 'block';
    
    document.getElementById('patientId').value = patient.id;
    document.getElementById('patientName').value = patient.name || '';
    document.getElementById('patientPhone').value = patient.phone || '';
    document.getElementById('patientEmail').value = patient.email || '';
    document.getElementById('patientBirthdate').value = patient.birthdate || '';
    document.getElementById('patientOccupation').value = patient.occupation || '';
    document.getElementById('patientReferrer').value = patient.referrer || '';
    document.getElementById('patientAddress').value = patient.address || '';
    document.getElementById('patientDiagnosis').value = patient.diagnosis || '';
    document.getElementById('patientBodyZone').value = patient.bodyZone || '';
    document.getElementById('patientTherapyType').value = patient.therapyType || '';
    document.getElementById('patientSessions').value = patient.sessions || 0;
    document.getElementById('patientMedicalHistory').value = patient.medicalHistory || '';
    document.getElementById('patientReason').value = patient.reason || '';
    document.getElementById('patientNotes').value = patient.notes || '';
    
    currentPatientEvolution = patient.evolution || [];
    renderEvolutionTimeline();
}

function savePatient(event) {
    event.preventDefault();
    
    const id = document.getElementById('patientId').value || Date.now().toString();
    
    const patientData = {
        id,
        name: document.getElementById('patientName').value,
        phone: document.getElementById('patientPhone').value,
        email: document.getElementById('patientEmail').value,
        birthdate: document.getElementById('patientBirthdate').value,
        occupation: document.getElementById('patientOccupation').value,
        referrer: document.getElementById('patientReferrer').value,
        address: document.getElementById('patientAddress').value,
        diagnosis: document.getElementById('patientDiagnosis').value,
        bodyZone: document.getElementById('patientBodyZone').value,
        therapyType: document.getElementById('patientTherapyType').value,
        sessions: parseInt(document.getElementById('patientSessions').value) || 0,
        medicalHistory: document.getElementById('patientMedicalHistory').value,
        reason: document.getElementById('patientReason').value,
        notes: document.getElementById('patientNotes').value,
        evolution: currentPatientEvolution,
        updatedAt: new Date().toISOString(),
        createdAt: patients.find(p => p.id === id)?.createdAt || new Date().toISOString()
    };
    
    const existingIndex = patients.findIndex(p => p.id === id);
    if (existingIndex >= 0) {
        patients[existingIndex] = patientData;
    } else {
        patients.push(patientData);
    }
    
    saveLocalData();
    addPendingChange('patient', 'upsert', patientData);
    
    closePatientModal();
    renderPatients();
    renderDashboard();
    populatePatientSelect();
    showToast('Paciente guardado', 'success');
}

function deletePatient() {
    const id = document.getElementById('patientId').value;
    if (!id) return;
    
    if (confirm('¿Eliminar este paciente? Esta acción no se puede deshacer.')) {
        patients = patients.filter(p => p.id !== id);
        appointments = appointments.filter(a => a.patientId !== id);
        
        saveLocalData();
        addPendingChange('patient', 'delete', null, id);
        
        closePatientModal();
        renderPatients();
        renderDashboard();
        renderCalendar();
        populatePatientSelect();
        showToast('Paciente eliminado', 'success');
    }
}

// Appointment Modal
function openAppointmentModal() {
    document.getElementById('appointmentModal').classList.add('active');
    document.getElementById('appointmentModalTitle').textContent = 'Nueva Cita';
    document.getElementById('appointmentForm').reset();
    document.getElementById('appointmentId').value = '';
    document.getElementById('deleteAppointmentBtn').style.display = 'none';
    populatePatientSelect();
    document.getElementById('appointmentDate').value = new Date().toISOString().split('T')[0];
}

function closeAppointmentModal() {
    document.getElementById('appointmentModal').classList.remove('active');
}

function editAppointment(id) {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;
    
    openAppointmentModal();
    document.getElementById('appointmentModalTitle').textContent = 'Editar Cita';
    document.getElementById('deleteAppointmentBtn').style.display = 'block';
    
    document.getElementById('appointmentId').value = appt.id;
    document.getElementById('appointmentPatient').value = appt.patientId;
    document.getElementById('appointmentDate').value = appt.date;
    document.getElementById('appointmentTime').value = appt.time;
    document.getElementById('appointmentDuration').value = appt.duration || 60;
    document.getElementById('appointmentStatus').value = appt.status;
    document.getElementById('appointmentTherapy').value = appt.therapy || '';
    document.getElementById('appointmentCost').value = appt.cost || '';
    document.getElementById('appointmentPaymentMethod').value = appt.paymentMethod || '';
    document.getElementById('appointmentPaymentStatus').value = appt.paymentStatus || 'pending';
    document.getElementById('appointmentNotes').value = appt.notes || '';
}

function saveAppointment(event) {
    event.preventDefault();
    
    const id = document.getElementById('appointmentId').value || Date.now().toString();
    
    const apptData = {
        id,
        patientId: document.getElementById('appointmentPatient').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        duration: parseInt(document.getElementById('appointmentDuration').value),
        status: document.getElementById('appointmentStatus').value,
        therapy: document.getElementById('appointmentTherapy').value,
        cost: parseFloat(document.getElementById('appointmentCost').value) || 0,
        paymentMethod: document.getElementById('appointmentPaymentMethod').value,
        paymentStatus: document.getElementById('appointmentPaymentStatus').value,
        notes: document.getElementById('appointmentNotes').value,
        updatedAt: new Date().toISOString()
    };
    
    const existingIndex = appointments.findIndex(a => a.id === id);
    if (existingIndex >= 0) {
        appointments[existingIndex] = apptData;
    } else {
        appointments.push(apptData);
    }
    
    saveLocalData();
    addPendingChange('appointment', 'upsert', apptData);
    
    closeAppointmentModal();
    renderCalendar();
    renderDashboard();
    
    if (currentUserRole === 'admin') {
        renderFinances();
    }
    
    showToast('Cita guardada', 'success');
}

function deleteAppointment() {
    const id = document.getElementById('appointmentId').value;
    if (!id) return;
    
    if (confirm('¿Eliminar esta cita?')) {
        appointments = appointments.filter(a => a.id !== id);
        saveLocalData();
        addPendingChange('appointment', 'delete', null, id);
        
        closeAppointmentModal();
        renderCalendar();
        renderDashboard();
        
        if (currentUserRole === 'admin') {
            renderFinances();
        }
        
        showToast('Cita eliminada', 'success');
    }
}

function scheduleForPatient(patientId) {
    openAppointmentModal();
    document.getElementById('appointmentPatient').value = patientId;
}

// Template Modal
function openTemplateModal() {
    document.getElementById('templateModal').classList.add('active');
    document.getElementById('templateForm').reset();
    document.getElementById('templateId').value = '';
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('active');
}

function editTemplate(id) {
    const template = templates.find(t => t.id == id);
    if (!template) return;
    
    openTemplateModal();
    document.getElementById('templateId').value = template.id;
    document.getElementById('templateName').value = template.name;
    document.getElementById('templateMessage').value = template.message;
}

function saveTemplate(event) {
    event.preventDefault();
    
    const id = document.getElementById('templateId').value || Date.now();
    
    const templateData = {
        id: parseInt(id) || Date.now(),
        name: document.getElementById('templateName').value,
        message: document.getElementById('templateMessage').value
    };
    
    const existingIndex = templates.findIndex(t => t.id == id);
    if (existingIndex >= 0) {
        templates[existingIndex] = templateData;
    } else {
        templates.push(templateData);
    }
    
    localStorage.setItem('selah_templates', JSON.stringify(templates));
    closeTemplateModal();
    renderTemplates();
    showToast('Plantilla guardada', 'success');
}

function deleteTemplate(id) {
    if (confirm('¿Eliminar esta plantilla?')) {
        templates = templates.filter(t => t.id != id);
        localStorage.setItem('selah_templates', JSON.stringify(templates));
        renderTemplates();
        showToast('Plantilla eliminada', 'success');
    }
}

// Evolution Modal
function addEvolutionNote() {
    document.getElementById('evolutionModal').classList.add('active');
    document.getElementById('evolutionForm').reset();
    document.getElementById('evolutionDate').value = new Date().toISOString().split('T')[0];
}

function closeEvolutionModal() {
    document.getElementById('evolutionModal').classList.remove('active');
}

function saveEvolutionNote(event) {
    event.preventDefault();
    
    const note = {
        id: Date.now(),
        date: document.getElementById('evolutionDate').value,
        subjective: document.getElementById('evolutionSubjective').value,
        objective: document.getElementById('evolutionObjective').value,
        analysis: document.getElementById('evolutionAnalysis').value,
        plan: document.getElementById('evolutionPlan').value
    };
    
    currentPatientEvolution.unshift(note);
    renderEvolutionTimeline();
    closeEvolutionModal();
}

function renderEvolutionTimeline() {
    const container = document.getElementById('evolutionTimeline');
    if (!container) return;
    
    if (currentPatientEvolution.length === 0) {
        container.innerHTML = '<p class="no-data">No hay notas de evolución.</p>';
        return;
    }
    
    container.innerHTML = currentPatientEvolution.map(note => `
        <div class="timeline-item">
            <div class="timeline-date">${formatDate(note.date)}</div>
            <div class="timeline-content">
                ${note.subjective ? `<p><strong>S:</strong> ${note.subjective}</p>` : ''}
                ${note.objective ? `<p><strong>O:</strong> ${note.objective}</p>` : ''}
                ${note.analysis ? `<p><strong>A:</strong> ${note.analysis}</p>` : ''}
                ${note.plan ? `<p><strong>P:</strong> ${note.plan}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// ===== UTILITIES =====
function populatePatientSelect() {
    const select = document.getElementById('appointmentPatient');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar paciente...</option>' + 
        patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getTherapyName(type) {
    const types = {
        'manual': 'Terapia Manual',
        'electroterapia': 'Electroterapia',
        'ejercicio': 'Ejercicio Terapéutico',
        'masaje': 'Masoterapia',
        'rehabilitacion': 'Rehabilitación',
        'combinada': 'Terapia Combinada'
    };
    return types[type] || type || 'Sin especificar';
}

function getBodyZoneName(zone) {
    const zones = {
        'cervical': 'Cervical', 'dorsal': 'Dorsal', 'lumbar': 'Lumbar',
        'hombro': 'Hombro', 'codo': 'Codo', 'muneca': 'Muñeca/Mano',
        'cadera': 'Cadera', 'rodilla': 'Rodilla', 'tobillo': 'Tobillo/Pie', 'otro': 'Otro'
    };
    return zones[zone] || zone || '';
}

function getStatusName(status) {
    const statuses = { 'pending': 'Pendiente', 'confirmed': 'Confirmada', 'completed': 'Completada', 'cancelled': 'Cancelada' };
    return statuses[status] || status;
}

function saveLocalData() {
    localStorage.setItem('selah_patients', JSON.stringify(patients));
    localStorage.setItem('selah_appointments', JSON.stringify(appointments));
    updateSettingsStats();
}

function exportData() {
    const data = {
        patients,
        appointments,
        templates,
        messageHistory,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selah_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado', 'success');
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.patients) patients = data.patients;
            if (data.appointments) appointments = data.appointments;
            if (data.templates) templates = data.templates;
            if (data.messageHistory) messageHistory = data.messageHistory;
            
            saveLocalData();
            localStorage.setItem('selah_templates', JSON.stringify(templates));
            localStorage.setItem('selah_messages', JSON.stringify(messageHistory));
            
            renderDashboard();
            renderCalendar();
            renderPatients();
            renderTemplates();
            renderMessageHistory();
            populatePatientSelect();
            updateSettingsStats();
            
            if (currentUserRole === 'admin') {
                renderFinances();
            }
            
            showToast('Backup importado correctamente', 'success');
        } catch (error) {
            showToast('Error al importar backup', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function globalSearch(query) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;
    
    if (!query || query.length < 2) {
        resultsDiv.classList.remove('active');
        return;
    }
    
    const matches = patients.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.phone && p.phone.includes(query))
    );
    
    if (matches.length === 0) {
        resultsDiv.classList.remove('active');
        return;
    }
    
    resultsDiv.innerHTML = matches.slice(0, 5).map(p => `
        <div class="search-result-item" onclick="goToPatient('${p.id}')">
            <strong>${p.name}</strong><br>
            <small>${p.phone} - ${p.diagnosis || 'Sin diagnóstico'}</small>
        </div>
    `).join('');
    
    resultsDiv.classList.add('active');
}

function goToPatient(id) {
    document.getElementById('searchResults').classList.remove('active');
    document.getElementById('globalSearch').value = '';
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-section="patients"]').classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('patients').classList.add('active');
    
    editPatient(id);
}

document.addEventListener('click', function(e) {
    const searchResults = document.getElementById('searchResults');
    if (searchResults && !e.target.closest('.search-bar')) {
        searchResults.classList.remove('active');
    }
});

// ===== VERSION CONTROL FUNCTIONS =====

function initVersionControl() {
    // Display current version
    const versionEl = document.getElementById('currentVersion');
    const dateEl = document.getElementById('versionDate');
    
    if (versionEl) versionEl.textContent = APP_VERSION;
    if (dateEl) dateEl.textContent = formatVersionDate(APP_VERSION_DATE);
    
    // Render version history
    renderVersionHistory();
    
    // Check for updates after a short delay
    setTimeout(checkForUpdates, 2000);
}

function formatVersionDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function renderVersionHistory() {
    const container = document.getElementById('versionHistoryList');
    if (!container) return;
    
    container.innerHTML = VERSION_HISTORY.map((v, i) => `
        <div class="version-history-item ${i === 0 ? 'current' : ''}">
            <span class="vh-version">v${v.version}</span>
            <span class="vh-date">${formatVersionDate(v.date)}</span>
            <span class="vh-notes">${v.notes}</span>
        </div>
    `).join('');
}

async function checkForUpdates() {
    const statusDiv = document.getElementById('versionStatus');
    const statusIcon = statusDiv?.querySelector('.version-status-icon');
    const statusText = document.getElementById('versionStatusText');
    const updateBanner = document.getElementById('updateBanner');
    
    if (!statusDiv || !statusText) return;
    
    // Show checking state
    statusIcon.className = 'version-status-icon checking';
    statusIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;">
        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>`;
    statusText.textContent = 'Verificando actualizaciones...';
    
    try {
        // Check Supabase for latest version
        if (supabaseClient) {
            const { data, error } = await supabaseClient
                .from('app_versions')
                .select('*')
                .eq('is_stable', true)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (!error && data && data.length > 0) {
                const latestVersion = data[0];
                
                if (compareVersions(latestVersion.version, APP_VERSION) > 0) {
                    // Update available
                    showUpdateAvailable(latestVersion);
                    return;
                }
            }
        }
        
        // No update available or offline
        showUpToDate();
        
    } catch (err) {
        console.log('Version check failed:', err);
        showUpToDate(); // Assume up to date if check fails
    }
}

function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

function showUpToDate() {
    const statusIcon = document.querySelector('.version-status-icon');
    const statusText = document.getElementById('versionStatusText');
    const updateBanner = document.getElementById('updateBanner');
    
    if (statusIcon) {
        statusIcon.className = 'version-status-icon up-to-date';
        statusIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>`;
    }
    
    if (statusText) {
        statusText.textContent = 'Tu aplicación está actualizada';
    }
    
    if (updateBanner) {
        updateBanner.style.display = 'none';
    }
}

function showUpdateAvailable(versionData) {
    const statusIcon = document.querySelector('.version-status-icon');
    const statusText = document.getElementById('versionStatusText');
    const updateBanner = document.getElementById('updateBanner');
    const newVersionEl = document.getElementById('newVersion');
    const updateNotesEl = document.getElementById('updateNotes');
    
    if (statusIcon) {
        statusIcon.className = 'version-status-icon update-available';
        statusIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>`;
    }
    
    if (statusText) {
        statusText.textContent = `¡Nueva versión ${versionData.version} disponible!`;
    }
    
    if (updateBanner) {
        updateBanner.style.display = 'flex';
    }
    
    if (newVersionEl) {
        newVersionEl.textContent = versionData.version;
    }
    
    if (updateNotesEl) {
        updateNotesEl.textContent = versionData.notes || 'Mejoras y correcciones.';
    }
    
    // Store update info for later
    localStorage.setItem('selah_pending_update', JSON.stringify(versionData));
}

function applyUpdate() {
    // For PWA, this will reload and fetch the new cached version
    // The service worker should handle caching the new files
    
    showNotification('Actualizando aplicación...', 'info');
    
    // Clear caches and reload
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    }
    
    // Unregister and re-register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(reg => reg.unregister());
        });
    }
    
    // Reload after a short delay
    setTimeout(() => {
        window.location.reload(true);
    }, 1000);
}

// Developer function to publish new version (Admin only)
async function publishNewVersion(version, notes) {
    if (currentUserRole !== 'admin') {
        showNotification('Solo administradores pueden publicar versiones', 'error');
        return;
    }
    
    if (!supabaseClient) {
        showNotification('No hay conexión a la base de datos', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('app_versions')
            .insert([{
                version: version,
                notes: notes,
                is_stable: true,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        showNotification(`Versión ${version} publicada exitosamente`, 'success');
        return true;
    } catch (err) {
        showNotification('Error al publicar versión: ' + err.message, 'error');
        return false;
    }
}

// Initialize version control when app loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Supabase to be ready
    setTimeout(initVersionControl, 3000);
});
