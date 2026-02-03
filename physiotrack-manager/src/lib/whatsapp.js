export const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2)
  }
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+52' + cleaned
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned
    } else {
      cleaned = '+' + cleaned
    }
  }
  
  return cleaned
}

export const generateWhatsAppLink = (phone, message = '') => {
  const formattedPhone = formatPhoneNumber(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`
}

export const messageTemplates = {
  reminder24h: (patientName, therapistName, dateTime, serviceName = 'tu sesión') => {
    const formattedDate = new Date(dateTime).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return `Hola ${patientName}, te recordamos tu cita de fisioterapia mañana a las ${new Date(dateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} con ${therapistName}. ${serviceName}. Por favor llega 5 minutos antes. Si necesitas reprogramar, responde a este mensaje.`
  },

  reminder2h: (patientName, therapistName, time) => {
    return `Hola ${patientName}, te recordamos que tu cita de fisioterapia es en 2 horas (${time}). Te esperamos!`
  },

  confirmation: (patientName, therapistName, dateTime, serviceName) => {
    const formattedDate = new Date(dateTime).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return `Hola ${patientName}, tu cita ha sido confirmada para el ${formattedDate} con ${therapistName}. ${serviceName}. Te esperamos!`
  },

  cancellation: (patientName, dateTime) => {
    const formattedDate = new Date(dateTime).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
    
    return `Hola ${patientName}, tu cita programada para el ${formattedDate} ha sido cancelada. Si deseas reprogramar, contáctanos.`
  },

  followUp: (patientName, therapistName, daysSinceLastVisit) => {
    return `Hola ${patientName}, han pasado ${daysSinceLastVisit} días desde tu última sesión con ${therapistName}. ¿Cómo te sientes? ¿Te gustaría agendar tu próxima cita?`
  }
}

export const isValidPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

export const getCountryFromPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  
  const countryCodes = {
    '52': 'México',
    '1': 'Estados Unidos/Canadá',
    '34': 'España',
    '54': 'Argentina',
    '55': 'Brasil',
    '56': 'Chile',
    '57': 'Colombia',
    '51': 'Perú',
    '593': 'Ecuador',
    '502': 'Guatemala',
    '503': 'El Salvador',
    '504': 'Honduras',
    '505': 'Nicaragua',
    '506': 'Costa Rica',
    '507': 'Panamá',
    '595': 'Paraguay',
    '598': 'Uruguay'
  }
  
  for (const [code, country] of Object.entries(countryCodes)) {
    if (cleaned.startsWith(code) || phone.startsWith('+' + code)) {
      return country
    }
  }
  
  return 'Desconocido'
}
