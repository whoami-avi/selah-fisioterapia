import { useState } from 'react'
import { useStore } from '../stores/useStore'
import { 
  User, 
  Phone, 
  Mail, 
  Building,
  Award,
  Save,
  Camera
} from 'lucide-react'

export default function Profile() {
  const { profile, updateProfile } = useStore()
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    clinic_name: profile?.clinic_name || '',
    phone: profile?.phone || '',
    license_number: profile?.license_number || ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const { error } = await updateProfile(profile.id, formData)
    
    if (error) {
      setMessage({ type: 'error', text: 'Error al guardar los cambios' })
    } else {
      setMessage({ type: 'success', text: 'Cambios guardados correctamente' })
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-500">Gestiona tu información personal</p>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-3xl">
                  {profile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors">
                <Camera size={14} />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile?.full_name || 'Usuario'}
              </h2>
              <p className="text-gray-500">{profile?.clinic_name || 'Consultorio'}</p>
              {profile?.license_number && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                  <Award size={14} />
                  Cédula: {profile.license_number}
                </p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message.text && (
            <div className={`
              px-4 py-3 rounded-lg text-sm
              ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}
            `}>
              {message.text}
            </div>
          )}

          <div>
            <label className="form-label">Nombre completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="form-input pl-10"
                placeholder="Dr. Juan Pérez"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Nombre del consultorio</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                className="form-input pl-10"
                placeholder="Centro de Fisioterapia Pérez"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Número de cédula profesional</label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="form-input pl-10"
                placeholder="12345678"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Teléfono de contacto</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input pl-10"
                placeholder="5512345678"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            {loading ? 'Guardando...' : (
              <>
                <Save size={20} />
                Guardar cambios
              </>
            )}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Información de la cuenta</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile?.email || 'No configurado'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Configuración de WhatsApp</h3>
        <div className="bg-blue-50 p-4 rounded-xl mb-4">
          <p className="text-sm text-blue-700">
            Los recordatorios automáticos de citas se enviarán desde tu número de WhatsApp Business.
            Asegúrate de tener tu número configurado en la cuenta de Twilio.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Para configurar el envío automático de recordatorios, necesitas:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Una cuenta de Twilio</li>
            <li>Un número de WhatsApp Business</li>
            <li>Credenciales de API configuradas en el backend</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
