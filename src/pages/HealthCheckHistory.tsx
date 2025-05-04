
import React from "react";
import { useUserHealthChecks } from "@/services/userDataService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const HealthCheckHistory = () => {
  const { healthChecks, loading } = useUserHealthChecks();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-medical-blue" />
        <span className="ml-2">Loading health check history...</span>
      </div>
    );
  }

  if (!healthChecks || healthChecks.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-medical-neutral-darkest">Health Check History</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-32 text-medical-neutral-dark">
              <p>You haven't completed any health checks yet.</p>
              <p className="mt-2">Take your first health check to monitor your health!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-medical-neutral-darkest">Health Check History</h1>
      <p className="text-medical-neutral-dark">
        Review your past health checks and their recommendations
      </p>

      {healthChecks.map((check) => (
        <Card key={check.id} className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <CardTitle className="text-xl">Health Check</CardTitle>
                <CardDescription>
                  {check.created_at ? format(new Date(check.created_at), 'PPPP') : 'Unknown date'} at {
                    check.created_at ? format(new Date(check.created_at), 'h:mm a') : 'Unknown time'
                  }
                </CardDescription>
              </div>
              {check.severity && (
                <Badge className={`${
                  check.severity === 'severe' ? 'bg-red-600' : 
                  check.severity === 'moderate' ? 'bg-amber-500' : 
                  'bg-green-600'
                }`}>
                  {check.severity.charAt(0).toUpperCase() + check.severity.slice(1)} Symptoms
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Reported Symptoms</h3>
                <div className="flex flex-wrap gap-2">
                  {check.symptoms && check.symptoms.length > 0 ? (
                    check.symptoms.map((symptom, index) => (
                      <Badge key={index} variant="outline" className="bg-medical-neutral-lightest">
                        {symptom}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-medical-neutral-dark">No symptoms reported</span>
                  )}
                </div>
              </div>

              {check.duration && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Duration</h3>
                  <p className="text-medical-neutral-dark">{check.duration}</p>
                </div>
              )}

              {check.previous_conditions && check.previous_conditions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Previous Conditions</h3>
                  <div className="flex flex-wrap gap-2">
                    {check.previous_conditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="bg-medical-neutral-lightest">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {check.medications && check.medications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Current Medications</h3>
                  <div className="flex flex-wrap gap-2">
                    {check.medications.map((medication, index) => (
                      <Badge key={index} variant="outline" className="bg-medical-neutral-lightest">
                        {medication}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {check.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                  <p className="text-medical-neutral-dark whitespace-pre-line">{check.notes}</p>
                </div>
              )}

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details">
                  <AccordionTrigger>View Analysis Results</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Possible Condition</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* This is just a placeholder - actual data would need to be stored in the health_checks table */}
                        <TableRow>
                          <TableCell className="font-medium">Analysis not available</TableCell>
                          <TableCell>Detailed analysis results are not stored in your health check history.</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="recommendations">
                  <AccordionTrigger>Recommendations</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Consult with a healthcare professional for a proper diagnosis.</li>
                      <li>Keep track of any changes in your symptoms.</li>
                      <li>Stay hydrated and get adequate rest.</li>
                      <li>
                        If symptoms worsen, seek immediate medical attention.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HealthCheckHistory;
