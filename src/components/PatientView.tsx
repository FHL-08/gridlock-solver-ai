import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockPatientDB, videoOptions } from '@/lib/mockData';
import { calculateWaitTime } from '@/lib/aiSubstitutions';
import { Patient } from '@/types/patient';
import { AlertCircle, CheckCircle, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { HospitalSelector, Hospital } from '@/components/HospitalSelector';

interface PatientViewProps {
  onPatientRegistered: (patient: Patient) => void;
  currentQueueLength: number;
}

export function PatientView({ onPatientRegistered, currentQueueLength }: PatientViewProps) {
  const [nhsNumber, setNhsNumber] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [result, setResult] = useState<{ 
    severity: number; 
    waitTime?: number; 
    requiresDispatch: boolean;
    recommendations?: string;
    triageNotes?: string;
  } | null>(null);
  const [showConfirmDispatch, setShowConfirmDispatch] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleSubmit = async () => {
    if (!nhsNumber || !selectedHospital || !symptoms || !selectedVideo) {
      alert('Please fill in all fields');
      return;
    }

    const patientData = mockPatientDB.find(p => p.nhs_number === nhsNumber);
    if (!patientData) {
      alert('NHS Number not found in mock database');
      return;
    }

    setIsProcessing(true);

    try {
      // Call AI triage agent
      const { data, error } = await supabase.functions.invoke('triage-assessment', {
        body: {
          symptoms,
          videoFilename: selectedVideo,
          conversationHistory
        }
      });

      if (error) throw error;

      console.log(`[TriageAgent]: Patient ${nhsNumber} (${patientData.name}) - AI assessment complete`);

      // Check if AI needs more information
      if (data.needsMoreInfo && data.question) {
        setAiQuestion(data.question);
        setConversationHistory([...conversationHistory, { role: 'assistant', content: data.question }]);
        setIsProcessing(false);
        return;
      }

      const severity = data.severity;
      const triageNotes = data.triageNotes;
      const recommendations = data.recommendations;

      if (severity >= 8) {
        setResult({ severity, requiresDispatch: true, recommendations, triageNotes });
        setShowConfirmDispatch(true);
        console.log(`[TriageAgent]: HIGH SEVERITY DETECTED - Severity ${severity}/10`);
      } else {
        const waitTime = calculateWaitTime(severity, currentQueueLength);
        setResult({ severity, waitTime, requiresDispatch: false, recommendations, triageNotes });
        
        const newPatient: Patient = {
          queue_id: `Q${Date.now()}`,
          patient_name: patientData.name,
          nhs_number: nhsNumber,
          severity,
          status: 'Waiting (Remote)',
          triage_notes: triageNotes,
          symptom_description: symptoms,
          video_filename: selectedVideo
        };

        console.log(`[OpsAgent]: Registering new patient (ID ${nhsNumber}). Severity ${severity}.`);
        console.log(`[System]: Patient data successfully transmitted to hospital system.`);
        onPatientRegistered(newPatient);
        setRegistrationComplete(true);
      }
    } catch (error) {
      console.error('Error in AI triage assessment:', error);
      alert('Error processing assessment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiQuestionResponse = async () => {
    if (!userResponse.trim()) return;

    const updatedHistory = [...conversationHistory, { role: 'user', content: userResponse }];
    setConversationHistory(updatedHistory);
    setUserResponse('');
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('triage-assessment', {
        body: {
          symptoms,
          videoFilename: selectedVideo,
          conversationHistory: updatedHistory
        }
      });

      if (error) throw error;

      if (data.needsMoreInfo && data.question) {
        setAiQuestion(data.question);
        setConversationHistory([...updatedHistory, { role: 'assistant', content: data.question }]);
      } else {
        setAiQuestion(null);
        const severity = data.severity;
        const triageNotes = data.triageNotes;
        const recommendations = data.recommendations;

        if (severity >= 8) {
          setResult({ severity, requiresDispatch: true, recommendations, triageNotes });
          setShowConfirmDispatch(true);
        } else {
          const waitTime = calculateWaitTime(severity, currentQueueLength);
          setResult({ severity, waitTime, requiresDispatch: false, recommendations, triageNotes });
          
          const patientData = mockPatientDB.find(p => p.nhs_number === nhsNumber);
          const newPatient: Patient = {
            queue_id: `Q${Date.now()}`,
            patient_name: patientData!.name,
            nhs_number: nhsNumber,
            severity,
            status: 'Waiting (Remote)',
            triage_notes: triageNotes,
            symptom_description: symptoms,
            video_filename: selectedVideo
          };

          console.log(`[System]: Patient data successfully transmitted to hospital system.`);
          onPatientRegistered(newPatient);
          setRegistrationComplete(true);
        }
      }
    } catch (error) {
      console.error('Error processing follow-up:', error);
      alert('Error processing response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDispatch = async () => {
    const patientData = mockPatientDB.find(p => p.nhs_number === nhsNumber);
    if (!patientData || !result) return;

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('triage-assessment', {
        body: {
          symptoms,
          videoFilename: selectedVideo,
          conversationHistory
        }
      });

      if (error) throw error;

      const newPatient: Patient = {
        queue_id: `Q${Date.now()}`,
        patient_name: patientData.name,
        nhs_number: nhsNumber,
        severity: result.severity,
        status: 'Ambulance Dispatched',
        triage_notes: data.triageNotes,
        symptom_description: symptoms,
        video_filename: selectedVideo,
        eta_minutes: 15
      };

      console.log(`[OpsAgent]: High-severity event (ID ${nhsNumber}). Severity ${result.severity}. Requesting dispatch.`);
      console.log(`[EMSAgent]: Ambulance dispatched for patient ${nhsNumber}`);
      onPatientRegistered(newPatient);
      setShowConfirmDispatch(false);
    } catch (error) {
      console.error('Error in dispatch:', error);
      alert('Error processing dispatch. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setNhsNumber('');
    setSelectedHospital('');
    setSymptoms('');
    setSelectedVideo('');
    setResult(null);
    setShowConfirmDispatch(false);
    setConversationHistory([]);
    setAiQuestion(null);
    setUserResponse('');
    setRegistrationComplete(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Patient Triage Interface</h2>
        <p className="text-muted-foreground">TriageAgent - Remote Assessment & Registration</p>
      </div>

      <HospitalSelector onHospitalsUpdate={setNearbyHospitals} />

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>Enter patient details for remote triage assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nhs-number">NHS Number</Label>
            <Input
              id="nhs-number"
              placeholder="e.g., 9912003071"
              value={nhsNumber}
              onChange={(e) => setNhsNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hospital">Select Hospital</Label>
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger id="hospital">
                <SelectValue placeholder="Choose a hospital" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {nearbyHospitals.map(hospital => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name} - {hospital.distance} km ({hospital.capacity}/{hospital.maxCapacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptoms">Describe Symptoms</Label>
            <Textarea
              id="symptoms"
              placeholder="Please describe the symptoms or injury..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Upload Video Assessment (Simulated)</Label>
            <Select value={selectedVideo} onValueChange={setSelectedVideo}>
              <SelectTrigger id="video">
                <SelectValue placeholder="Select mock video file" />
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

          {aiQuestion && (
            <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border-2 border-primary/20 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="font-semibold text-primary text-lg">AI Assessment Question</p>
                  <p className="text-base text-foreground leading-relaxed">{aiQuestion}</p>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your response here..."
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      rows={2}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleAiQuestionResponse}
                      disabled={isProcessing || !userResponse.trim()}
                      size="lg"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit Assessment'
            )}
          </Button>
        </CardContent>
      </Card>

      {showConfirmDispatch && result && (
        <Alert className="border-critical bg-critical/10">
          <AlertCircle className="h-5 w-5 text-critical" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-critical text-lg mb-1">HIGH SEVERITY DETECTED</p>
                <p className="text-foreground">Severity: {result.severity}/10</p>
                <p className="text-muted-foreground mt-2">
                  This requires immediate emergency response. Please confirm 999 dispatch.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleConfirmDispatch} 
                  className="bg-critical hover:bg-critical/90"
                  size="lg"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Confirm 999 Dispatch
                </Button>
                <Button onClick={resetForm} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {result && !result.requiresDispatch && registrationComplete && (
        <Alert className="border-success bg-success/10">
          <CheckCircle className="h-5 w-5 text-success" />
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-success text-xl mb-3">✓ Registration Complete</p>
                <p className="text-muted-foreground mb-4">
                  Your information has been successfully transmitted to the hospital system.
                </p>
              </div>

              <div className="bg-background/50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Severity Level</p>
                    <p className="text-2xl font-bold text-foreground">{result.severity}/10</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.severity <= 3 ? 'Minor Issue' : result.severity <= 6 ? 'Moderate Issue' : 'Serious Issue'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Estimated Wait</p>
                    <p className="text-2xl font-bold text-foreground">{result.waitTime} min</p>
                    <p className="text-xs text-muted-foreground mt-1">Approximate time</p>
                  </div>
                </div>

                {result.triageNotes && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Assessment Notes</p>
                    <p className="text-sm text-foreground">{result.triageNotes}</p>
                  </div>
                )}

                {result.recommendations && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">⚕️ Recommendations</p>
                    <p className="text-sm text-foreground font-medium">{result.recommendations}</p>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 p-3 rounded-md">
                <p className="text-sm text-foreground">
                  <strong>Next steps:</strong> You are now in the queue. Monitor the <strong>Ambulance View</strong> and <strong>Hospital Operations</strong> tabs for real-time updates on your case.
                </p>
              </div>

              <Button onClick={resetForm} className="mt-2 w-full" size="lg">
                Register Another Patient
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
