import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Patient } from '@/types/patient';
import { AmbulanceMap } from '@/components/AmbulanceMap';
import { ParamedicChat } from '@/components/ParamedicChat';
import { videoOptions, mockHospitalDB } from '@/lib/mockData';
import { User, Activity, FileText, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FirstResponderViewProps {
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => void;
}

export function FirstResponderView({ patients, onUpdatePatient }: FirstResponderViewProps) {
  const [updateText, setUpdateText] = useState('');
  const [updateVideo, setUpdateVideo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get the first patient that's either dispatched, in transit, or arrived
  const activePatient = patients.find(
    p => p.status === 'Ambulance Dispatched' || p.status === 'In Transit' || p.status === 'Prep Ready' || p.status === 'Arrived'
  );

  const hasArrived = activePatient?.status === 'Arrived' || (activePatient?.eta_minutes === 0 && activePatient.status !== 'Ambulance Dispatched');

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

  const handleSendUpdate = async () => {
    if (!activePatient || !updateText) return;

    const updatedPatient: Patient = {
      ...activePatient,
      status: 'In Transit',
      ambulance_updates: [
        ...(activePatient.ambulance_updates || []),
        {
          timestamp: new Date().toISOString(),
          text: updateText,
          video: updateVideo || undefined
        }
      ],
      eta_minutes: 12
    };

    console.log(`[EMSAgent]: Sending update for patient ${activePatient.nhs_number} (${activePatient.patient_name})`);
    console.log(`[EMSAgent]: Update: "${updateText}"`);
    console.log(`[OpsAgent]: Patient (ID ${activePatient.nhs_number}) in transit. New data received. Generating AI resource plan.`);

    // Generate AI-powered resource plan for high-severity patients
    if (activePatient.severity >= 8) {
      try {
        const hospitalCapacity = mockHospitalDB[0];
        
        const { data, error } = await supabase.functions.invoke('resource-planning', {
          body: {
            patient: updatedPatient,
            hospitalCapacity: {
              current: hospitalCapacity.current_capacity,
              max: hospitalCapacity.max_capacity
            }
          }
        });

        if (error) throw error;

        updatedPatient.resource_plan = data;
        updatedPatient.status = 'Awaiting Plan Approval';
        
        console.log(`[OpsAgent]: AI resource plan generated for ${activePatient.nhs_number}`);
      } catch (error) {
        console.error('Error generating AI resource plan:', error);
      }
    }

    onUpdatePatient(updatedPatient);
    setUpdateText('');
    setUpdateVideo('');
    setDialogOpen(false);
  };

  const patientContext = `Patient symptoms: ${activePatient.symptom_description}. Severity: ${activePatient.severity}. Triage notes: ${activePatient.triage_notes}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">First Responder View</h2>
        <p className="text-muted-foreground">En route to emergency - Real-time navigation & patient communication</p>
      </div>

      {!hasArrived ? (
        <>
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
          <ParamedicChat patientContext={patientContext} />
        </>
      ) : (
        <>
          {/* Patient Arrived - Update Form Section */}
          <Card className="border-l-4 border-l-success">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-success" />
                    Patient Arrived - {activePatient.patient_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Send updates to hospital operations
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
                <p className="text-sm font-semibold text-foreground">Initial Assessment:</p>
                <p className="text-sm text-muted-foreground">{activePatient.triage_notes}</p>
              </div>

              {activePatient.ambulance_updates && activePatient.ambulance_updates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Previous Updates:</p>
                  {activePatient.ambulance_updates.map((update, idx) => (
                    <div key={idx} className="p-3 bg-accent/20 rounded-md border border-accent/30">
                      <p className="text-sm">{update.text}</p>
                      {update.video && (
                        <p className="text-xs text-muted-foreground mt-1">📹 {update.video}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="default">
                    Send Update to Hospital
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Update - {activePatient.patient_name}</DialogTitle>
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
        </>
      )}
    </div>
  );
}
