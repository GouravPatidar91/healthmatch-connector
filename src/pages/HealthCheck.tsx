import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { symptomCategories } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useUserHealthChecks, AnalysisCondition } from "@/services/userDataService";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Define a fallback mock disease structure for use if AI analysis fails
const fallbackDiseases = [
  {
    name: "Common Cold",
    description: "A viral infection of the nose and throat",
    matchedSymptoms: ["Runny nose", "Sore throat", "Cough", "Congestion", "Sneezing", "Headache"],
    matchScore: 80,
    recommendedActions: ["Rest", "Stay hydrated", "Take over-the-counter cold medications"]
  },
  {
    name: "Influenza",
    description: "A viral infection that attacks your respiratory system",
    matchedSymptoms: ["Fever", "Chills", "Muscle aches", "Cough", "Headache", "Fatigue"],
    matchScore: 75,
    recommendedActions: ["Rest", "Stay hydrated", "Take fever reducers", "Consult a doctor if symptoms worsen"]
  },
  {
    name: "Seasonal Allergies",
    description: "An immune system response to an allergen like pollen",
    matchedSymptoms: ["Sneezing", "Runny nose", "Itchy eyes", "Congestion", "Postnasal drip"],
    matchScore: 70,
    recommendedActions: ["Avoid allergens", "Take antihistamines", "Use nasal sprays if recommended by a doctor"]
  }
];

const HealthCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { saveHealthCheck } = useUserHealthChecks();
  
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string>("mild");
  const [duration, setDuration] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [possibleConditions, setPossibleConditions] = useState<AnalysisCondition[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) => 
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };
  
  const analyzeSymptoms = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      // Call the Edge Function to analyze symptoms using AI
      const { data: analysisResult, error } = await supabase.functions.invoke("analyze-symptoms", {
        body: {
          symptoms: selectedSymptoms,
          severity: severity,
          duration: duration
        }
      });

      if (error) {
        console.error("Error analyzing symptoms:", error);
        setAnalysisError("Failed to analyze symptoms. Using fallback analysis instead.");
        toast({
          title: "Analysis Error",
          description: "There was a problem analyzing your symptoms with AI. Using basic analysis instead.",
          variant: "destructive"
        });
        fallbackSymptomAnalysis();
        return;
      }
      
      // Process and set the AI analysis results
      if (analysisResult && analysisResult.conditions && analysisResult.conditions.length > 0) {
        console.log("AI analysis result:", analysisResult);
        setPossibleConditions(analysisResult.conditions);
      } else if (analysisResult && analysisResult.fallback) {
        setAnalysisError("AI analysis failed. Using basic analysis instead.");
        fallbackSymptomAnalysis();
      } else {
        // Fallback to basic matching if AI doesn't return proper format
        setAnalysisError("Could not get accurate analysis. Showing basic results instead.");
        fallbackSymptomAnalysis();
      }
    } catch (error) {
      console.error("Error in symptom analysis:", error);
      setAnalysisError("Failed to analyze symptoms. Using basic analysis instead.");
      fallbackSymptomAnalysis();
    } finally {
      setIsAnalyzing(false);
      setStep(3);
    }
  };
  
  // Fallback to the original symptom matching algorithm if AI analysis fails
  const fallbackSymptomAnalysis = () => {
    const matchedDiseases = fallbackDiseases
      .map(disease => {
        const matchedSymptoms = disease.relatedSymptoms.filter(symptom => 
          selectedSymptoms.includes(symptom)
        );
        
        const matchScore = matchedSymptoms.length / disease.relatedSymptoms.length * 100;
        
        return {
          name: disease.name,
          description: disease.description,
          matchedSymptoms,
          matchScore: Math.round(matchScore),
          recommendedActions: disease.recommendedActions
        };
      })
      .filter(disease => disease.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
    
    setPossibleConditions(matchedDiseases);
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
      // Save health check data to Supabase with analysis results
      await saveHealthCheck({
        symptoms: selectedSymptoms,
        severity,
        duration,
        notes: additionalInfo,
        previous_conditions: possibleConditions.map(c => c.name),
        analysis_results: possibleConditions // Store the detailed analysis results
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
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                  <p className="text-lg">Analyzing your symptoms...</p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold mb-3">Based on your symptoms, you may be experiencing:</h3>
                    
                    {analysisError && (
                      <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4">
                        <p className="text-amber-800 text-sm">{analysisError}</p>
                      </div>
                    )}
                    
                    {possibleConditions.length > 0 ? (
                      <div className="space-y-4">
                        {possibleConditions.map((condition, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{condition.name}</CardTitle>
                              <CardDescription>
                                Match confidence: {typeof condition.matchScore === 'number' ? 
                                  `${Math.round(condition.matchScore)}%` : 
                                  condition.matchScore}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm mb-2">{condition.description}</p>
                              <div className="text-sm">
                                <span className="font-medium">Matched symptoms:</span>{" "}
                                {Array.isArray(condition.matchedSymptoms) ? 
                                  condition.matchedSymptoms.join(", ") : 
                                  condition.matchSymptoms || "Unknown"}
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
                      {possibleConditions.length > 0 && possibleConditions[0].recommendedActions ? (
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
                </>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep((prev) => prev - 1)}
              disabled={isAnalyzing}
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
                disabled={isAnalyzing}
              >
                Save Results
              </Button>
              <Button 
                onClick={handleBookAppointment}
                disabled={isAnalyzing}
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
