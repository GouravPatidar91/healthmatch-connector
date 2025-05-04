
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserHealthChecks, AnalysisCondition } from '@/services/userDataService';
import { format } from 'date-fns';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HealthCheckHistory = () => {
  const navigate = useNavigate();
  const { healthChecks, loading } = useUserHealthChecks();
  const [expandedHealthCheck, setExpandedHealthCheck] = useState<string | null>(null);

  const getSeverityColor = (severity: string | undefined) => {
    switch (severity?.toLowerCase()) {
      case "mild":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "severe":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  const toggleHealthCheck = (id: string) => {
    setExpandedHealthCheck(expandedHealthCheck === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-medical-neutral-darkest">Health Check History</h1>
        <Button onClick={() => navigate('/health-check')}>
          New Health Check
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : healthChecks.length === 0 ? (
        <Card className="w-full text-center p-8">
          <CardHeader>
            <CardTitle>No Health Checks Found</CardTitle>
            <CardDescription>
              You haven't completed any health checks yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="mt-4" onClick={() => navigate('/health-check')}>
              Complete Your First Health Check
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {healthChecks.map((healthCheck) => (
            <Card key={healthCheck.id} className="w-full">
              <CardHeader className="cursor-pointer" onClick={() => healthCheck.id && toggleHealthCheck(healthCheck.id)}>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{formatDate(healthCheck.created_at)}</CardTitle>
                    <CardDescription>
                      {healthCheck.symptoms && healthCheck.symptoms.length > 0 
                        ? `${healthCheck.symptoms.length} symptom${healthCheck.symptoms.length > 1 ? 's' : ''} reported`
                        : 'No symptoms reported'}
                    </CardDescription>
                  </div>
                  {healthCheck.severity && (
                    <Badge className={getSeverityColor(healthCheck.severity)}>
                      {healthCheck.severity}
                    </Badge>
                  )}
                  {expandedHealthCheck === healthCheck.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </CardHeader>
              
              {expandedHealthCheck === healthCheck.id && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {healthCheck.symptoms && healthCheck.symptoms.length > 0 && (
                      <div>
                        <h3 className="font-medium text-sm text-gray-500">Symptoms:</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {healthCheck.symptoms.map((symptom, idx) => (
                            <Badge key={idx} variant="outline">{symptom}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {healthCheck.duration && (
                      <div>
                        <h3 className="font-medium text-sm text-gray-500">Duration:</h3>
                        <p className="mt-1">{healthCheck.duration}</p>
                      </div>
                    )}

                    {healthCheck.previous_conditions && healthCheck.previous_conditions.length > 0 && (
                      <div>
                        <h3 className="font-medium text-sm text-gray-500">Previous Conditions:</h3>
                        <p className="mt-1">{healthCheck.previous_conditions.join(", ")}</p>
                      </div>
                    )}

                    {healthCheck.medications && healthCheck.medications.length > 0 && (
                      <div>
                        <h3 className="font-medium text-sm text-gray-500">Medications:</h3>
                        <p className="mt-1">{healthCheck.medications.join(", ")}</p>
                      </div>
                    )}

                    {healthCheck.notes && (
                      <div>
                        <h3 className="font-medium text-sm text-gray-500">Notes:</h3>
                        <p className="mt-1">{healthCheck.notes}</p>
                      </div>
                    )}

                    {/* Display analysis results if available */}
                    {healthCheck.analysis_results && healthCheck.analysis_results.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h3 className="font-semibold text-lg mb-3">Analysis Results</h3>
                        <Accordion type="single" collapsible className="w-full">
                          {healthCheck.analysis_results.map((condition: AnalysisCondition, idx: number) => (
                            <AccordionItem key={idx} value={`item-${idx}`}>
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
                      </div>
                    )}

                    {!healthCheck.analysis_results || healthCheck.analysis_results.length === 0 && (
                      <div className="flex items-center gap-2 text-amber-600 mt-4">
                        <AlertCircle size={18} />
                        <span>No analysis results available for this health check</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthCheckHistory;
