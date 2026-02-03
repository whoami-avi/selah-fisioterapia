import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react'
import { 
 
  Area,  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Dashboard() {
  const { appointments, patients, services, profile } = useStore()

  const stats = useMemo(() => {
    const today = new Date()
    const todayAppointments = appointments.filter(a => 
      isToday(new Date(a.start_time)) && a.status === 'scheduled'
    )
    
    const completedThisMonth = appointments.filter(a => {
      const date = new Date(a.start_time)
      return date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear() &&
             a.status === 'completed'
    })
    
    const totalRevenue = completedThisMonth.reduce((sum, a) => 
      sum + (a.price_at_appointment || 0), 0
    )

    return {
      todayCount: todayAppointments.length,
      weekCount: appointments.filter(a => {
        const date = new Date(a.start_time)
        const weekStart = startOfWeek(today)
        const weekEnd = endOfWeek(today)
        return date >= weekStart && date <= weekEnd && a.status === 'scheduled'
      }).length,
      totalPatients: patients.length,
      monthlyRevenue: totalRevenue,
      completedThisMonth: completedThisMonth.length
    }
  }, [appointments, patients])

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(new Date(), -6 + i)
      const dayAppointments = appointments.filter(a => {
        const appDate = new Date(a.start_time)
        return appDate.toDateString() === date.toDateString() && a.status === 'completed'
      })
      const revenue = dayAppointments.reduce((sum, a) => sum + (a.price_at_appointment || 0), 0)
      
      return {
        date: format(date, 'EEE', { locale: es }),
        appointments: dayAppointments.length,
        revenue
      }
    })
    return last7Days
  }, [appointments])

  const todayAppointments = useMemo(() => {
    return appointments
      .filter(a => isToday(new Date(a.start_time)) && a.status === 'scheduled')
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 5)
  }, [appointments])

  const upcomingAppointments = useMemo(() => {
    const tomorrow = addDays(new Date(), 1)
    return appointments
      .filter(a => {
        const date = new Date(a.start_time)
        return date > new Date() && 
               date.getDate() >= tomorrow.getDate() && 
               a.status === 'scheduled'
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 5)
  }, [appointments])

  const getAppointmentTimeLabel = (date) => {
    const d = new Date(date)
    if (isToday(d)) return 'Hoy'
    if (isTomorrow(d)) return 'Mañana'
    return format(d, "d MMM", { locale: es })
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, {profile?.full_name?.split(' ')[0] || 'Fisio'}!
          </h1>
          <p className="text-gray-500">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <Link to="/citas?new=true" className="btn btn-primary">
          <Plus size={20} />
          Nueva Cita
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
              <p className="text-sm text-gray-500">Hoy</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.weekCount}</p>
              <p className="text-sm text-gray-500">Esta semana</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              <p className="text-sm text-gray-500">Pacientes</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Este mes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad de la semana</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                fill="#d1fae5" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Citas de hoy</h2>
            <Link to="/citas" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock size={48} className="mx-auto mb-3 opacity-50" />
                <p>No hay citas programadas para hoy</p>
                <Link to="/citas?new=true" className="btn btn-primary mt-4">
                  Agendar cita
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map(appointment => (
                  <div 
                    key={appointment.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Clock className="text-primary-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {appointment.patients?.full_name || 'Paciente'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(appointment.start_time), 'HH:mm')} - 
                        {appointment.services?.name || 'Sesión'}
                      </p>
                    </div>
                    <Link 
                      to={`/pacientes/${appointment.patient_id}`}
                      className="btn btn-outline text-sm py-2"
                    >
                      Ver
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Próximas citas</h2>
            <Link to="/citas" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              Ver calendario <ArrowRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                <p>No hay citas próximas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map(appointment => (
                  <div 
                    key={appointment.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                      <Calendar className="text-secondary-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {appointment.patients?.full_name || 'Paciente'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getAppointmentTimeLabel(appointment.start_time)} - 
                        {format(new Date(appointment.start_time), 'HH:mm')}
                      </p>
                    </div>
                    <span className={`badge badge-${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
