import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientView } from '@/components/PatientView';
import { AmbulanceView } from '@/components/AmbulanceView';
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

  const handlePatientRegistered = (patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev =>
      prev.map(p => p.queue_id === updatedPatient.queue_id ? updatedPatient : p)
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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="patient">Patient View</TabsTrigger>
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
