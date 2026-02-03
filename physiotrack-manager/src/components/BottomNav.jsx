import { NavLink } from 'react-router-dom'
import { Home, Calendar, Users, Plus } from 'lucide-react'

export default function BottomNav() {
  if (window.innerWidth >= 768) {
    return null
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center py-2 px-4">
        <NavLink
          to="/"
          className={({ isActive }) => `
            flex flex-col items-center gap-1 px-4 py-2 rounded-lg
            transition-colors duration-200
            ${isActive ? 'text-primary-500' : 'text-gray-500'}
          `}
        >
          <Home size={24} />
          <span className="text-xs font-medium">Inicio</span>
        </NavLink>

        <NavLink
          to="/citas"
          className={({ isActive }) => `
            flex flex-col items-center gap-1 px-4 py-2 rounded-lg
            transition-colors duration-200
            ${isActive ? 'text-primary-500' : 'text-gray-500'}
          `}
        >
          <Calendar size={24} />
          <span className="text-xs font-medium">Citas</span>
        </NavLink>

        <NavLink
          to="/citas?new=true"
          className={`
            flex flex-col items-center gap-1 px-6 py-3 -mt-8
            bg-primary-500 text-white rounded-full shadow-lg
            transition-transform hover:scale-105
          `}
        >
          <Plus size={28} />
        </NavLink>

        <NavLink
          to="/pacientes"
          className={({ isActive }) => `
            flex flex-col items-center gap-1 px-4 py-2 rounded-lg
            transition-colors duration-200
            ${isActive ? 'text-primary-500' : 'text-gray-500'}
          `}
        >
          <Users size={24} />
          <span className="text-xs font-medium">Pacientes</span>
        </NavLink>

        <NavLink
          to="/servicios"
          className={({ isActive }) => `
            flex flex-col items-center gap-1 px-4 py-2 rounded-lg
            transition-colors duration-200
            ${isActive ? 'text-primary-500' : 'text-gray-500'}
          `}
        >
          <span className="text-xs font-medium">Serv.</span>
        </NavLink>
      </div>
    </nav>
  )
}
