import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  CreditCard,
  Wifi,
  WifiOff
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();

  // Detectar estado de conexión a la red
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    // Suscribirse a los eventos de red
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/pacientes', icon: Users, label: 'Pacientes' },
    { path: '/citas', icon: Calendar, label: 'Citas' },
    { path: '/servicios', icon: FileText, label: 'Servicios' },
    { path: '/estadisticas', icon: TrendingUp, label: 'Estadísticas' },
    { path: '/pagos', icon: CreditCard, label: 'Pagos' },
    { path: '/configuracion', icon: Settings, label: 'Configuración' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo section */}
        <div className="flex flex-col items-center justify-center p-6 border-b border-gray-100">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3 bg-[#74A9C1] shadow-md flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="Selah Fisioterapia & Recovery" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span className="hidden text-white font-bold text-2xl" style={{ display: 'none' }}>S</span>
          </div>
          <h1 className="text-center font-bold text-gray-800 text-sm leading-tight">
            Selah Fisioterapia & Recovery
          </h1>
          <p className="text-xs text-gray-500 mt-1">Centro de Rehabilitación</p>
          
          {/* Online/Offline Status Indicator */}
          <div className={`
            mt-3 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium transition-colors
            ${isOnline 
              ? 'bg-green-100 text-green-700' 
              : 'bg-orange-100 text-orange-700'
            }
          `}>
            {isOnline ? (
              <>
                <Wifi size={14} />
                <span>En línea</span>
              </>
            ) : (
              <>
                <WifiOff size={14} />
                <span>Sin conexión</span>
              </>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#74A9C1] flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="Selah" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <span className="hidden text-white font-bold text-sm" style={{ display: 'none' }}>S</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user?.email || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">Fisioterapeuta</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                  ${active 
                    ? 'bg-teal-50 text-teal-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon size={20} className={active ? 'text-teal-600' : 'text-gray-400'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut size={20} className="text-gray-400" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">Selah</span>
            </div>
            
            {/* Status indicator for mobile */}
            <div className={`
              flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
              ${isOnline 
                ? 'bg-green-100 text-green-700' 
                : 'bg-orange-100 text-orange-700'
              }
            `}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="hidden sm:inline">{isOnline ? 'En línea' : 'Sin conexión'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile close button */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed top-4 right-4 z-40 p-2 rounded-full bg-white shadow-lg lg:hidden"
        >
          <X size={24} className="text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default Layout;
