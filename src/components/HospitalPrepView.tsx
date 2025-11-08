import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Patient } from '@/types/patient';
import { 
  Ambulance, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Stethoscope, 
  Wrench, 
  Users, 
  Navigation 
} from 'lucide-react';
import { AmbulanceMap } from '@/components/AmbulanceMap';

interface HospitalPrepViewProps {
  patients: Patient[];
}

export function HospitalPrepView({ patients }: HospitalPrepViewProps) {
  const highSeverityPatients = patients.filter(
    p => p.severity >= 8 && (p.status === 'In Transit' || p.status === 'Prep Ready')
  );

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-critical text-critical-foreground';
    return 'bg-warning text-warning-foreground';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Hospital Preparation Center</h2>
        <p className="text-muted-foreground">Real-time Coordination for High-Severity Cases</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active High-Severity Preparations</CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Ambulance className="h-4 w-4 mr-1" />
              {highSeverityPatients.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {highSeverityPatients.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No high-severity cases requiring preparation</p>
              <p className="text-sm text-muted-foreground mt-2">
                System will automatically alert when critical patients are inbound
              </p>
            </div>
          ) : (
            highSeverityPatients.map(patient => (
              <Alert key={patient.queue_id} className="border-critical bg-critical/5">
                <Ambulance className="h-5 w-5 text-critical" />
                <AlertDescription>
                  <div className="space-y-6">
                    {/* Real-time Ambulance Tracking - Show for In Transit and Prep Ready */}
                    {(patient.status === 'In Transit' || patient.status === 'Prep Ready') && patient.eta_minutes && patient.eta_minutes > 0 && (
                      <div className="mb-4">
                        <AmbulanceMap 
                          patientName={patient.patient_name} 
                          eta={patient.eta_minutes} 
                        />
                      </div>
                    )}

                    {/* Patient Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-xl text-foreground mb-1">
                          INBOUND: {patient.patient_name}
                        </p>
                        <p className="text-sm text-muted-foreground">NHS: {patient.nhs_number}</p>
                      </div>
                      <Badge className={getSeverityColor(patient.severity)}>
                        CRITICAL {patient.severity}/10
                      </Badge>
                    </div>

                    {/* Status & ETA */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 p-3 bg-card rounded-md">
                        <Clock className="h-5 w-5 text-critical" />
                        <div>
                          <p className="text-xs text-muted-foreground">ETA</p>
                          <p className="font-bold text-foreground">{patient.eta_minutes} mins</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-card rounded-md">
                        <Navigation className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="font-bold text-foreground">{patient.status}</p>
                        </div>
                      </div>
                    </div>

                    {/* Clinical Notes */}
                    <div className="p-4 bg-card rounded-md border">
                      <p className="font-semibold mb-2 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Clinical Assessment:
                      </p>
                      <p className="text-sm text-muted-foreground">{patient.triage_notes}</p>
                    </div>

                    {patient.resource_plan && (
                      <>
                        {/* Ambulance Entrance */}
                        <div className="p-4 bg-accent/10 rounded-md border border-accent/30">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-5 w-5 text-accent" />
                            <p className="font-semibold">Ambulance Entrance:</p>
                          </div>
                          <p className="text-lg font-bold text-accent">
                            {patient.resource_plan.entrance}
                          </p>
                        </div>

                        {/* Room Assignment */}
                        {patient.resource_plan.roomAssignment && (
                          <div className="p-4 bg-primary/10 rounded-md border border-primary/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Navigation className="h-5 w-5 text-primary" />
                              <p className="font-semibold">Room Assignment:</p>
                            </div>
                            <p className="text-lg font-bold text-primary">
                              {patient.resource_plan.roomAssignment}
                            </p>
                          </div>
                        )}

                        {/* Specialists Needed */}
                        {patient.resource_plan.specialistsNeeded && (
                          <div className="p-4 bg-card rounded-md border">
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="h-5 w-5 text-foreground" />
                              <p className="font-semibold">Specialists to Page:</p>
                            </div>
                            <ul className="space-y-2">
                              {patient.resource_plan.specialistsNeeded.map((specialist: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-success" />
                                  <span>{specialist}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Equipment Required */}
                        {patient.resource_plan.equipmentRequired && (
                          <div className="p-4 bg-card rounded-md border">
                            <div className="flex items-center gap-2 mb-3">
                              <Wrench className="h-5 w-5 text-foreground" />
                              <p className="font-semibold">Equipment to Prepare:</p>
                            </div>
                            <ul className="space-y-2">
                              {patient.resource_plan.equipmentRequired.map((equipment: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-success" />
                                  <span>{equipment}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Staff to Contact */}
                        {patient.resource_plan.staffToContact && (
                          <div className="p-4 bg-warning/10 rounded-md border border-warning/30">
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="h-5 w-5 text-warning" />
                              <p className="font-semibold">Staff to Contact:</p>
                            </div>
                            <ul className="space-y-2">
                              {patient.resource_plan.staffToContact.map((staff: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-warning" />
                                  <span>{staff}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Areas to Clear */}
                        {patient.resource_plan.areasToClear && (
                          <div className="p-4 bg-critical/10 rounded-md border border-critical/30">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="h-5 w-5 text-critical" />
                              <p className="font-semibold">Areas to Clear for Patient Flow:</p>
                            </div>
                            <ul className="space-y-2">
                              {patient.resource_plan.areasToClear.map((area: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-critical" />
                                  <span>{area}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Detailed Plan */}
                        <div className="p-4 bg-accent/10 rounded-md border border-accent/30">
                          <p className="font-semibold mb-3">Detailed Preparation Plan:</p>
                          <pre className="text-sm whitespace-pre-wrap text-foreground">
                            {patient.resource_plan.plan_text}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">System Features</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• AI-powered resource allocation optimizes patient flow</p>
          <p>• Real-time coordination between ambulance, specialists, and facility teams</p>
          <p>• Automatic area clearing ensures smooth transit from entrance to treatment</p>
          <p>• Equipment and staff preparation begins during ambulance transit</p>
          <p>• Converts travel time into preparation time, reducing door-to-treatment delays</p>
        </CardContent>
      </Card>
    </div>
  );
}
