
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, Download, Stethoscope, Pill, Calendar, ClipboardCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ComprehensiveAnalysisResult {
  summaryOfFindings: {
    diagnosis: string;
    normalAbnormalValues: string[];
    severityOrStage: string;
  };
  interpretationOfResults: {
    significantResults: Array<{
      parameter: string;
      value: string;
      normalRange: string;
      interpretation: string;
      clinicalSignificance: string;
    }>;
    overallInterpretation: string;
  };
  treatmentPlan: {
    medicationsPrescribed: Array<{
      name: string;
      dosage: string;
      duration: string;
      purpose: string;
    }>;
    therapiesRecommended: string[];
    lifestyleChanges: {
      diet: string;
      exercise: string;
      sleep: string;
      other: string;
    };
    preventiveMeasures: string[];
  };
  nextSteps: {
    additionalTestsRequired: Array<{
      testName: string;
      reason: string;
      urgency: string;
    }>;
    specialistReferral: {
      required: boolean;
      specialistType: string;
      reason: string;
    };
    followUpAppointments: Array<{
      timeframe: string;
      purpose: string;
    }>;
  };
  documentationProvided: {
    reportType: string;
    keyDocuments: string[];
    additionalNotes: string;
  };
  urgencyLevel: string;
  language: string;
  disclaimer: string;
}

