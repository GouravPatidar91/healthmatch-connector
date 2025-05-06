
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUserHealthChecks, AnalysisCondition, SymptomDetail } from '@/services/userDataService';
import { Loader2, Upload, Image as ImageIcon, AlertCircle, Camera } from 'lucide-react';
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
    requiresPhoto: true,
    photoImportance: "critical"
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
    requiresPhoto: true,
    photoImportance: "critical"
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
  const [missingCriticalPhotos, setMissingCriticalPhotos] = useState<string[]>([]);

  const handleSymptomToggle = (symptom: string, category: string) => {
    const categoryObj = symptomCategories.find(c => c.category === category);
    const isExternalSymptom = categoryObj?.requiresPhoto;
    
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
        
        // Remove from missing critical photos if it was there
        setMissingCriticalPhotos(prev => 
          prev.filter(s => s !== symptom)
        );
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
        const img = document.createElement('img');
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
        
        // Remove from missing critical photos if it was there
        setMissingCriticalPhotos(prev => 
          prev.filter(s => s !== currentSymptomForPhoto)
        );
        
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

  const checkForMissingCriticalPhotos = (): string[] => {
    // Find all selected symptoms that require photos but don't have them
    const missing: string[] = [];
    
    selectedSymptoms.forEach(symptom => {
      // Find which category this symptom belongs to
      const category = symptomCategories.find(cat => 
        cat.symptoms.includes(symptom) && cat.requiresPhoto && cat.photoImportance === "critical"
      );
      
      // If it's a critical photo symptom but doesn't have a photo
      if (category && !symptomPhotos[symptom]) {
        missing.push(symptom);
      }
    });
    
    return missing;
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

    // Check for missing critical photos
    const missing = checkForMissingCriticalPhotos();
    if (missing.length > 0) {
      setMissingCriticalPhotos(missing);
      toast({
        title: "Missing important photos",
        description: `Please add photos for these symptoms for better analysis: ${missing.join(", ")}`,
        variant: "warning"
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
        
        // Show different toast based on whether visual analysis was included
        if (response.data.visualAnalysisIncluded) {
          toast({
            title: "Visual analysis complete",
            description: `Found ${response.data.conditions.length} potential conditions based on your symptoms and photos.`,
          });
        } else {
          toast({
            title: "Analysis complete",
            description: `Found ${response.data.conditions.length} potential conditions based on your symptoms.`
          });
        }

        // After successful analysis, navigate to the results page with the necessary data
        const healthCheckData = {
          symptoms: selectedSymptoms,
          severity,
          duration,
          previous_conditions: previousConditions ? previousConditions.split(',').map(item => item.trim()) : [],
          medications: medications ? medications.split(',').map(item => item.trim()) : [],
          notes,
          analysis_results: response.data.conditions,
          symptom_photos: symptomPhotos
        };
        
        // Navigate to the results page with the state
        navigate('/health-check-results', { 
          state: { healthCheckData }
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
      setAnalyzing(false);
    }
  };

  const removePhoto = (symptom: string) => {
    setSymptomPhotos(prev => {
      const updated = { ...prev };
      delete updated[symptom];
      return updated;
    });
    
    // If this symptom requires a critical photo, add it to missing list
    const category = symptomCategories.find(cat => 
      cat.symptoms.includes(symptom) && cat.requiresPhoto && cat.photoImportance === "critical"
    );
    
    if (category) {
      setMissingCriticalPhotos(prev => [...prev, symptom]);
    }
    
    toast({
      title: "Photo removed",
      description: `Photo for ${symptom} removed`
    });
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

  // Check if a symptom is missing a critical photo
  const isMissingCriticalPhoto = (symptom: string): boolean => {
    return missingCriticalPhotos.includes(symptom);
  };

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
      
      <form className="space-y-8">
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
                    <span className={`ml-2 text-sm ${category.photoImportance === 'critical' ? 'text-red-600 font-semibold' : 'text-blue-600 font-normal'}`}>
                      {category.photoImportance === 'critical' 
                        ? "(Photo required for analysis)" 
                        : "(Photo requested for symptoms in this category)"}
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
                      <div className="flex items-center">
                        <Label htmlFor={symptom} className="cursor-pointer">{symptom}</Label>
                        {selectedSymptoms.includes(symptom) && category.requiresPhoto && !symptomPhotos[symptom] && (
                          <Camera className={`h-4 w-4 ml-1 ${category.photoImportance === 'critical' ? 'text-red-500' : 'text-blue-500'}`} />
                        )}
                        {selectedSymptoms.includes(symptom) && symptomPhotos[symptom] && (
                          <div className="h-2 w-2 ml-1 bg-green-500 rounded-full" />
                        )}
                      </div>
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
                Photos help provide more accurate analysis for visual symptoms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedExternalSymptoms.map(symptom => {
                  // Get the category info for this symptom
                  const categoryInfo = symptomCategories.find(cat => 
                    cat.symptoms.includes(symptom) && cat.requiresPhoto
                  );
                  const isCritical = categoryInfo?.photoImportance === 'critical';
                  const photoMissing = isMissingCriticalPhoto(symptom);
                  
                  return (
                    <div 
                      key={`photo-${symptom}`} 
                      className={`border rounded-lg p-4 space-y-3 ${photoMissing ? 'border-red-300 bg-red-50' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <h4 className="font-medium">{symptom}</h4>
                          {isCritical && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        {!symptomPhotos[symptom] ? (
                          <Button
                            type="button" 
                            size="sm"
                            variant={photoMissing ? "default" : "outline"}
                            className={photoMissing ? "bg-red-500 hover:bg-red-600" : ""}
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
                          className={`w-full aspect-video ${photoMissing ? 'bg-red-100' : 'bg-gray-100'} rounded-md flex flex-col items-center justify-center cursor-pointer`}
                          onClick={() => {
                            setCurrentSymptomForPhoto(symptom);
                            if (fileInputRef.current) fileInputRef.current.click();
                          }}
                        >
                          <ImageIcon className={`h-12 w-12 ${photoMissing ? 'text-red-400' : 'text-gray-400'}`} />
                          <p className={`text-sm ${photoMissing ? 'text-red-600 font-medium' : 'text-gray-500'} mt-2`}>
                            {isCritical 
                              ? "Photo required for accurate diagnosis" 
                              : "Click to add a photo"}
                          </p>
                        </div>
                      )}
                      
                      {symptomPhotos[symptom] && (isCritical || isEyeSymptom(symptom) || isSkinSymptom(symptom)) && (
                        <div className="p-2 bg-blue-50 border border-blue-100 rounded">
                          <p className="text-sm text-blue-700">
                            {isEyeSymptom(symptom) 
                              ? "Eye photo will be analyzed for conditions like conjunctivitis, dry eye, or irritation" 
                              : isSkinSymptom(symptom) 
                                ? "Skin photo will be analyzed for rash patterns, discoloration, and other visual characteristics" 
                                : "This photo will help with accurate diagnosis"}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">About symptom photos</p>
                  <p className="mt-1">Photos are stored securely in the database and used for symptom analysis. 
                  They help provide much more accurate assessments for visual conditions like skin and eye issues.</p>
                  <p className="mt-1 font-semibold">Our AI can analyze photos to identify specific eye and skin conditions by 
                  examining visual characteristics that are critical for proper diagnosis.</p>
                </div>
              </div>
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
            <Button 
              type="button" 
              className="w-full" 
              onClick={analyzeSymptoms} 
              disabled={analyzing || selectedSymptoms.length === 0}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                'Analyze Symptoms'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

// Helper functions to check symptom types
function isEyeSymptom(symptom: string): boolean {
  const eyeSymptoms = [
    "Blurry vision", "Eye redness", "Eye pain", "Dry eyes", 
    "Watery eyes", "Eye discharge", "Light sensitivity", 
    "Double vision", "Eye strain"
  ];
  return eyeSymptoms.includes(symptom);
}

function isSkinSymptom(symptom: string): boolean {
  const skinSymptoms = [
    "Rash", "Itching", "Bruising", "Dryness", 
    "Sores", "Changes in mole"
  ];
  return skinSymptoms.includes(symptom);
}

export default HealthCheck;
