import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Patient } from '@/types/patient';
import { videoOptions } from '@/lib/mockData';
import { Ambulance, Clock, MapPin } from 'lucide-react';

interface AmbulanceViewProps {
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => void;
}

export function AmbulanceView({ patients, onUpdatePatient }: AmbulanceViewProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [updateText, setUpdateText] = useState('');
  const [updateVideo, setUpdateVideo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const dispatchedPatients = patients.filter(
    p => p.status === 'Ambulance Dispatched' || p.status === 'In Transit'
  );

  const handleSendUpdate = () => {
    if (!selectedPatient || !updateText) return;

    const updatedPatient: Patient = {
      ...selectedPatient,
      status: 'In Transit',
      ambulance_updates: [
        ...(selectedPatient.ambulance_updates || []),
        {
          timestamp: new Date().toISOString(),
          text: updateText,
          video: updateVideo || undefined
        }
      ],
      eta_minutes: 12
    };

    console.log(`[EMSAgent]: Sending update for patient ${selectedPatient.nhs_number} (${selectedPatient.patient_name})`);
    console.log(`[EMSAgent]: Update: "${updateText}"`);
    console.log(`[OpsAgent]: Patient (ID ${selectedPatient.nhs_number}) in transit. New data received. Requesting resource plan.`);

    onUpdatePatient(updatedPatient);
    setUpdateText('');
    setUpdateVideo('');
    setDialogOpen(false);
    setSelectedPatient(null);
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-critical text-critical-foreground';
    if (severity >= 5) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Ambulance Dispatch Center</h2>
        <p className="text-muted-foreground">EMSAgent - Active Dispatches & In-Transit Updates</p>
      </div>

      {dispatchedPatients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ambulance className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active dispatches at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {dispatchedPatients.map(patient => (
            <Card key={patient.queue_id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ambulance className="h-5 w-5 text-primary" />
                      {patient.patient_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">NHS: {patient.nhs_number}</p>
                  </div>
                  <Badge className={getSeverityColor(patient.severity)}>
                    Severity {patient.severity}/10
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>ETA: {patient.eta_minutes || 15} mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.status}</span>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Initial Assessment:</p>
                  <p className="text-sm text-muted-foreground">{patient.triage_notes}</p>
                </div>

                {patient.ambulance_updates && patient.ambulance_updates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Updates from Crew:</p>
                    {patient.ambulance_updates.map((update, idx) => (
                      <div key={idx} className="p-3 bg-accent/20 rounded-md border border-accent/30">
                        <p className="text-sm">{update.text}</p>
                        {update.video && (
                          <p className="text-xs text-muted-foreground mt-1">📹 {update.video}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Dialog open={dialogOpen && selectedPatient?.queue_id === patient.queue_id} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => setSelectedPatient(patient)} 
                      className="w-full"
                      variant="default"
                    >
                      Send Update to Hospital
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Update - {patient.patient_name}</DialogTitle>
                      <DialogDescription>
                        Provide real-time updates from the ambulance to the hospital
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="update-text">Update Details</Label>
                        <Textarea
                          id="update-text"
                          placeholder="e.g., Vitals unstable. Confirmed stroke symptoms."
                          value={updateText}
                          onChange={(e) => setUpdateText(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="update-video">Additional Video (Optional)</Label>
                        <Select value={updateVideo} onValueChange={setUpdateVideo}>
                          <SelectTrigger id="update-video">
                            <SelectValue placeholder="Select video file" />
                          </SelectTrigger>
                          <SelectContent>
                            {videoOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleSendUpdate} className="w-full">
                        Send Update
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
