
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { symptomCategories, mockDiseases } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useUserHealthChecks } from "@/services/userDataService";

const HealthCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { saveHealthCheck } = useUserHealthChecks();
  
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string>("mild");
  const [duration, setDuration] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [possibleConditions, setPossibleConditions] = useState<any[]>([]);
  
  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) => 
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };
  
  const analyzeSymptoms = () => {
    const matchedDiseases = mockDiseases
      .map(disease => {
        const matchedSymptoms = disease.relatedSymptoms.filter(symptom => 
          selectedSymptoms.includes(symptom)
        );
        
        const matchScore = matchedSymptoms.length / disease.relatedSymptoms.length;
        
        return {
          ...disease,
          matchScore,
          matchedSymptoms
        };
      })
      .filter(disease => disease.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
    
    setPossibleConditions(matchedDiseases);
    
    setStep(3);
  };
  
  const handleNext = () => {
    if (step === 1) {
      if (selectedSymptoms.length === 0) {
        toast({
          title: "No symptoms selected",
          description: "Please select at least one symptom to continue.",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      analyzeSymptoms();
    }
  };
  
  const handleSaveHealthCheck = async () => {
    try {
      // Save health check data to Supabase
      await saveHealthCheck({
        symptoms: selectedSymptoms,
        severity,
        duration,
        notes: additionalInfo,
        previous_conditions: possibleConditions.map(c => c.name)
      });
      
      toast({
        title: "Health check saved",
        description: "Your health check data has been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your health check data.",
        variant: "destructive"
      });
      console.error("Error saving health check:", error);
    }
  };
  
  const handleBookAppointment = async () => {
    // First save the health check
    await handleSaveHealthCheck();
    
    // Then navigate to appointments page
    navigate("/appointments", { 
      state: { 
        fromHealthCheck: true,
        symptoms: selectedSymptoms,
        possibleConditions 
      } 
    });
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Health Check</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step {step} of 3</CardTitle>
          <CardDescription>
            {step === 1 && "Select the symptoms you're experiencing"}
            {step === 2 && "Provide additional details about your symptoms"}
            {step === 3 && "Review your potential conditions"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              {symptomCategories.map((category, index) => (
                <div key={index}>
                  <h3 className="font-semibold mb-3">{category.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {category.symptoms.map((symptom, symIndex) => (
                      <div key={symIndex} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`symptom-${index}-${symIndex}`}
                          checked={selectedSymptoms.includes(symptom)}
                          onCheckedChange={() => handleSymptomToggle(symptom)}
                        />
                        <Label htmlFor={`symptom-${index}-${symIndex}`}>{symptom}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="severity">How severe are your symptoms?</Label>
                <RadioGroup 
                  id="severity" 
                  value={severity} 
                  onValueChange={setSeverity}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mild" id="mild" />
                    <Label htmlFor="mild">Mild</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate">Moderate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="severe" id="severe" />
                    <Label htmlFor="severe">Severe</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="duration">How long have you been experiencing these symptoms?</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Just today</SelectItem>
                    <SelectItem value="few_days">A few days</SelectItem>
                    <SelectItem value="week">About a week</SelectItem>
                    <SelectItem value="few_weeks">A few weeks</SelectItem>
                    <SelectItem value="month">More than a month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="additional-info">Any additional information?</Label>
                <Textarea 
                  id="additional-info"
                  placeholder="Describe anything else that might be relevant..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Based on your symptoms, you may be experiencing:</h3>
                
                {possibleConditions.length > 0 ? (
                  <div className="space-y-4">
                    {possibleConditions.map((condition, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{condition.name}</CardTitle>
                          <CardDescription>
                            Match confidence: {Math.round(condition.matchScore * 100)}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-2">{condition.description}</p>
                          <div className="text-sm">
                            <span className="font-medium">Matched symptoms:</span>{" "}
                            {condition.matchedSymptoms.join(", ")}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <div className="bg-medical-blue/10 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Important Notice</h4>
                      <p className="text-sm text-medical-neutral-dark">
                        This is not a medical diagnosis. These suggestions are based on your reported symptoms and
                        should not replace professional medical advice. Please consult with a healthcare professional
                        for proper diagnosis and treatment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-medical-neutral-light rounded-lg p-4 text-center">
                    <p>No specific conditions matched your symptoms.</p>
                    <p className="text-sm mt-2">
                      This doesn't mean you're not experiencing a health issue. If you're concerned,
                      we recommend speaking with a healthcare professional.
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Recommended actions:</h3>
                <ul className="space-y-2">
                  {possibleConditions.length > 0 ? (
                    possibleConditions[0].recommendedActions.map((action: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-medical-blue" />
                        <span>{action}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-medical-blue" />
                        <span>Rest and stay hydrated</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-medical-blue" />
                        <span>Monitor your symptoms</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-medical-blue" />
                        <span>Consult with a healthcare professional if symptoms persist</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep((prev) => prev - 1)}
            >
              Back
            </Button>
          )}
          
          {step < 3 ? (
            <Button 
              onClick={handleNext}
              className="ml-auto"
            >
              {step === 2 ? "See Results" : "Next"}
            </Button>
          ) : (
            <div className="ml-auto space-x-2">
              <Button 
                variant="outline"
                onClick={handleSaveHealthCheck}
              >
                Save Results
              </Button>
              <Button 
                onClick={handleBookAppointment}
              >
                Book Appointment
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default HealthCheck;
