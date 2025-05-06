
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useUserHealthChecks, AnalysisCondition } from '@/services/userDataService';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Image } from "@/components/ui/image";

interface HealthCheckData {
  symptoms: string[];
  severity?: string;
  duration?: string;
  previous_conditions?: string[];
  medications?: string[];
  notes?: string;
  analysis_results?: AnalysisCondition[];
  symptom_photos?: {[symptom: string]: string};
}

const HealthCheckResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveHealthCheck } = useUserHealthChecks();
  const [saving, setSaving] = useState(false);

  // Extract health check data from location state
  const healthCheckData = location.state?.healthCheckData as HealthCheckData | undefined;

  // If no data is provided, redirect back to health check form
  if (!healthCheckData || !healthCheckData.analysis_results) {
    navigate('/health-check');
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure we're passing the analysis_results properly for database storage
      const dataToSave = {
        ...healthCheckData,
        // Make sure the analysis results are properly formatted
        analysis_results: healthCheckData.analysis_results
      };
      
      console.log("Saving health check with data:", dataToSave);
      
      await saveHealthCheck(dataToSave);
      toast({
        title: "Health check saved",
        description: "Your health information has been saved successfully"
      });
      navigate('/health-check-history');
    } catch (error) {
      console.error("Error saving health check:", error);
      toast({
        title: "Error",
        description: "Failed to save your health check information",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-medical-neutral-darkest">Health Check Results</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            Back to Form
          </Button>
          <Button variant="outline" onClick={() => navigate('/health-check-history')}>
            View History
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Symptom Summary</CardTitle>
          <CardDescription>Based on your reported symptoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reported Symptoms</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {healthCheckData.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline">{symptom}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Severity</h3>
                <p>{healthCheckData.severity || "Not specified"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p>{healthCheckData.duration || "Not specified"}</p>
              </div>
            </div>
          </div>

          {/* Display symptom photos if any */}
          {healthCheckData.symptom_photos && Object.keys(healthCheckData.symptom_photos).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Symptom Photos</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(healthCheckData.symptom_photos).map(([symptom, photoSrc]) => (
                  photoSrc && (
                    <div key={symptom} className="border rounded-md p-2">
                      <p className="text-xs text-gray-500 mb-1">{symptom}</p>
                      <Image 
                        src={photoSrc} 
                        alt={`${symptom} photo`} 
                        className="w-full h-auto object-cover rounded"
                        style={{ maxHeight: '150px' }}
                        fallback="/placeholder.svg"
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>Possible conditions based on your symptoms</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {healthCheckData.analysis_results?.map((condition, idx) => (
              <AccordionItem key={idx} value={`condition-${idx}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span>{condition.name}</span>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {condition.matchScore}% match
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pl-1">
                    <p className="text-gray-700">{condition.description}</p>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">Matched Symptoms:</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {condition.matchedSymptoms.map((symptom, i) => (
                          <Badge key={i} variant="outline">{symptom}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">Recommendations:</h4>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {condition.recommendedActions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              'Save to Health Records'
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Additional Information */}
      {(healthCheckData.previous_conditions?.length || healthCheckData.medications?.length || healthCheckData.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthCheckData.previous_conditions?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Previous Medical Conditions</h3>
                <p className="mt-1">{healthCheckData.previous_conditions.join(", ")}</p>
              </div>
            )}
            
            {healthCheckData.medications?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Medications</h3>
                <p className="mt-1">{healthCheckData.medications.join(", ")}</p>
              </div>
            )}
            
            {healthCheckData.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1">{healthCheckData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthCheckResults;
