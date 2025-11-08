import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/types/patient';
import { AmbulanceMap } from '@/components/AmbulanceMap';
import { AmbulanceChat } from '@/components/AmbulanceChat';
import { User, Activity, FileText, Clock } from 'lucide-react';

interface FirstResponderViewProps {
  patients: Patient[];
}

export function FirstResponderView({ patients }: FirstResponderViewProps) {
  // Get the first patient that's either dispatched or in transit
  const activePatient = patients.find(
    p => p.status === 'Ambulance Dispatched' || p.status === 'In Transit' || p.status === 'Prep Ready'
  );

  if (!activePatient) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">First Responder View</h2>
          <p className="text-muted-foreground">En route to emergency - Real-time navigation & patient communication</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active emergency dispatch</p>
            <p className="text-sm text-muted-foreground mt-2">Waiting for dispatch assignment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-critical text-critical-foreground';
    if (severity >= 5) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  const patientContext = `Patient symptoms: ${activePatient.symptom_description}. Severity: ${activePatient.severity}. Triage notes: ${activePatient.triage_notes}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">First Responder View</h2>
        <p className="text-muted-foreground">En route to emergency - Real-time navigation & patient communication</p>
      </div>

      {/* Map Section */}
      <AmbulanceMap 
        patientName={activePatient.patient_name}
        eta={activePatient.eta_minutes || 12}
        dispatchTime={activePatient.dispatch_time}
        reverseDirection={false}
      />

      {/* Patient Information Card */}
      <Card className="border-l-4 border-l-destructive">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-destructive" />
                Patient Information
              </CardTitle>
              <CardDescription className="mt-1">
                Emergency call received - En route to location
              </CardDescription>
            </div>
            <Badge className={getSeverityColor(activePatient.severity)}>
              Severity {activePatient.severity}/10
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{activePatient.patient_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">NHS Number:</span>
                <span>{activePatient.nhs_number}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">ETA:</span>
                <span className="text-destructive font-semibold">{activePatient.eta_minutes || 12} minutes</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Status:</span>
                <Badge variant="outline">{activePatient.status}</Badge>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-semibold text-foreground">Reported Symptoms:</p>
            <p className="text-sm text-muted-foreground">{activePatient.symptom_description}</p>
          </div>

          {activePatient.triage_notes && (
            <div className="p-4 bg-accent/20 rounded-lg border border-accent/30 space-y-2">
              <p className="text-sm font-semibold text-foreground">Triage Assessment:</p>
              <p className="text-sm text-muted-foreground">{activePatient.triage_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Chat Section */}
      <AmbulanceChat patientContext={patientContext} />
    </div>
  );
}
