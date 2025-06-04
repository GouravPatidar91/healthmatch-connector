import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2, Download, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResult {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  urgencyLevel: string;
  language: string;
  detailedAnalysis?: {
    vitalSigns?: string[];
    labResults?: string[];
    diagnosticTests?: string[];
    medications?: string[];
    clinicalImpression?: string;
    followUpRequired?: string[];
  };
}

const MedicalReports = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('simple-english');
  const [languageSearch, setLanguageSearch] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
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

  const filteredLanguages = supportedLanguages.filter(lang =>
    lang.label.toLowerCase().includes(languageSearch.toLowerCase()) ||
    lang.category.toLowerCase().includes(languageSearch.toLowerCase())
  );

  const groupedLanguages = filteredLanguages.reduce((groups, lang) => {
    if (!groups[lang.category]) {
      groups[lang.category] = [];
    }
    groups[lang.category].push(lang);
    return groups;
  }, {} as Record<string, typeof supportedLanguages>);

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

${analysisResult.detailedAnalysis ? `
DETAILED ANALYSIS:

${analysisResult.detailedAnalysis.vitalSigns ? `
VITAL SIGNS:
${analysisResult.detailedAnalysis.vitalSigns.map((sign, index) => `${index + 1}. ${sign}`).join('\n')}
` : ''}

${analysisResult.detailedAnalysis.labResults ? `
LABORATORY RESULTS:
${analysisResult.detailedAnalysis.labResults.map((result, index) => `${index + 1}. ${result}`).join('\n')}
` : ''}

${analysisResult.detailedAnalysis.diagnosticTests ? `
DIAGNOSTIC TESTS:
${analysisResult.detailedAnalysis.diagnosticTests.map((test, index) => `${index + 1}. ${test}`).join('\n')}
` : ''}

${analysisResult.detailedAnalysis.medications ? `
MEDICATIONS:
${analysisResult.detailedAnalysis.medications.map((med, index) => `${index + 1}. ${med}`).join('\n')}
` : ''}

${analysisResult.detailedAnalysis.clinicalImpression ? `
CLINICAL IMPRESSION:
${analysisResult.detailedAnalysis.clinicalImpression}
` : ''}

${analysisResult.detailedAnalysis.followUpRequired ? `
FOLLOW-UP REQUIRED:
${analysisResult.detailedAnalysis.followUpRequired.map((followUp, index) => `${index + 1}. ${followUp}`).join('\n')}
` : ''}
` : ''}

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
          Upload your medical reports and get AI-powered comprehensive analysis in your preferred language
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
              <div className="relative mt-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search languages..."
                    value={languageSearch}
                    onChange={(e) => setLanguageSearch(e.target.value)}
                    className="pl-10 mb-2"
                  />
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {Object.entries(groupedLanguages).map(([category, languages]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                          {category}
                        </div>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <CardTitle>Comprehensive Analysis Results</CardTitle>
                <Button variant="outline" size="sm" onClick={downloadSummary}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Summary
                </Button>
              </div>
              <CardDescription>
                Detailed analysis completed in {analysisResult.language}
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

              {/* Detailed Analysis Sections */}
              {analysisResult.detailedAnalysis && (
                <>
                  {analysisResult.detailedAnalysis.vitalSigns && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Vital Signs</Label>
                      <div className="mt-1 space-y-2">
                        {analysisResult.detailedAnalysis.vitalSigns.map((sign, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                              {index + 1}
                            </span>
                            <p className="text-sm text-gray-700">{sign}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.detailedAnalysis.labResults && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Laboratory Results</Label>
                      <div className="mt-1 space-y-2">
                        {analysisResult.detailedAnalysis.labResults.map((result, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                              {index + 1}
                            </span>
                            <p className="text-sm text-gray-700">{result}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.detailedAnalysis.diagnosticTests && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Diagnostic Tests</Label>
                      <div className="mt-1 space-y-2">
                        {analysisResult.detailedAnalysis.diagnosticTests.map((test, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="bg-cyan-100 text-cyan-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                              {index + 1}
                            </span>
                            <p className="text-sm text-gray-700">{test}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.detailedAnalysis.medications && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Medications</Label>
                      <div className="mt-1 space-y-2">
                        {analysisResult.detailedAnalysis.medications.map((medication, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                              {index + 1}
                            </span>
                            <p className="text-sm text-gray-700">{medication}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.detailedAnalysis.clinicalImpression && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Clinical Impression</Label>
                      <Textarea
                        value={analysisResult.detailedAnalysis.clinicalImpression}
                        readOnly
                        className="mt-1 min-h-[80px]"
                      />
                    </div>
                  )}

                  {analysisResult.detailedAnalysis.followUpRequired && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Follow-up Required</Label>
                      <div className="mt-1 space-y-2">
                        {analysisResult.detailedAnalysis.followUpRequired.map((followUp, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                              {index + 1}
                            </span>
                            <p className="text-sm text-gray-700">{followUp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

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
