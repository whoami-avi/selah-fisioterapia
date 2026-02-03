import { useState } from 'react'
import { useStore } from '../stores/useStore'
import { 
  Plus, 
  X, 
  Edit, 
  Trash2,
  Clock,
  DollarSign
} from 'lucide-react'

export default function Services() {
  const { services, addService, updateService, deleteService } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)

  const colors = [
    '#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', 
    '#ef4444', '#ec4899', '#06b6d4', '#84cc16'
  ]

  const handleSave = async (data) => {
    if (editingService) {
      await updateService(editingService.id, data)
    } else {
      await addService(data)
    }
    setShowModal(false)
    setEditingService(null)
  }

  const handleDelete = async (serviceId) => {
    if (window.confirm('¿Estás seguro de eliminar este servicio?')) {
      await deleteService(serviceId)
    }
  }

  const openEditModal = (service) => {
    setEditingService(service)
    setShowModal(true)
  }

  const closeModal = () => {
    setEditingService(null)
    setShowModal(false)
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-500">Catálogo de tratamientos y precios</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus size={20} />
          Nuevo Servicio
        </button>
      </div>

      {services.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay servicios definidos</h3>
          <p className="text-gray-500 mb-4">Agrega los servicios que ofreces en tu consultorio</p>
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Agregar Servicio
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => (
            <div 
              key={service.id}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: service.color || '#0ea5e9' }}
                  >
                    <Clock className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock size={14} />
                  <span>{service.duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                  <DollarSign size={14} />
                  <span>${service.price}</span>
                </div>
                <div 
                  className="w-6 h-6 rounded-full ml-auto"
                  style={{ backgroundColor: service.color || '#0ea5e9' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ServiceModal
          service={editingService}
          colors={colors}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function ServiceModal({ service, colors, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    duration_minutes: service?.duration_minutes || 60,
    price: service?.price || 0,
    color: service?.color || '#0ea5e9'
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
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-900">
            {service ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="form-label">Nombre del servicio</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                placeholder="Ej: Masaje Relajante"
              />
            </div>

            <div>
              <label className="form-label">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-input"
                rows="2"
                placeholder="Descripción breve del servicio..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Duración (minutos)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="form-input"
                  min="15"
                  max="180"
                  step="15"
                />
              </div>

              <div>
                <label className="form-label">Precio ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`
                      w-10 h-10 rounded-lg transition-transform
                      ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
