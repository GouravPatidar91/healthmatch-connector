
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResult {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  urgencyLevel: string;
  language: string;
}

const MedicalReports = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('simple-english');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const supportedLanguages = [
    { value: 'simple-english', label: 'Simple English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'portuguese', label: 'Portuguese' },
    { value: 'russian', label: 'Russian' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, JPEG, or PNG file.",
          variant: "destructive"
        });
        return;
      }

      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const analyzeReport = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a medical report to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Convert file to base64
      const base64File = await convertFileToBase64(file);
      
      console.log('Analyzing medical report:', file.name);
      
      const { data, error } = await supabase.functions.invoke('analyze-medical-report', {
        body: {
          file: base64File,
          fileName: file.name,
          fileType: file.type,
          language: language
        }
      });

      if (error) {
        throw error;
      }

      console.log('Analysis result:', data);
      setAnalysisResult(data);
      
      toast({
        title: "Analysis Complete",
        description: "Your medical report has been analyzed successfully."
      });
      
    } catch (error) {
      console.error('Error analyzing medical report:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the medical report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadSummary = () => {
    if (!analysisResult) return;

    const content = `
Medical Report Analysis Summary

Language: ${analysisResult.language}
Urgency Level: ${analysisResult.urgencyLevel}

SUMMARY:
${analysisResult.summary}

KEY FINDINGS:
${analysisResult.keyFindings.map((finding, index) => `${index + 1}. ${finding}`).join('\n')}

RECOMMENDATIONS:
${analysisResult.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-report-summary-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Report Analysis</h1>
        <p className="text-gray-600">
          Upload your medical reports and get AI-powered summaries in simple language
        </p>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Medical Report
            </CardTitle>
            <CardDescription>
              Supported formats: PDF, JPEG, PNG (Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="report-file">Select Medical Report</Label>
              <Input
                id="report-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="mt-1"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="language">Preferred Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={analyzeReport}
              disabled={!file || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Report...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Analyze Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {analysisResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Analysis Results</CardTitle>
                <Button variant="outline" size="sm" onClick={downloadSummary}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Summary
                </Button>
              </div>
              <CardDescription>
                Analysis completed in {analysisResult.language}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Urgency Level */}
              <div>
                <Label className="text-sm font-semibold text-gray-700">Urgency Level</Label>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                  analysisResult.urgencyLevel === 'High' ? 'bg-red-100 text-red-800' :
                  analysisResult.urgencyLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {analysisResult.urgencyLevel}
                </div>
              </div>

              {/* Summary */}
              <div>
                <Label className="text-sm font-semibold text-gray-700">Summary</Label>
                <Textarea
                  value={analysisResult.summary}
                  readOnly
                  className="mt-1 min-h-[100px]"
                />
              </div>

              {/* Key Findings */}
              <div>
                <Label className="text-sm font-semibold text-gray-700">Key Findings</Label>
                <div className="mt-1 space-y-2">
                  {analysisResult.keyFindings.map((finding, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-700">{finding}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <Label className="text-sm font-semibold text-gray-700">Recommendations</Label>
                <div className="mt-1 space-y-2">
                  {analysisResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MedicalReports;
