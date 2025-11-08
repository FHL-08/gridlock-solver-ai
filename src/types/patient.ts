export interface Patient {
  queue_id: string;
  patient_name: string;
  nhs_number: string;
  severity: number;
  status: 'Waiting (Remote)' | 'Ambulance Dispatched' | 'In Transit' | 'Awaiting Plan Approval' | 'Prep Ready' | 'Arrived';
  triage_notes: string;
  eta_minutes?: number;
  resource_plan?: {
    plan_text: string;
    entrance: string;
  };
  symptom_description?: string;
  video_filename?: string;
  ambulance_updates?: Array<{
    timestamp: string;
    text: string;
    video?: string;
  }>;
}

export interface MockPatientDB {
  nhs_number: string;
  name: string;
  dob: string;
  medical_history: string[];
}

export interface MockHospitalDB {
  hospital_id: string;
  name: string;
  current_capacity: number;
  max_capacity: number;
}
