import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { 
  ArrowLeft, 
  Phone, 
  Edit,
  MessageSquare,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { generateWhatsAppLink } from '../lib/whatsapp'
import ClinicalNotes from '../components/ClinicalNotes'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { patients, appointments, services, updatePatient, removePatient } = useStore()
  const [activeTab, setActiveTab] = useState('info')
  const [showEditModal, setShowEditModal] = useState(false)

  const patient = patients.find(p => p.id === id)

  useEffect(() => {
    if (!patient) {
      navigate('/pacientes')
    }
  }, [patient, navigate])

  const patientAppointments = useMemo(() => {
    return appointments
      .filter(a => a.patient_id === id)
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
  }, [appointments, id])

  const completedCount = patientAppointments.filter(a => a.status === 'completed').length

  if (!patient) return null

  const handleDelete = async () => {
    await removePatient(id)
    navigate('/pacientes')
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link to="/pacientes" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
          <p className="text-gray-500">Perfil del paciente</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={generateWhatsAppLink(patient.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            <MessageSquare size={18} />
            WhatsApp
          </a>
          <button 
            onClick={() => setShowEditModal(true)}
            className="btn btn-primary"
          >
            <Edit size={18} />
            Editar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
          <p className="text-sm text-gray-500">Sesiones completadas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{patientAppointments.length}</p>
          <p className="text-sm text-gray-500">Total de citas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {patientAppointments.length > 0 
              ? format(new Date(patientAppointments[0].start_time), 'MMM yyyy', { locale: es })
              : '-'}
          </p>
          <p className="text-sm text-gray-500">Última visita</p>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-100">
          <nav className="flex">
            {[
              { id: 'info', label: 'Información' },
              { id: 'appointments', label: 'Historial de Citas' },
              { id: 'notes', label: 'Notas Clínicas' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab.id 
                    ? 'text-primary-600 border-b-2 border-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Información de contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{patient.email}</p>
                      </div>
                    </div>
                  )}
                  {patient.dob && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                        <p className="font-medium">
                          {format(new Date(patient.dob), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {patient.medical_history && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Historial médico</h3>
                  <div className="space-y-3">
                    {patient.medical_history.allergies && (
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">Alergias</p>
                        <p className="text-gray-700">{patient.medical_history.allergies}</p>
                      </div>
                    )}
                    {patient.medical_history.surgeries && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Cirugías previas</p>
                        <p className="text-gray-700">{patient.medical_history.surgeries}</p>
                      </div>
                    )}
                    {!patient.medical_history.allergies && 
                     !patient.medical_history.surgeries && (
                      <p className="text-gray-500 text-sm">No hay historial médico registrado</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleDelete}
                  className="btn btn-danger w-full"
                >
                  <Trash2 size={18} />
                  Eliminar Paciente
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-4">
              {patientAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay citas registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientAppointments.map(apt => {
                    const service = services.find(s => s.id === apt.service_id)
                    return (
                      <div 
                        key={apt.id}
                        className="border border-gray-200 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {format(new Date(apt.start_time), "d 'de' MMMM 'de' yyyy", { locale: es })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(apt.start_time), 'HH:mm')} - 
                              {format(new Date(apt.end_time), 'HH:mm')}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {service?.name || 'Sesión general'}
                            </p>
                          </div>
                          <span className={`badge badge-${apt.status}`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <ClinicalNotes patientId={id} appointments={patientAppointments} />
          )}
        </div>
      </div>

      {showEditModal && (
        <EditPatientModal
          patient={patient}
          onClose={() => setShowEditModal(false)}
          onSave={async (data) => {
            await updatePatient(id, data)
            setShowEditModal(false)
          }}
        />
      )}
    </div>
  )
}

function EditPatientModal({ patient, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: patient.full_name,
    phone: patient.phone,
    email: patient.email || '',
    dob: patient.dob || '',
    notes: patient.notes || '',
    medical_history: {
      allergies: patient.medical_history?.allergies || '',
      surgeries: patient.medical_history?.surgeries || '',
      conditions: patient.medical_history?.conditions || '',
      medications: patient.medical_history?.medications || ''
    }
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSave(formData)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-900">Editar Paciente</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="form-label">Nombre completo</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Fecha de nacimiento</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Notas adicionales</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input"
                rows="3"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
