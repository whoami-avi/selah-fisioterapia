-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- Profiles table (links to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  license_number TEXT,
  clinic_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  dob DATE,
  medical_history JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table (treatments offered)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10, 2) NOT NULL,
  color TEXT DEFAULT '#0ea5e9',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  price_at_appointment DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical notes table (SOAP format)
CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS/WhatsApp logs
CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_patients_therapist ON patients(therapist_id);
CREATE INDEX idx_services_therapist ON services(therapist_id);
CREATE INDEX idx_appointments_therapist ON appointments(therapist_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_clinical_notes_appointment ON clinical_notes(appointment_id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Patients policies
CREATE POLICY "Therapists can view their own patients" ON patients
  FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "Therapists can insert their own patients" ON patients
  FOR INSERT WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Therapists can update their own patients" ON patients
  FOR UPDATE USING (therapist_id = auth.uid());

CREATE POLICY "Therapists can delete their own patients" ON patients
  FOR DELETE USING (therapist_id = auth.uid());

-- Services policies
CREATE POLICY "Therapists can view their own services" ON services
  FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "Therapists can insert their own services" ON services
  FOR INSERT WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Therapists can update their own services" ON services
  FOR UPDATE USING (therapist_id = auth.uid());

CREATE POLICY "Therapists can delete their own services" ON services
  FOR DELETE USING (therapist_id = auth.uid());

-- Appointments policies
CREATE POLICY "Therapists can view their own appointments" ON appointments
  FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "Therapists can insert their own appointments" ON appointments
  FOR INSERT WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Therapists can update their own appointments" ON appointments
  FOR UPDATE USING (therapist_id = auth.uid());

CREATE POLICY "Therapists can delete their own appointments" ON appointments
  FOR DELETE USING (therapist_id = auth.uid());

-- Clinical notes policies
CREATE POLICY "Therapists can view clinical notes" ON clinical_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = clinical_notes.appointment_id
      AND appointments.therapist_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can insert clinical notes" ON clinical_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = clinical_notes.appointment_id
      AND appointments.therapist_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can update clinical notes" ON clinical_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = clinical_notes.appointment_id
      AND appointments.therapist_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
