import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { 
  Search, 
  Plus, 
  Phone, 
  X,
  MessageSquare
} from 'lucide-react'
import { generateWhatsAppLink } from '../lib/whatsapp'

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  
  const { patients, addPatient, removePatient } = useStore()

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients
    const term = searchTerm.toLowerCase()
    return patients.filter(p => 
      p.full_name.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.email?.toLowerCase().includes(term)
    )
  }, [patients, searchTerm])

  const handleDelete = async (patientId) => {
    if (window.confirm('¿Estás seguro de eliminar este paciente? Esta acción no se puede deshacer.')) {
      await removePatient(patientId)
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500">Gestiona tu lista de pacientes</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="btn btn-primary"
        >
          <Plus size={20} />
          Nuevo Paciente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar pacientes por nombre, teléfono o email..."
          className="form-input pl-10 pr-4"
        />
      </div>

      <div className="card p-4">
        <p className="text-sm text-gray-500">
          Total de pacientes: <span className="font-semibold text-gray-900">{filteredPatients.length}</span>
        </p>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron pacientes' : 'Aún no hay pacientes'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza agregando tu primer paciente'}
          </p>
          {!searchTerm && (
            <button 
              onClick={() => setShowNewModal(true)}
              className="btn btn-primary"
            >
              <Plus size={20} />
              Agregar Paciente
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <div 
              key={patient.id}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold text-lg">
                    {patient.full_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {patient.full_name}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Phone size={14} />
                    {patient.phone}
                  </p>
                  {patient.email && (
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {patient.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <a
                  href={generateWhatsAppLink(patient.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline flex-1 text-sm py-2"
                >
                  <MessageSquare size={16} />
                  WhatsApp
                </a>
                <Link
                  to={`/pacientes/${patient.id}`}
                  className="btn btn-primary flex-1 text-sm py-2"
                >
                  Ver perfil
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewModal && (
        <PatientFormModal
          onClose={() => {
            setShowNewModal(false)
          }}
          onSave={async (data) => {
            try {
              const result = await addPatient(data)
              if (result?.success) {
                setShowNewModal(false)
              } else if (result?.error) {
                setError(result.error)
              }
            } catch (err) {
              setError('Error al guardar el paciente. Por favor, inténtalo de nuevo.')
            } finally {
              setLoading(false)
            }
          }}
        />
      )}
    </div>
  )
}

function PatientFormModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    dob: '',
    notes: '',
    medical_history: {
      allergies: '',
      surgeries: '',
      conditions: '',
      medications: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.full_name.trim()) {
      setError('Por favor ingresa el nombre del paciente')
      setLoading(false)
      return
    }

    if (!formData.phone.trim()) {
      setError('Por favor ingresa el número de teléfono')
      setLoading(false)
      return
    }

    await onSave(formData)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-900">Nuevo Paciente</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="form-label">Nombre completo *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="form-input"
                placeholder="Juan Pérez García"
              />
            </div>

            <div>
              <label className="form-label">Teléfono (WhatsApp) *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
                placeholder="5512345678"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: 10 dígitos (se agregará código de país automáticamente)
              </p>
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                placeholder="juan@email.com"
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

            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">Historial Médico (opcional)</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="form-label text-sm">Alergias</label>
                  <input
                    type="text"
                    value={formData.medical_history.allergies}
                    onChange={(e) => setFormData({
                      ...formData, 
                      medical_history: { ...formData.medical_history, allergies: e.target.value }
                    })}
                    className="form-input text-sm"
                    placeholder="Ninguna"
                  />
                </div>

                <div>
                  <label className="form-label text-sm">Cirugías previas</label>
                  <input
                    type="text"
                    value={formData.medical_history.surgeries}
                    onChange={(e) => setFormData({
                      ...formData, 
                      medical_history: { ...formData.medical_history, surgeries: e.target.value }
                    })}
                    className="form-input text-sm"
                    placeholder="Ninguna"
                  />
                </div>

                <div>
                  <label className="form-label text-sm">Condiciones médicas</label>
                  <input
                    type="text"
                    value={formData.medical_history.conditions}
                    onChange={(e) => setFormData({
                      ...formData, 
                      medical_history: { ...formData.medical_history, conditions: e.target.value }
                    })}
                    className="form-input text-sm"
                    placeholder="Ninguna"
                  />
                </div>

                <div>
                  <label className="form-label text-sm">Medicamentos actuales</label>
                  <input
                    type="text"
                    value={formData.medical_history.medications}
                    onChange={(e) => setFormData({
                      ...formData, 
                      medical_history: { ...formData.medical_history, medications: e.target.value }
                    })}
                    className="form-input text-sm"
                    placeholder="Ninguno"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Notas adicionales</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input"
                rows="3"
                placeholder="Notas generales sobre el paciente..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Guardando...' : 'Guardar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
