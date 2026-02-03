import { create } from 'zustand'
import { supabaseHelpers } from '../lib/supabase'

export const useStore = create((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  patients: [],
  services: [],
  appointments: [],
  selectedDate: new Date(),
  
  sidebarOpen: true,
  currentPage: 'dashboard',
  
  initialize: async () => {
    const { session, error } = await supabaseHelpers.getSession()
    
    if (session) {
      const { user } = await supabaseHelpers.getUser()
      const { data: profile } = await supabaseHelpers.getProfile(user.id)
      
      set({ 
        user, 
        profile, 
        isAuthenticated: true,
        isLoading: false 
      })
      
      await get().loadData()
    } else {
      set({ isLoading: false })
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabaseHelpers.signIn(email, password)
    
    if (!error && data.session) {
      const { user } = await supabaseHelpers.getUser()
      const { data: profile } = await supabaseHelpers.getProfile(user.id)
      
      set({ 
        user, 
        profile, 
        isAuthenticated: true 
      })
      
      await get().loadData()
      return { success: true }
    }
    
    return { success: false, error: error?.message }
  },

  register: async (email, password, fullName) => {
    const { data, error } = await supabaseHelpers.signUp(email, password, fullName)
    
    if (!error && data.user) {
      const { data: profile } = await supabaseHelpers.createProfile({
        id: data.user.id,
        full_name: fullName
      })
      
      set({ 
        user: data.user, 
        profile,
        isAuthenticated: true 
      })
      
      return { success: true }
    }
    
    return { success: false, error: error?.message }
  },

  logout: async () => {
    await supabaseHelpers.signOut()
    set({ 
      user: null, 
      profile: null, 
      isAuthenticated: false,
      patients: [],
      services: [],
      appointments: []
    })
  },

  loadData: async () => {
    const { profile } = get()
    if (!profile) return
    
    const [patientsRes, servicesRes, appointmentsRes] = await Promise.all([
      supabaseHelpers.getPatients(profile.id),
      supabaseHelpers.getServices(profile.id),
      supabaseHelpers.getAllAppointments(profile.id)
    ])
    
    if (patientsRes.data) set({ patients: patientsRes.data })
    if (servicesRes.data) set({ services: servicesRes.data })
    if (appointmentsRes.data) set({ appointments: appointmentsRes.data })
  },

  addPatient: async (patientData) => {
    const { profile } = get()
    const { data, error } = await supabaseHelpers.createPatient({
      ...patientData,
      therapist_id: profile.id
    })
    
    if (!error) {
      set(state => ({ patients: [data, ...state.patients] }))
      return { success: true }
    }
    
    return { success: false, error: error.message }
  },

  updatePatient: async (patientId, updates) => {
    const { data, error } = await supabaseHelpers.updatePatient(patientId, updates)
    
    if (!error) {
      set(state => ({
        patients: state.patients.map(p => 
          p.id === patientId ? { ...p, ...updates } : p
        )
      }))
      return { success: true }
    }
    
    return { success: false, error: error.message }
  },

  removePatient: async (patientId) => {
    const { error } = await supabaseHelpers.deletePatient(patientId)
    
    if (!error) {
      set(state => ({
        patients: state.patients.filter(p => p.id !== patientId)
      }))
      return { success: true }
    }
    
    return { success: false, error: error.message }
  },

  addService: async (serviceData) => {
    const { profile } = get()
    const { data, error } = await supabaseHelpers.createService({
      ...serviceData,
      therapist_id: profile.id
    })
    
    if (!error) {
      set(state => ({ services: [...state.services, data] }))
      return { success: true }
    }
    
    return { success: false, error: error.message }
  },

  updateService: async (serviceId, updates) => {
    const { data, error } = await supabaseHelpers.updateService(serviceId, updates)
    
    if (!error) {
      set(state => ({
        services: state.services.map(s => 
          s.id === serviceId ? { ...s, ...updates } : s
        )
      }))
      return { success: true }
    }
    
    return { success: false, error: error.message }
  },

  deleteService: async (serviceId) => {
    const { error } = await supabaseHelpers.deleteService(serviceId)
    
    if (!error) {
      set(state => ({
        services: state.services.filter(s => s.id !== serviceId)
      }))
      return { success: true }
    }
    
    return { success: false, error: error.message }
  },

  addAppointment: async (appointmentData) => {
    const { profile, services } = get()
    
    const service = services.find(s => s.id === appointmentData.service_id)
    const duration = service?.duration_minutes || 60
    const endTime = new Date(new Date(appointmentData.start_time).getTime() + duration * 60000)
    
    const { data, error } = await supabaseHelpers.createAppointment({
      ...appointmentData,
      therapist_id: profile.id,
      end_time: endTime.toISOString(),
      price_at_appointment: service?.price || 0
    })
    
    if (!error) {
      set(state => ({
        appointments: [...state.appointments, data].sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        )
      }))
      return { success: true, data }
    }
    
    return { success: false, error: error.message }
  },

  updateAppointment: async (appointmentId, updates) => {
    const { data, error } = await supabaseHelpers.updateAppointment(appointmentId, updates)
    
    if (!error) {
      set(state => ({
        appointments: state.appointments.map(a => 
          a.id === appointmentId ? { ...a, ...updates } : a
        )
      }))
      return { success: true }
    }
    
    return { success: false, error: error.message }
  },

  cancelAppointment: async (appointmentId) => {
    return get().updateAppointment(appointmentId, { status: 'cancelled' })
  },

  completeAppointment: async (appointmentId) => {
    return get().updateAppointment(appointmentId, { status: 'completed' })
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen }))
}))
