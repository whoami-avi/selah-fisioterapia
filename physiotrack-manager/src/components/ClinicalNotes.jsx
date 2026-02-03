import { useState } from 'react'
import { supabaseHelpers } from '../lib/supabase'
import { 
  FileText, 
  ChevronDown,
  ChevronUp,
  Save
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ClinicalNotes({ patientId, appointments }) {
  const { profile } = useStore()
  const [expandedAppointment, setExpandedAppointment] = useState(null)
  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(null)

  const appointmentsWithNotes = appointments.filter(
    a => a.status === 'completed' || a.status === 'scheduled'
  )

  const loadNotes = async (appointmentId) => {
    const { data } = await supabaseHelpers.getClinicalNotes(appointmentId)
    if (data) {
      setNotes(prev => ({
        ...prev,
        [appointmentId]: data
      }))
    }
    return data
  }

  const handleExpand = async (appointmentId) => {
    if (expandedAppointment === appointmentId) {
      setExpandedAppointment(null)
    } else {
      setExpandedAppointment(appointmentId)
      if (!notes[appointmentId]) {
        await loadNotes(appointmentId)
      }
    }
  }

  const handleSaveNotes = async (appointmentId) => {
    setSaving(appointmentId)
    const noteData = notes[appointmentId]
    
    if (noteData?.id) {
      await supabaseHelpers.updateClinicalNote(noteData.id, noteData)
    } else {
      await supabaseHelpers.createClinicalNote({
        appointment_id: appointmentId,
        subjective: noteData?.subjective || '',
        objective: noteData?.objective || '',
        assessment: noteData?.assessment || '',
        plan: noteData?.plan || ''
      })
    }
    
    await loadNotes(appointmentId)
    setSaving(null)
  }

  const updateNote = (appointmentId, field, value) => {
    setNotes(prev => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        [field]: value
      }
    }))
  }

  return (
    <div className="space-y-4">
      {appointmentsWithNotes.length === 0 ? (
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No hay citas para agregar notas</p>
        </div>
      ) : (
        appointmentsWithNotes.map(appointment => (
          <div 
            key={appointment.id}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => handleExpand(appointment.id)}
              className="w-full p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-primary-600" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {format(new Date(appointment.start_time), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(appointment.start_time), 'HH:mm')} - 
                    {appointment.services?.name || 'Sesión general'}
                  </p>
                </div>
              </div>
              {expandedAppointment === appointment.id ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </button>

            {expandedAppointment === appointment.id && (
              <div className="p-4 space-y-4 animate-fade-in">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      S - Subjetivo (Lo que refiere el paciente)
                    </label>
                    <textarea
                      value={notes[appointment.id]?.subjective || ''}
                      onChange={(e) => updateNote(appointment.id, 'subjective', e.target.value)}
                      className="form-input"
                      rows="4"
                      placeholder="Dolores, síntomas, limitaciones que refiere el paciente..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      O - Objetivo (Evaluación física)
                    </label>
                    <textarea
                      value={notes[appointment.id]?.objective || ''}
                      onChange={(e) => updateNote(appointment.id, 'objective', e.target.value)}
                      className="form-input"
                      rows="4"
                      placeholder="Hallazgos clínicos, rangos de movimiento, fuerza muscular..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      A - Análisis (Evaluación/Diagnóstico)
                    </label>
                    <textarea
                      value={notes[appointment.id]?.assessment || ''}
                      onChange={(e) => updateNote(appointment.id, 'assessment', e.target.value)}
                      className="form-input"
                      rows="4"
                      placeholder="Interpretación de hallazgos, diagnóstico funcional..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      P - Plan (Tratamiento/Ejercicios)
                    </label>
                    <textarea
                      value={notes[appointment.id]?.plan || ''}
                      onChange={(e) => updateNote(appointment.id, 'plan', e.target.value)}
                      className="form-input"
                      rows="4"
                      placeholder="Técnicas aplicadas, ejercicios recomendados, medidas preventivas..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleSaveNotes(appointment.id)}
                    disabled={saving === appointment.id}
                    className="btn btn-primary"
                  >
                    {saving === appointment.id ? (
                      <>
                        <span className="animate-pulse">Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Guardar Notas
                      </>
                    )}
                  </button>
                </div>

                {notes[appointment.id]?.id && (
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Última actualización: {
                      format(new Date(notes[appointment.id].updated_at), 
                      "d MMM yyyy HH:mm", { locale: es })
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
