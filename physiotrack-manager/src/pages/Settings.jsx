import React from 'react';
import { useStore } from '../stores/useStore';
import { User, Bell, Lock, Moon, Sun, Database, Download } from 'lucide-react';

const Settings = () => {
  const { user } = useStore();

  const settingSections = [
    {
      title: 'Cuenta',
      icon: User,
      settings: [
        { name: 'Perfil', description: 'Actualiza tu información personal', onClick: () => {} },
        { name: 'Seguridad', description: 'Cambia tu contraseña', onClick: () => {} },
      ]
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      settings: [
        { name: 'Recordatorios', description: 'Configura recordatorios de citas', onClick: () => {} },
        { name: 'WhatsApp', description: 'Notificaciones automáticas por WhatsApp', onClick: () => {} },
      ]
    },
    {
      title: 'Datos',
      icon: Database,
      settings: [
        { name: 'Respaldo', description: 'Guarda tus datos', onClick: () => {} },
        { name: 'Exportar', description: 'Exporta tus datos a Excel', onClick: () => {} },
      ]
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuración</h1>

      {/* User info card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-teal-600">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Tu Cuenta</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="space-y-6">
        {settingSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                <Icon size={20} className="text-teal-600" />
                <h2 className="font-semibold text-gray-800">{section.title}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {section.settings.map((setting) => (
                  <button
                    key={setting.name}
                    onClick={setting.onClick}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-teal-600 transition-colors">
                        {setting.name}
                      </p>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-teal-600 transition-colors">›</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* App info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">PhysioTrack Manager v1.0</p>
        <p className="text-xs text-gray-300 mt-1">© 2025 Selah Fisioterapia & Recovery</p>
      </div>
    </div>
  );
};

export default Settings;
