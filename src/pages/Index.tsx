import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientView } from '@/components/PatientView';
import { AmbulanceView } from '@/components/AmbulanceView';
import { FirstResponderView } from '@/components/FirstResponderView';
import { HospitalOpsView } from '@/components/HospitalOpsView';
import { ClinicianView } from '@/components/ClinicianView';
import { HospitalPrepView } from '@/components/HospitalPrepView';
import { Patient } from '@/types/patient';
import { Activity } from 'lucide-react';

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    console.log('=== ER-Flow System Initialized ===');
    console.log('[System]: Multi-agent healthcare optimization platform active');
    console.log('[System]: Agents: TriageAgent, EMSAgent, OpsAgent, ClinicianAgent');
  }, []);

  // Auto-update patient status based on progress
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => 
        prev.map(patient => {
          // Skip if no dispatch time or already in operation
          if (!patient.dispatch_time || patient.status === 'In Operation Theatre' || patient.status === 'Moving to Operation Theatre') {
            return patient;
          }

          const elapsed = Date.now() - patient.dispatch_time;
          const totalDuration = (patient.eta_minutes || 0) * 60 * 1000;
          const progress = (elapsed / totalDuration) * 100;

          // Transition from In Transit/Prep Ready to Arrived when 100%
          if (progress >= 100 && (patient.status === 'In Transit' || patient.status === 'Prep Ready')) {
            console.log(`[System]: Patient ${patient.patient_name} has ARRIVED`);
            return { ...patient, status: 'Arrived' as const, eta_minutes: 0 };
          }

          return patient;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-transition from Arrived to Moving to Operation Theatre
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => 
        prev.map(patient => {
          if (patient.status === 'Arrived') {
            console.log(`[System]: Patient ${patient.patient_name} is moving to operation theatre`);
            return { ...patient, status: 'Moving to Operation Theatre' as const };
          }
          return patient;
        })
      );
    }, 5000); // Wait 5 seconds after arrival

    return () => clearInterval(interval);
  }, []);

  // Auto-transition from Ambulance Dispatched to Prep Ready
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => 
        prev.map(patient => {
          if (patient.status === 'Ambulance Dispatched' && patient.resource_plan) {
            console.log(`[System]: Hospital preparation ready for ${patient.patient_name}`);
            return { ...patient, status: 'Prep Ready' as const };
          }
          return patient;
        })
      );
    }, 3000); // Wait 3 seconds for preparation

    return () => clearInterval(interval);
  }, []);

  // Auto-transition from Prep Ready to In Transit
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => 
        prev.map(patient => {
          if (patient.status === 'Prep Ready' && patient.dispatch_time) {
            console.log(`[System]: Ambulance with ${patient.patient_name} is now in transit`);
            return { ...patient, status: 'In Transit' as const };
          }
          return patient;
        })
      );
    }, 2000); // Wait 2 seconds before in transit

    return () => clearInterval(interval);
  }, []);

  // Auto-transition from Moving to Operation Theatre to In Operation Theatre
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => 
        prev.map(patient => {
          if (patient.status === 'Moving to Operation Theatre') {
            console.log(`[System]: Patient ${patient.patient_name} is now in operation theatre`);
            return { ...patient, status: 'In Operation Theatre' as const };
          }
          return patient;
        })
      );
    }, 8000); // Wait 8 seconds before entering operation theatre

    return () => clearInterval(interval);
  }, []);

  const handlePatientRegistered = (patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.queue_id === updatedPatient.queue_id) {
          // Set dispatch time when ambulance is dispatched
          if (updatedPatient.status === 'Ambulance Dispatched' && !updatedPatient.dispatch_time) {
            return { ...updatedPatient, dispatch_time: Date.now() };
          }
          return updatedPatient;
        }
        return p;
      })
    );
  };

  const handleApprovePlan = (patient: Patient) => {
    const approvedPatient: Patient = {
      ...patient,
      status: 'Prep Ready'
    };

    setPatients(prev =>
      prev.map(p => p.queue_id === approvedPatient.queue_id ? approvedPatient : p)
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">ER-Flow Command Center</h1>
              <p className="text-sm text-muted-foreground">Agentic AI for Emergency Care Optimization</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="patient" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="patient">Patient View</TabsTrigger>
            <TabsTrigger value="firstresponder">First Responder</TabsTrigger>
            <TabsTrigger value="ambulance">Ambulance</TabsTrigger>
            <TabsTrigger value="hospital">Hospital Ops</TabsTrigger>
            <TabsTrigger value="preparation">Preparation</TabsTrigger>
            <TabsTrigger value="clinician">Clinician</TabsTrigger>
          </TabsList>

          <TabsContent value="patient" className="space-y-4">
            <PatientView 
              onPatientRegistered={handlePatientRegistered}
              currentQueueLength={patients.length}
            />
          </TabsContent>

          <TabsContent value="firstresponder" className="space-y-4">
            <FirstResponderView patients={patients} />
          </TabsContent>

          <TabsContent value="ambulance" className="space-y-4">
            <AmbulanceView 
              patients={patients}
              onUpdatePatient={handleUpdatePatient}
            />
          </TabsContent>

          <TabsContent value="hospital" className="space-y-4">
            <HospitalOpsView patients={patients} />
          </TabsContent>

          <TabsContent value="preparation" className="space-y-4">
            <HospitalPrepView patients={patients} />
          </TabsContent>

          <TabsContent value="clinician" className="space-y-4">
            <ClinicianView 
              patients={patients}
              onApprovePlan={handleApprovePlan}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>ER-Flow Demo • Hackathon Prototype • Multi-Agent AI System</p>
          <p className="mt-1">Open browser console to view agent interaction logs</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
