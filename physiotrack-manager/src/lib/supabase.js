import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseHelpers = {
  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  createProfile: async (profileData) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    return { data, error }
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  getPatients: async (therapistId) => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  createPatient: async (patientData) => {
    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single()
    return { data, error }
  },

  updatePatient: async (patientId, updates) => {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', patientId)
      .select()
      .single()
    return { data, error }
  },

  deletePatient: async (patientId) => {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
    return { error }
  },

  getServices: async (therapistId) => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('is_active', true)
      .order('name')
    return { data, error }
  },

  createService: async (serviceData) => {
    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single()
    return { data, error }
  },

  updateService: async (serviceId, updates) => {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single()
    return { data, error }
  },

  deleteService: async (serviceId) => {
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', serviceId)
    return { error }
  },

  getAppointments: async (therapistId, startDate, endDate) => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (id, full_name, phone),
        services (id, name, duration_minutes, color)
      `)
      .eq('therapist_id', therapistId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time')
    return { data, error }
  },

  getAllAppointments: async (therapistId) => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (id, full_name, phone),
        services (id, name, duration_minutes, color)
      `)
      .eq('therapist_id', therapistId)
      .order('start_time', { ascending: false })
    return { data, error }
  },

  createAppointment: async (appointmentData) => {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        patients (id, full_name, phone),
        services (id, name, duration_minutes, color)
      `)
      .single()
    return { data, error }
  },

  updateAppointment: async (appointmentId, updates) => {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single()
    return { data, error }
  },

  deleteAppointment: async (appointmentId) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId)
    return { error }
  },

  getClinicalNotes: async (appointmentId) => {
    const { data, error } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single()
    return { data, error }
  },

  createClinicalNote: async (noteData) => {
    const { data, error } = await supabase
      .from('clinical_notes')
      .insert(noteData)
      .select()
      .single()
    return { data, error }
  },

  updateClinicalNote: async (noteId, updates) => {
    const { data, error } = await supabase
      .from('clinical_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single()
    return { data, error }
  },

  getStatistics: async (therapistId, startDate, endDate) => {
    const { data, error } = await supabase
      .from('appointments')
      .select('status, price_at_appointment, start_time')
      .eq('therapist_id', therapistId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
    return { data, error }
  },

  subscribeToAppointments: (therapistId, callback) => {
    return supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `therapist_id=eq.${therapistId}`
        },
        callback
      )
      .subscribe()
  }
}
