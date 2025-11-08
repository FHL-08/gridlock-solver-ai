import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Patient } from '@/types/patient';
import { Bell, CheckCircle, Clock, MapPin, Edit3, Save, X } from 'lucide-react';

interface ClinicianViewProps {
  patients: Patient[];
  onApprovePlan: (patient: Patient) => void;
}

export function ClinicianView({ patients, onApprovePlan }: ClinicianViewProps) {
  const awaitingApproval = patients.filter(p => p.status === 'Awaiting Plan Approval');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editedPlanText, setEditedPlanText] = useState('');

  const handleApprove = (patient: Patient) => {
    console.log(`[ClinicianAgent]: Reviewing plan for patient ${patient.nhs_number}`);
    console.log(`[OpsAgent]: Plan for ${patient.nhs_number} Approved by staff. Notifying teams.`);
    
    // If plan was edited, update it before approving
    if (editingPlanId === patient.queue_id && patient.resource_plan) {
      patient.resource_plan.plan_text = editedPlanText;
    }
    
    onApprovePlan(patient);
    setEditingPlanId(null);
  };

  const handleEditPlan = (patient: Patient) => {
    setEditingPlanId(patient.queue_id);
    setEditedPlanText(patient.resource_plan?.plan_text || '');
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditedPlanText('');
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-critical text-critical-foreground';
    if (severity >= 5) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Clinician Alert Center</h2>
        <p className="text-muted-foreground">On-Call Dashboard - Inbound Patient Alerts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pending Plan Approvals</CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Bell className="h-4 w-4 mr-1" />
              {awaitingApproval.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {awaitingApproval.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No pending approvals at this time</p>
              <p className="text-sm text-muted-foreground mt-2">
                You will be notified when high-priority patients require plan approval
              </p>
            </div>
          ) : (
            awaitingApproval.map(patient => (
              <Alert key={patient.queue_id} className="border-warning bg-warning/5">
                <Bell className="h-5 w-5 text-warning" />
                <AlertDescription>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-lg text-foreground mb-1">
                          INBOUND: {patient.patient_name}
                        </p>
                        <p className="text-sm text-muted-foreground">NHS: {patient.nhs_number}</p>
                      </div>
                      <Badge className={getSeverityColor(patient.severity)}>
                        Severity {patient.severity}/10
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>ETA: {patient.eta_minutes} mins</span>
                      </div>
                      {patient.resource_plan && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{patient.resource_plan.entrance}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-card rounded-md border">
                      <p className="font-semibold mb-2">Clinical Notes:</p>
                      <p className="text-sm text-muted-foreground mb-3">{patient.triage_notes}</p>
                      
                      {patient.ambulance_updates && patient.ambulance_updates.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="font-semibold mb-2 text-sm">Latest Ambulance Update:</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.ambulance_updates[patient.ambulance_updates.length - 1].text}
                          </p>
                        </div>
                      )}
                    </div>

                    {patient.resource_plan && (
                      <div className="p-4 bg-accent/10 rounded-md border border-accent/30">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold">Proposed Resource Plan:</p>
                          {editingPlanId !== patient.queue_id && (
                            <Button 
                              onClick={() => handleEditPlan(patient)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit Plan
                            </Button>
                          )}
                        </div>
                        
                        {editingPlanId === patient.queue_id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editedPlanText}
                              onChange={(e) => setEditedPlanText(e.target.value)}
                              rows={12}
                              className="font-mono text-sm"
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleCancelEdit}
                                variant="outline"
                                size="sm"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => setEditingPlanId(null)}
                                size="sm"
                                className="bg-primary"
                              >
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2 mb-4">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-2 bg-background rounded border">
                                  <p className="text-xs text-muted-foreground">Entrance</p>
                                  <p className="font-medium">{patient.resource_plan.entrance}</p>
                                </div>
                                {patient.resource_plan.roomAssignment && (
                                  <div className="p-2 bg-background rounded border">
                                    <p className="text-xs text-muted-foreground">Room Assignment</p>
                                    <p className="font-medium">{patient.resource_plan.roomAssignment}</p>
                                  </div>
                                )}
                              </div>
                              {patient.resource_plan.specialistsNeeded && (
                                <div className="p-2 bg-background rounded border">
                                  <p className="text-xs text-muted-foreground mb-1">Specialists</p>
                                  <p className="text-sm">{patient.resource_plan.specialistsNeeded.join(', ')}</p>
                                </div>
                              )}
                              {patient.resource_plan.equipmentRequired && (
                                <div className="p-2 bg-background rounded border">
                                  <p className="text-xs text-muted-foreground mb-1">Equipment</p>
                                  <p className="text-sm">{patient.resource_plan.equipmentRequired.join(', ')}</p>
                                </div>
                              )}
                            </div>
                            <pre className="text-sm whitespace-pre-wrap text-foreground p-3 bg-background rounded border">
                              {patient.resource_plan.plan_text}
                            </pre>
                          </>
                        )}
                      </div>
                    )}

                    <Button 
                      onClick={() => handleApprove(patient)}
                      className="w-full bg-success hover:bg-success/90"
                      size="lg"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      APPROVE PLAN
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Review incoming patient alerts with proposed resource plans</p>
          <p>• Click "APPROVE PLAN" to activate resource allocation</p>
          <p>• Approved plans trigger immediate team notifications</p>
          <p>• High-severity patients (8+) require rapid approval</p>
        </CardContent>
      </Card>
    </div>
  );
}
