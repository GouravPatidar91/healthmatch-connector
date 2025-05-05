import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUserHealthChecks, AnalysisCondition, SymptomDetail } from '@/services/userDataService';
import { Loader2, Upload, Image, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Symptom categories for selection
const symptomCategories = [
  {
    category: "General",
    symptoms: ["Fever", "Fatigue", "Weight loss", "Weight gain", "Night sweats", "Dizziness"]
  },
  {
    category: "Head",
    symptoms: ["Headache", "Migraine", "Vision problems", "Hearing problems", "Ear pain", "Sore throat", "Runny nose"]
  },
  {
    category: "Eyes",
    symptoms: ["Blurry vision", "Eye redness", "Eye pain", "Dry eyes", "Watery eyes", "Eye discharge", "Light sensitivity", "Double vision", "Eye strain"],
    requiresPhoto: true
  },
  {
    category: "Chest",
    symptoms: ["Chest pain", "Shortness of breath", "Palpitations", "Cough", "Wheezing"]
  },
  {
    category: "Abdomen",
    symptoms: ["Abdominal pain", "Nausea", "Vomiting", "Diarrhea", "Constipation", "Bloating", "Loss of appetite"]
  },
  {
    category: "Musculoskeletal",
    symptoms: ["Joint pain", "Muscle pain", "Back pain", "Stiffness", "Swelling", "Weakness"]
  },
  {
    category: "Skin",
    symptoms: ["Rash", "Itching", "Bruising", "Dryness", "Sores", "Changes in mole"],
    requiresPhoto: true
  },
  {
    category: "Mental Health",
    symptoms: ["Anxiety", "Depression", "Sleep problems", "Mood swings", "Difficulty concentrating"]
  }
];

const severityOptions = ["Mild", "Moderate", "Severe"];
const durationOptions = ["Less than a day", "1-3 days", "4-7 days", "1-2 weeks", "More than 2 weeks"];

// Maximum image size in bytes (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
// Maximum dimensions for image resizing
const MAX_IMAGE_DIMENSION = 1024;

const HealthCheck = () => {
  const navigate = useNavigate();
  const { saveHealthCheck } = useUserHealthChecks();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [previousConditions, setPreviousConditions] = useState<string>("");
  const [medications, setMedications] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisCondition[]>([]);
  const [symptomPhotos, setSymptomPhotos] = useState<{[symptom: string]: string}>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentSymptomForPhoto, setCurrentSymptomForPhoto] = useState<string>("");

  const handleSymptomToggle = (symptom: string, category: string) => {
    const isExternalSymptom = symptomCategories.find(c => c.category === category)?.requiresPhoto;
    
    setSelectedSymptoms((current) => {
      const newSelection = current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom];
        
      // If this is an external symptom that was just selected, prompt for photo
      if (isExternalSymptom && !current.includes(symptom) && newSelection.includes(symptom)) {
        setCurrentSymptomForPhoto(symptom);
        setTimeout(() => {
          if (fileInputRef.current) {
            fileInputRef.current.click();
          }
        }, 100);
      }
      
      // If symptom is being removed, also remove any associated photo
      if (current.includes(symptom) && !newSelection.includes(symptom)) {
        setSymptomPhotos(prev => {
          const updated = { ...prev };
          delete updated[symptom];
          return updated;
        });
      }
      
      return newSelection;
    });
  };

  // Handle image compression before upload
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
              width = MAX_IMAGE_DIMENSION;
            } else {
              width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
              height = MAX_IMAGE_DIMENSION;
            }
          }
          
          // Create a canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw image at new dimensions
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed base64 string (quality 0.8 for JPG)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedBase64);
        };
        
        img.onerror = () => {
          reject(new Error('Error loading image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    
    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    setUploadingPhoto(true);
    
    try {
      // Compress the image before storing
      const compressedBase64 = await compressImage(file);
      
      if (currentSymptomForPhoto) {
        setSymptomPhotos(prev => ({
          ...prev,
          [currentSymptomForPhoto]: compressedBase64
        }));
        
        toast({
          title: "Photo added",
          description: `Photo added for ${currentSymptomForPhoto}`
        });
      }
    } catch (error) {
      console.error("Error processing photo:", error);
      toast({
        title: "Error",
        description: "Failed to process the image",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
      if (event.target) {
        event.target.value = '';  // Reset file input
      }
    }
  };

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      toast({
        title: "No symptoms selected",
        description: "Please select at least one symptom for analysis",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);

    try {
      // Prepare symptom details with photos
      const symptomsWithPhotos = selectedSymptoms.map(symptom => ({
        name: symptom,
        photo: symptomPhotos[symptom] || null
      }));
      
      const response = await supabase.functions.invoke('analyze-symptoms', {
        body: { 
          symptoms: selectedSymptoms,
          severity,
          duration,
          symptomDetails: symptomsWithPhotos
        }
      });

      console.log("Analysis response:", response);

      if (response.data && response.data.conditions) {
        setAnalysisResults(response.data.conditions);
        toast({
          title: "Analysis complete",
          description: `Found ${response.data.conditions.length} potential conditions based on your symptoms.`
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error analyzing symptoms:", error);
      toast({
        title: "Analysis failed",
        description: "Unable to analyze symptoms at this time. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const removePhoto = (symptom: string) => {
    setSymptomPhotos(prev => {
      const updated = { ...prev };
      delete updated[symptom];
      return updated;
    });
    
    toast({
      title: "Photo removed",
      description: `Photo for ${symptom} removed`
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSymptoms.length === 0) {
      toast({
        title: "No symptoms selected",
        description: "Please select at least one symptom",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Parse conditions and medications to arrays
      const previousConditionsArray = previousConditions
        ? previousConditions.split(',').map(item => item.trim())
        : [];
        
      const medicationsArray = medications
        ? medications.split(',').map(item => item.trim())
        : [];
      
      // Save the health check with analysis results
      await saveHealthCheck({
        symptoms: selectedSymptoms,
        severity,
        duration,
        previous_conditions: previousConditionsArray,
        medications: medicationsArray,
        notes,
        analysis_results: analysisResults,
        symptom_photos: symptomPhotos
      });
      
      toast({
        title: "Health check saved",
        description: "Your health information has been saved successfully"
      });
      
      // Navigate to the health check history page
      navigate('/health-check-history');
    } catch (error) {
      console.error("Error saving health check:", error);
      toast({
        title: "Error",
        description: "Failed to save your health check information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if any selected symptoms require photos
  const hasExternalSymptoms = selectedSymptoms.some(symptom => {
    const category = symptomCategories.find(cat => 
      cat.symptoms.includes(symptom) && cat.requiresPhoto
    );
    return category !== undefined;
  });

  // Get all selected symptoms that require photos
  const selectedExternalSymptoms = selectedSymptoms.filter(symptom => {
    const category = symptomCategories.find(cat => 
      cat.symptoms.includes(symptom) && cat.requiresPhoto
    );
    return category !== undefined;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-medical-neutral-darkest">Health Check</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/health-check-history')}
        >
          View History
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Symptoms</CardTitle>
            <CardDescription>Select all symptoms you are experiencing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {symptomCategories.map((category) => (
              <div key={category.category} className="space-y-3">
                <h3 className="font-semibold">
                  {category.category}
                  {category.requiresPhoto && (
                    <span className="ml-2 text-sm text-blue-600 font-normal">
                      (Photo requested for symptoms in this category)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {category.symptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox 
                        id={symptom}
                        checked={selectedSymptoms.includes(symptom)}
                        onCheckedChange={() => handleSymptomToggle(symptom, category.category)}
                      />
                      <Label htmlFor={symptom} className="cursor-pointer">{symptom}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Hidden file input for photo uploading */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/png, image/jpeg"
          className="hidden"
        />
        
        {/* Display area for uploaded symptom photos */}
        {hasExternalSymptoms && (
          <Card>
            <CardHeader>
              <CardTitle>Symptom Photos</CardTitle>
              <CardDescription>
                Photos help provide more accurate analysis for external symptoms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedExternalSymptoms.map(symptom => (
                  <div key={`photo-${symptom}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{symptom}</h4>
                      {!symptomPhotos[symptom] ? (
                        <Button
                          type="button" 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentSymptomForPhoto(symptom);
                            if (fileInputRef.current) fileInputRef.current.click();
                          }}
                          disabled={uploadingPhoto}
                        >
                          {uploadingPhoto && currentSymptomForPhoto === symptom ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-1" />
                          )}
                          Upload Photo
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removePhoto(symptom)}
                        >
                          Remove Photo
                        </Button>
                      )}
                    </div>
                    
                    {symptomPhotos[symptom] && (
                      <div className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden">
                        <img 
                          src={symptomPhotos[symptom]} 
                          alt={`Photo of ${symptom}`} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    
                    {!symptomPhotos[symptom] && (
                      <div 
                        className="w-full aspect-video bg-gray-100 rounded-md flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => {
                          setCurrentSymptomForPhoto(symptom);
                          if (fileInputRef.current) fileInputRef.current.click();
                        }}
                      >
                        <Image className="h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Click to add a photo</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">About symptom photos</p>
                  <p className="mt-1">Photos are stored securely in the database and used only for symptom analysis. 
                  They help provide more accurate assessments for visual conditions like skin and eye issues.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {selectedSymptoms.length > 0 && (
          <Button
            type="button"
            onClick={analyzeSymptoms}
            className="w-full"
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              'Analyze Symptoms'
            )}
          </Button>
        )}
        
        {analysisResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                Possible conditions based on your symptoms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisResults.map((condition, index) => (
                <div 
                  key={index} 
                  className="border p-4 rounded-lg space-y-2"
                >
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{condition.name}</h3>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Match: {condition.matchScore}%
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{condition.description}</p>
                  <div className="text-sm">
                    <h4 className="font-medium text-gray-700">Matched symptoms:</h4>
                    <p className="text-gray-600">
                      {condition.matchedSymptoms.join(", ")}
                    </p>
                  </div>
                  <div className="text-sm">
                    <h4 className="font-medium text-gray-700">Recommendations:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {condition.recommendedActions.map((action, i) => (
                        <li key={i} className="text-gray-600">{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Severity & Duration</CardTitle>
            <CardDescription>How severe are your symptoms and how long have you had them?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Severity</h3>
              <RadioGroup value={severity} onValueChange={setSeverity} className="flex flex-wrap gap-4">
                {severityOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`severity-${option}`} />
                    <Label htmlFor={`severity-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Duration</h3>
              <RadioGroup value={duration} onValueChange={setDuration} className="flex flex-wrap gap-4">
                {durationOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`duration-${option}`} />
                    <Label htmlFor={`duration-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Provide any relevant medical history or notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="previous-conditions">Previous Medical Conditions (comma separated)</Label>
              <Textarea 
                id="previous-conditions" 
                value={previousConditions}
                onChange={(e) => setPreviousConditions(e.target.value)}
                placeholder="e.g., Asthma, Diabetes, Hypertension"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications (comma separated)</Label>
              <Textarea 
                id="medications" 
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="e.g., Aspirin, Insulin, Lisinopril"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other details about your symptoms or condition"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save and Continue'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default HealthCheck;