const MedicalReports = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('simple-english');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ComprehensiveAnalysisResult | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const supportedLanguages = [
    // Simple English
    { value: 'simple-english', label: 'Simple English', category: 'English' },
    
    // Indian Regional Languages
    { value: 'hindi', label: 'हिंदी (Hindi)', category: 'Indian Languages' },
    { value: 'bengali', label: 'বাংলা (Bengali)', category: 'Indian Languages' },
    { value: 'telugu', label: 'తెలుగు (Telugu)', category: 'Indian Languages' },
    { value: 'marathi', label: 'मराठी (Marathi)', category: 'Indian Languages' },
    { value: 'tamil', label: 'தமிழ் (Tamil)', category: 'Indian Languages' },
    { value: 'gujarati', label: 'ગુજરાતી (Gujarati)', category: 'Indian Languages' },
    { value: 'urdu', label: 'اردو (Urdu)', category: 'Indian Languages' },
    { value: 'kannada', label: 'ಕನ್ನಡ (Kannada)', category: 'Indian Languages' },
    { value: 'odia', label: 'ଓଡ଼ିଆ (Odia)', category: 'Indian Languages' },
    { value: 'punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', category: 'Indian Languages' },
    { value: 'malayalam', label: 'മലയാളം (Malayalam)', category: 'Indian Languages' },
    { value: 'assamese', label: 'অসমীয়া (Assamese)', category: 'Indian Languages' },
    { value: 'maithili', label: 'मैथिली (Maithili)', category: 'Indian Languages' },
    { value: 'santali', label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)', category: 'Indian Languages' },
    { value: 'kashmiri', label: 'कॉशुर (Kashmiri)', category: 'Indian Languages' },
    { value: 'nepali', label: 'नेपाली (Nepali)', category: 'Indian Languages' },
    { value: 'konkani', label: 'कोंकणी (Konkani)', category: 'Indian Languages' },
    { value: 'sindhi', label: 'سنڌي (Sindhi)', category: 'Indian Languages' },
    { value: 'manipuri', label: 'মৈতৈলোন্ (Manipuri)', category: 'Indian Languages' },
    { value: 'bodo', label: 'बर\' (Bodo)', category: 'Indian Languages' },
    { value: 'dogri', label: 'डोगरी (Dogri)', category: 'Indian Languages' },
    
    // Continental Languages
    { value: 'spanish', label: 'Español (Spanish)', category: 'European Languages' },
    { value: 'french', label: 'Français (French)', category: 'European Languages' },
    { value: 'german', label: 'Deutsch (German)', category: 'European Languages' },
    { value: 'italian', label: 'Italiano (Italian)', category: 'European Languages' },
    { value: 'portuguese', label: 'Português (Portuguese)', category: 'European Languages' },
    { value: 'russian', label: 'Русский (Russian)', category: 'European Languages' },
    { value: 'dutch', label: 'Nederlands (Dutch)', category: 'European Languages' },
    { value: 'polish', label: 'Polski (Polish)', category: 'European Languages' },
    
    // Asian Languages
    { value: 'chinese', label: '中文 (Chinese)', category: 'Asian Languages' },
    { value: 'japanese', label: '日本語 (Japanese)', category: 'Asian Languages' },
    { value: 'korean', label: '한국어 (Korean)', category: 'Asian Languages' },
    { value: 'thai', label: 'ไทย (Thai)', category: 'Asian Languages' },
    { value: 'vietnamese', label: 'Tiếng Việt (Vietnamese)', category: 'Asian Languages' },
    { value: 'indonesian', label: 'Bahasa Indonesia', category: 'Asian Languages' },
    { value: 'malay', label: 'Bahasa Melayu (Malay)', category: 'Asian Languages' },
    
    // Middle Eastern & African Languages
    { value: 'arabic', label: 'العربية (Arabic)', category: 'Middle Eastern Languages' },
    { value: 'persian', label: 'فارسی (Persian)', category: 'Middle Eastern Languages' },
    { value: 'turkish', label: 'Türkçe (Turkish)', category: 'Middle Eastern Languages' },
    { value: 'hebrew', label: 'עברית (Hebrew)', category: 'Middle Eastern Languages' },
    { value: 'swahili', label: 'Kiswahili (Swahili)', category: 'African Languages' },
    { value: 'amharic', label: 'አማርኛ (Amharic)', category: 'African Languages' },
    
    // Other Continental Languages
    { value: 'greek', label: 'Ελληνικά (Greek)', category: 'European Languages' },
    { value: 'swedish', label: 'Svenska (Swedish)', category: 'European Languages' },
    { value: 'norwegian', label: 'Norsk (Norwegian)', category: 'European Languages' },
    { value: 'danish', label: 'Dansk (Danish)', category: 'European Languages' },
    { value: 'finnish', label: 'Suomi (Finnish)', category: 'European Languages' },
  ];

  const groupedLanguages = supportedLanguages.reduce((groups, lang) => {
    if (!groups[lang.category]) {
      groups[lang.category] = [];
    }
    groups[lang.category].push(lang);
    return groups;
  }, {} as Record<string, typeof supportedLanguages>);

  const selectedLanguageLabel = supportedLanguages.find(lang => lang.value === language)?.label || 'Select language';

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
      
      console.log('Analyzing medical report:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const { data, error } = await supabase.functions.invoke('analyze-medical-report', {
        body: {
          file: base64File,
          fileName: file.name,
          fileType: file.type,
          language: language
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to analyze the medical report. Please try again.";
        
        if (error.message?.includes('API key')) {
          errorMessage = "AI service configuration issue. Please contact support.";
        } else if (error.message?.includes('rate limit')) {
          errorMessage = "Service temporarily busy. Please try again in a few minutes.";
        } else if (error.message?.includes('file format')) {
          errorMessage = "Unsupported file format. Please upload a PDF, JPEG, or PNG file.";
        }
        
        toast({
          title: "Analysis Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        console.error('No data received from analysis function');
        toast({
          title: "Analysis Failed",
          description: "No response received from analysis service. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('Analysis result received:', data);
      setAnalysisResult(data);
      
      toast({
        title: "Analysis Complete",
        description: "Your medical report has been analyzed successfully."
      });
      
    } catch (error) {
      console.error('Error analyzing medical report:', error);
      
      let errorMessage = "Failed to analyze the medical report. Please try again.";
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Analysis timed out. Please try with a smaller file or try again later.";
        }
      }
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadComprehensiveReport = () => {
    if (!analysisResult) return;

    const content = `
COMPREHENSIVE MEDICAL REPORT ANALYSIS

Generated on: ${new Date().toLocaleDateString()}
Language: ${analysisResult.language}
Urgency Level: ${analysisResult.urgencyLevel}

🩺 SUMMARY OF FINDINGS
=====================

Diagnosis: ${analysisResult.summaryOfFindings?.diagnosis || 'Not specified'}
Severity/Stage: ${analysisResult.summaryOfFindings?.severityOrStage || 'Not specified'}

Normal/Abnormal Values:
${(analysisResult.summaryOfFindings?.normalAbnormalValues || []).map((value, index) => `${index + 1}. ${value}`).join('\n')}

📊 INTERPRETATION OF RESULTS
===========================

Overall Interpretation:
${analysisResult.interpretationOfResults?.overallInterpretation || 'Not available'}

Significant Results:
${(analysisResult.interpretationOfResults?.significantResults || []).map((result, index) => `
${index + 1}. ${result.parameter}
   Value: ${result.value}
   Normal Range: ${result.normalRange}
   Interpretation: ${result.interpretation}
   Clinical Significance: ${result.clinicalSignificance}
`).join('\n')}

💊 TREATMENT PLAN
================

Medications Prescribed:
${(analysisResult.treatmentPlan?.medicationsPrescribed || []).length > 0 
  ? (analysisResult.treatmentPlan?.medicationsPrescribed || []).map((med, index) => `
${index + 1}. ${med.name}
   Dosage: ${med.dosage}
   Duration: ${med.duration}
   Purpose: ${med.purpose}
`).join('\n')
  : 'No medications prescribed or mentioned in the report.'}

Therapies Recommended:
${(analysisResult.treatmentPlan?.therapiesRecommended || []).map((therapy, index) => `${index + 1}. ${therapy}`).join('\n')}

Lifestyle Changes:
- Diet: ${analysisResult.treatmentPlan?.lifestyleChanges?.diet || 'Not specified'}
- Exercise: ${analysisResult.treatmentPlan?.lifestyleChanges?.exercise || 'Not specified'}
- Sleep: ${analysisResult.treatmentPlan?.lifestyleChanges?.sleep || 'Not specified'}
- Other: ${analysisResult.treatmentPlan?.lifestyleChanges?.other || 'Not specified'}

Preventive Measures:
${(analysisResult.treatmentPlan?.preventiveMeasures || []).map((measure, index) => `${index + 1}. ${measure}`).join('\n')}

🧭 NEXT STEPS / FOLLOW-UP
========================

Additional Tests Required:
${(analysisResult.nextSteps?.additionalTestsRequired || []).length > 0 
  ? (analysisResult.nextSteps?.additionalTestsRequired || []).map((test, index) => `
${index + 1}. ${test.testName}
   Reason: ${test.reason}
   Urgency: ${test.urgency}
`).join('\n')
  : 'No additional tests mentioned.'}

Specialist Referral:
${analysisResult.nextSteps?.specialistReferral?.required 
  ? `Required: ${analysisResult.nextSteps.specialistReferral.specialistType}
  Reason: ${analysisResult.nextSteps.specialistReferral.reason}`
  : 'No specialist referral required at this time.'}

Follow-up Appointments:
${(analysisResult.nextSteps?.followUpAppointments || []).map((appointment, index) => `
${index + 1}. Timeframe: ${appointment.timeframe}
   Purpose: ${appointment.purpose}
`).join('\n')}

📁 DOCUMENTATION PROVIDED
========================

Report Type: ${analysisResult.documentationProvided?.reportType || 'Not specified'}

Key Documents:
${(analysisResult.documentationProvided?.keyDocuments || []).map((doc, index) => `${index + 1}. ${doc}`).join('\n')}

Additional Notes: ${analysisResult.documentationProvided?.additionalNotes || 'None'}

⚠️ DISCLAIMER
=============
${analysisResult.disclaimer || 'This analysis is AI-generated and should be reviewed by a qualified healthcare professional'}

This comprehensive analysis was generated on ${new Date().toLocaleString()}.
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprehensive-medical-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mobile-safe-container mx-auto py-4 sm:py-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Comprehensive Medical Report Analysis</h1>
        <p className="mobile-responsive-text text-gray-600">
          Upload your medical reports and get AI-powered deep analysis in your preferred language
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              Upload Medical Report
            </CardTitle>
            <CardDescription className="mobile-responsive-text">
              Supported formats: PDF, JPEG, PNG (Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div>
              <Label htmlFor="report-file" className="text-sm sm:text-base">Select Medical Report</Label>
              <Input
                id="report-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="mt-1 text-sm sm:text-base"
              />
              {file && (
                <p className="text-xs sm:text-sm text-gray-600 mt-2 break-all">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="language" className="text-sm sm:text-base">Preferred Language</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between mt-1 text-sm sm:text-base"
                  >
                    <span className="truncate">{selectedLanguageLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 z-50 bg-white" align="start">
                  <Command>
                    <CommandInput placeholder="Search languages..." className="text-sm" />
                    <CommandList className="max-h-60 sm:max-h-80">
                      <CommandEmpty>No language found.</CommandEmpty>
                      {Object.entries(groupedLanguages).map(([category, languages]) => (
                        <CommandGroup key={category} heading={category}>
                          {languages.map((lang) => (
                            <CommandItem
                              key={lang.value}
                              value={lang.label}
                              onSelect={() => {
                                setLanguage(lang.value);
                                setOpen(false);
                              }}
                              className="text-sm"
                            >
                              {lang.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={analyzeReport}
              disabled={!file || isAnalyzing}
              className="w-full text-sm sm:text-base"
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

        {/* Comprehensive Results Section */}
        {analysisResult && (
          <>
            {/* Header Card with Urgency */}
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
                    Comprehensive Medical Analysis
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Badge className={`${
                      analysisResult.urgencyLevel === 'High' ? 'bg-red-100 text-red-800' :
                      analysisResult.urgencyLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    } text-xs sm:text-sm`}>
                      {analysisResult.urgencyLevel} Urgency
                    </Badge>
                    <Button variant="outline" size="sm" onClick={downloadComprehensiveReport} className="text-xs sm:text-sm">
                      <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Download Report
                    </Button>
                  </div>
                </div>
                <CardDescription className="mobile-responsive-text">
                  Language: {analysisResult.language} | Analysis completed on {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Detailed Analysis Sections */}
            <div className="grid gap-4 sm:gap-6">
              <Accordion type="multiple" className="w-full space-y-3 sm:space-y-4">
                
                {/* 1. Summary of Findings */}
                <AccordionItem value="summary" className="border rounded-lg px-3 sm:px-4">
                  <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                        <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base sm:text-lg">1. Summary of Findings</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Diagnosis, abnormal values, and severity assessment</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                    <div className="grid gap-3 sm:gap-4">
                      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">Diagnosis</h4>
                        <p className="mobile-responsive-text text-blue-700">{analysisResult.summaryOfFindings?.diagnosis || 'No diagnosis provided'}</p>
                      </div>
                      
                      {analysisResult.summaryOfFindings?.severityOrStage && (
                        <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                          <h4 className="font-medium text-orange-800 mb-2 text-sm sm:text-base">Severity/Stage</h4>
                          <p className="mobile-responsive-text text-orange-700">{analysisResult.summaryOfFindings.severityOrStage}</p>
                        </div>
                      )}
                      
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">Normal/Abnormal Values</h4>
                        <div className="space-y-2">
                          {(analysisResult.summaryOfFindings?.normalAbnormalValues || []).map((value, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded min-w-[20px] sm:min-w-[24px] text-center">
                                {index + 1}
                              </span>
                              <p className="mobile-responsive-text text-gray-700">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. Interpretation of Results */}
                <AccordionItem value="interpretation" className="border rounded-lg px-3 sm:px-4">
                  <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base sm:text-lg">2. Interpretation of Results</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Detailed explanation of findings and clinical significance</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2 text-sm sm:text-base">Overall Interpretation</h4>
                      <p className="mobile-responsive-text text-green-700">{analysisResult.interpretationOfResults?.overallInterpretation || 'No overall interpretation available'}</p>
                    </div>
                    
                    {(analysisResult.interpretationOfResults?.significantResults || []).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-800 text-sm sm:text-base">Significant Results</h4>
                        {(analysisResult.interpretationOfResults?.significantResults || []).map((result, index) => (
                          <Card key={index} className="border-l-4 border-l-green-500">
                            <CardContent className="p-3 sm:p-4">
                              <h5 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{result.parameter}</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                <div>
                                  <span className="font-medium text-gray-600">Value: </span>
                                  <span className="text-gray-800">{result.value}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Normal Range: </span>
                                  <span className="text-gray-800">{result.normalRange}</span>
                                </div>
                              </div>
                              <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                <div>
                                  <span className="font-medium text-gray-600">Interpretation: </span>
                                  <span className="text-gray-800">{result.interpretation}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Clinical Significance: </span>
                                  <span className="text-gray-800">{result.clinicalSignificance}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Treatment Plan */}
                <AccordionItem value="treatment" className="border rounded-lg px-3 sm:px-4">
                  <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-purple-100 p-1.5 sm:p-2 rounded-lg">
                        <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base sm:text-lg">3. Treatment Plan</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Medications, therapies, and lifestyle recommendations</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                    {/* Medications */}
                    {(analysisResult.treatmentPlan?.medicationsPrescribed || []).length > 0 && (
                      <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-3 text-sm sm:text-base">Medications Prescribed</h4>
                        <div className="space-y-3">
                          {(analysisResult.treatmentPlan?.medicationsPrescribed || []).map((med, index) => (
                            <div key={index} className="bg-white p-2 sm:p-3 rounded border text-xs sm:text-sm">
                              <h5 className="font-medium text-gray-900">{med.name}</h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1 sm:mt-2">
                                <div><span className="font-medium">Dosage:</span> {med.dosage}</div>
                                <div><span className="font-medium">Duration:</span> {med.duration}</div>
                                <div><span className="font-medium">Purpose:</span> {med.purpose}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Therapies */}
                    {(analysisResult.treatmentPlan?.therapiesRecommended || []).length > 0 && (
                      <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-indigo-800 mb-2 text-sm sm:text-base">Therapies Recommended</h4>
                        <div className="space-y-2">
                          {(analysisResult.treatmentPlan?.therapiesRecommended || []).map((therapy, index) => (
                            <div key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                              <span className="bg-indigo-200 text-indigo-800 font-medium px-2 py-1 rounded min-w-[20px] sm:min-w-[24px] text-center">
                                {index + 1}
                              </span>
                              <p className="text-indigo-700">{therapy}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lifestyle Changes */}
                    {analysisResult.treatmentPlan?.lifestyleChanges && (
                      <div className="bg-teal-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-teal-800 mb-3 text-sm sm:text-base">Lifestyle Changes</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <h5 className="font-medium text-teal-700 mb-1 text-xs sm:text-sm">Diet</h5>
                            <p className="text-teal-600 text-xs sm:text-sm">{analysisResult.treatmentPlan.lifestyleChanges.diet || 'Not specified'}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-teal-700 mb-1 text-xs sm:text-sm">Exercise</h5>
                            <p className="text-teal-600 text-xs sm:text-sm">{analysisResult.treatmentPlan.lifestyleChanges.exercise || 'Not specified'}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-teal-700 mb-1 text-xs sm:text-sm">Sleep</h5>
                            <p className="text-teal-600 text-xs sm:text-sm">{analysisResult.treatmentPlan.lifestyleChanges.sleep || 'Not specified'}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-teal-700 mb-1 text-xs sm:text-sm">Other</h5>
                            <p className="text-teal-600 text-xs sm:text-sm">{analysisResult.treatmentPlan.lifestyleChanges.other || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preventive Measures */}
                    {(analysisResult.treatmentPlan?.preventiveMeasures || []).length > 0 && (
                      <div className="bg-cyan-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-cyan-800 mb-2 text-sm sm:text-base">Preventive Measures</h4>
                        <div className="space-y-2">
                          {(analysisResult.treatmentPlan?.preventiveMeasures || []).map((measure, index) => (
                            <div key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                              <span className="bg-cyan-200 text-cyan-800 font-medium px-2 py-1 rounded min-w-[20px] sm:min-w-[24px] text-center">
                                {index + 1}
                              </span>
                              <p className="text-cyan-700">{measure}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* 4. Next Steps */}
                <AccordionItem value="nextsteps" className="border rounded-lg px-3 sm:px-4">
                  <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-orange-100 p-1.5 sm:p-2 rounded-lg">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base sm:text-lg">4. Next Steps / Follow-Up</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Additional tests, referrals, and follow-up appointments</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                    {/* Additional Tests */}
                    {(analysisResult.nextSteps?.additionalTestsRequired || []).length > 0 && (
                      <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-3 text-sm sm:text-base">Additional Tests Required</h4>
                        <div className="space-y-3">
                          {(analysisResult.nextSteps?.additionalTestsRequired || []).map((test, index) => (
                            <div key={index} className="bg-white p-2 sm:p-3 rounded border text-xs sm:text-sm">
                              <h5 className="font-medium text-gray-900">{test.testName}</h5>
                              <div className="mt-1 sm:mt-2 space-y-1">
                                <div><span className="font-medium">Reason:</span> {test.reason}</div>
                                <div><span className="font-medium">Urgency:</span> {test.urgency}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specialist Referral */}
                    {analysisResult.nextSteps?.specialistReferral?.required && (
                      <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2 text-sm sm:text-base">Specialist Referral Required</h4>
                        <div className="space-y-1 text-xs sm:text-sm text-yellow-700">
                          <div><span className="font-medium">Specialist Type:</span> {analysisResult.nextSteps.specialistReferral.specialistType || 'Not specified'}</div>
                          <div><span className="font-medium">Reason:</span> {analysisResult.nextSteps.specialistReferral.reason || 'Not specified'}</div>
                        </div>
                      </div>
                    )}

                    {/* Follow-up Appointments */}
                    {(analysisResult.nextSteps?.followUpAppointments || []).length > 0 && (
                      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-3 text-sm sm:text-base">Follow-up Appointments</h4>
                        <div className="space-y-2">
                          {(analysisResult.nextSteps?.followUpAppointments || []).map((appointment, index) => (
                            <div key={index} className="bg-white p-2 sm:p-3 rounded border text-xs sm:text-sm">
                              <div className="space-y-1">
                                <div><span className="font-medium">Timeframe:</span> {appointment.timeframe}</div>
                                <div><span className="font-medium">Purpose:</span> {appointment.purpose}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* 5. Documentation */}
                <AccordionItem value="documentation" className="border rounded-lg px-3 sm:px-4">
                  <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-gray-100 p-1.5 sm:p-2 rounded-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base sm:text-lg">5. Documentation Provided</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Report details and additional notes</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3 text-xs sm:text-sm">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">Report Type</h4>
                        <p className="text-gray-700">{analysisResult.documentationProvided?.reportType || 'Not specified'}</p>
                      </div>
                      
                      {(analysisResult.documentationProvided?.keyDocuments || []).length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">Key Documents</h4>
                          <div className="space-y-1">
                            {(analysisResult.documentationProvided?.keyDocuments || []).map((doc, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className="bg-gray-200 text-gray-800 font-medium px-2 py-1 rounded min-w-[20px] sm:min-w-[24px] text-center">
                                  {index + 1}
                                </span>
                                <p>{doc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">Additional Notes</h4>
                        <p className="text-gray-700">{analysisResult.documentationProvided?.additionalNotes || 'None'}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Disclaimer */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-amber-800 text-base sm:text-lg">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Important Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="mobile-responsive-text text-amber-700">{analysisResult.disclaimer || 'This analysis is AI-generated and should be reviewed by a qualified healthcare professional'}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default MedicalReports;
