import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  Phone,
  X,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns'
import { es } from 'date-fns/locale'
import { generateWhatsAppLink } from '../lib/whatsapp'

export default function Appointments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showNewModal, setShowNewModal] = useState(searchParams.get('new') === 'true')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  
  const { 
    appointments, 
    patients, 
    services, 
    addAppointment,
    updateAppointment,
    profile 
  } = useStore()

  const calendarAppointments = useMemo(() => {
    return appointments
      .filter(a => a.status === 'scheduled')
      .reduce((acc, apt) => {
        const dateKey = format(new Date(apt.start_time), 'yyyy-MM-dd')
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(apt)
        return acc
      }, {})
  }, [appointments])

  const selectedDateAppointments = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return (calendarAppointments[dateKey] || []).sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time)
    )
  }, [selectedDate, calendarAppointments])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    
    const days = []
    let day = startDate
    
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    
    return days
  }, [currentMonth])

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500">Gestiona tu agenda de citas</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="btn btn-primary"
        >
          <Plus size={20} />
          Nueva Cita
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <button 
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div 
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayAppointments = calendarAppointments[dateKey] || []
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`
                  min-h-[80px] p-2 border-b border-r border-gray-100
                  text-left transition-colors hover:bg-gray-50
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                  ${isSelected ? 'bg-primary-50' : ''}
                `}
              >
                <span className={`
                  inline-flex items-center justify-center w-7 h-7 rounded-full text-sm
                  ${isTodayDate ? 'bg-primary-500 text-white font-semibold' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1">
                  {dayAppointments.slice(0, 2).map(apt => (
                    <div 
                      key={apt.id}
                      className="text-xs p-1 rounded truncate"
                      style={{ backgroundColor: apt.services?.color || '#0ea5e9', color: 'white' }}
                    >
                      {format(new Date(apt.start_time), 'HH:mm')} {apt.patients?.full_name?.split(' ')[0]}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayAppointments.length - 2} más
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
        </div>
        <div className="card-body">
          {selectedDateAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>No hay citas para este día</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="btn btn-primary mt-4"
              >
                <Plus size={20} />
                Agendar cita
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateAppointments.map(appointment => (
                <div 
                  key={appointment.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-primary-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-3 h-full min-h-[60px] rounded-full"
                        style={{ backgroundColor: appointment.services?.color || '#0ea5e9' }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.patients?.full_name}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Clock size={14} />
                          {format(new Date(appointment.start_time), 'HH:mm')} - 
                          {format(new Date(appointment.end_time), 'HH:mm')}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {appointment.services?.name || 'Sesión general'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(
                          generateWhatsAppLink(
                            appointment.patients?.phone,
                            `Hola ${appointment.patients?.full_name}, te contactamos de ${profile?.clinic_name || 'PhysioTrack'}`
                          ),
                          '_blank'
                        )}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare size={20} />
                      </button>
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <AppointmentModal
          patients={patients}
          services={services}
          selectedDate={selectedDate}
          onClose={() => {
            setShowNewModal(false)
            setSearchParams({})
          }}
          onSave={async (data) => {
            await addAppointment(data)
            setShowNewModal(false)
            setSearchParams({})
          }}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          profile={profile}
          onClose={() => setSelectedAppointment(null)}
          onStatusChange={async (status) => {
            await updateAppointment(selectedAppointment.id, { status })
            setSelectedAppointment(null)
          }}
        />
      )}
    </div>
  )
}

function AppointmentModal({ patients, services, selectedDate, onClose, onSave }) {
  const [formData, setFormData] = useState({
    patient_id: '',
    service_id: '',
    start_time: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.patient_id) {
      setError('Por favor selecciona un paciente')
      setLoading(false)
      return
    }

    if (!formData.service_id) {
      setError('Por favor selecciona un servicio')
      setLoading(false)
      return
    }

    await onSave(formData)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-900">Nueva Cita</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="modal-body">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="form-label">Paciente *</label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="form-input"
                >
                  <option value="">Seleccionar paciente...</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Servicio *</label>
                <select
                  value={formData.service_id}
                  onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                  className="form-input"
                >
                  <option value="">Seleccionar servicio...</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ${service.price} ({service.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Fecha y hora *</label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  rows="3"
                  placeholder="Notas adicionales para la cita..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Guardando...' : 'Crear Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AppointmentDetailModal({ appointment, profile, onClose, onStatusChange }) {
  const { patients, services } = appointment
  const patient = patients
  const service = services

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-900">Detalles de Cita</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="text-primary-600" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">{patient?.full_name}</h3>
              <a 
                href={`tel:${patient?.phone}`}
                className="text-sm text-gray-500 flex items-center gap-1 hover:text-primary-600"
              >
                <Phone size={14} />
                {patient?.phone}
              </a>
            </div>
            <a
              href={generateWhatsAppLink(patient?.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline text-sm"
            >
              <MessageSquare size={16} />
              WhatsApp
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium">
                {format(new Date(appointment.start_time), 'd MMM yyyy', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hora</p>
              <p className="font-medium">
                {format(new Date(appointment.start_time), 'HH:mm')} - 
                {format(new Date(appointment.end_time), 'HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Servicio</p>
              <p className="font-medium">{service?.name || 'Sesión general'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Precio</p>
              <p className="font-medium">${appointment.price_at_appointment || 0}</p>
            </div>
          </div>

          {appointment.notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Notas</p>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {appointment.notes}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className={`badge badge-${appointment.status}`}>
              {appointment.status}
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            onClick={() => onStatusChange('cancelled')}
            className="btn btn-danger flex items-center gap-2"
          >
            <XCircle size={18} />
            Cancelar
          </button>
          <button 
            onClick={() => onStatusChange('completed')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <CheckCircle size={18} />
            Completar
          </button>
        </div>
      </div>
    </div>
  )
}
