import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useUserHealthChecks } from '@/services/userDataService';
import { Loader2, Upload, Image as ImageIcon, AlertCircle, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Updated symptom categories with expanded dental symptoms based on dental departments
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
    supportsPhoto: true,
    photoRecommended: true
  },
  {
    category: "Dental",
    symptoms: [
      // General Dental
      "Tooth pain", "Gum bleeding", "Tooth sensitivity", "Bad breath", "Loose teeth", "Jaw pain", "Tooth decay", "Gum swelling", "Cracked tooth", "Wisdom tooth pain",
      // Oral Medicine and Radiology
      "Mouth ulcers", "Oral lesions", "Tongue pain", "Dry mouth", "Burning mouth sensation", "Oral infections",
      // Oral and Maxillofacial Surgery
      "Facial swelling", "Jaw stiffness", "TMJ disorders", "Facial trauma", "Impacted teeth", "Oral cysts",
      // Oral Pathology and Oral Microbiology  
      "White patches in mouth", "Red patches in mouth", "Oral cancer symptoms", "Unusual growths in mouth", "Recurring mouth infections",
      // Prosthodontics and Crown & Bridge
      "Denture problems", "Crown pain", "Bridge discomfort", "Missing teeth", "Bite problems", "Chewing difficulties",
      // Conservative Dentistry and Endodontics
      "Root canal pain", "Filling sensitivity", "Cavity pain", "Tooth nerve pain", "Post-treatment sensitivity",
      // Pediatric & Preventive Dentistry
      "Children's dental pain", "Teething problems", "Dental development issues", "Early childhood caries",
      // Periodontology
      "Gum disease", "Gum recession", "Periodontal pockets", "Gum inflammation", "Plaque buildup", "Tartar formation",
      // Public Health Dentistry
      "Oral hygiene issues", "Preventive care needs", "Community dental problems",
      // Orthodontics & Dentofacial Orthopedics
      "Crooked teeth", "Overbite", "Underbite", "Crossbite", "Spacing issues", "Jaw alignment problems", "Braces pain"
    ],
    supportsPhoto: true,
    photoRecommended: true
  },
  {
    category: "Chest",
    symptoms: ["Chest pain", "Shortness of breath", "Palpitations", "Cough", "Wheezing"]
  },
  {
    category: "Abdomen & Digestive",
    symptoms: [
      "Abdominal pain", "Nausea", "Vomiting", "Diarrhea", "Constipation", "Bloating", 
      "Loss of appetite", "Gas/Flatulence", "Stomach cramps", "Acid reflux/Heartburn", 
      "Indigestion", "Stomach burning", "Excessive burping", "Stomach growling", 
      "Food intolerance", "Difficulty swallowing", "Stomach fullness", "Intestinal pain",
      "Blood in stool", "Black stool", "Mucus in stool", "Frequent urination",
      "Painful urination", "Changes in bowel habits"
    ]
  },
  {
    category: "Musculoskeletal",
    symptoms: ["Joint pain", "Muscle pain", "Back pain", "Stiffness", "Swelling", "Weakness"]
  },
  {
    category: "Skin",
    symptoms: ["Rash", "Itching", "Bruising", "Dryness", "Sores", "Changes in mole"],
    supportsPhoto: true,
    photoRecommended: true
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [previousConditions, setPreviousConditions] = useState<string>("");
  const [medications, setMedications] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [symptomPhotos, setSymptomPhotos] = useState<{[symptom: string]: string}>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentSymptomForPhoto, setCurrentSymptomForPhoto] = useState<string>("");
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Add cleanup effect for camera stream
  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleSymptomToggle = (symptom: string, category: string) => {
    setSelectedSymptoms((current) => {
      const newSelection = current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom];
        
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

  const startCamera = async (symptom: string) => {
    try {
      setCurrentSymptomForPhoto(symptom);
      
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      console.log("Requesting camera access for symptom:", symptom);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } 
      });
      
      console.log("Camera stream obtained successfully");
      
      setStream(mediaStream);
      setCameraActive(true);
      
      // Wait for video element to be available and set the stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error("Error playing video:", err);
          });
        }
      }, 100);
      
      toast({
        title: "Camera activated",
        description: "Position the symptom area in the camera view and click capture"
      });
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera error",
        description: "Unable to access camera. Please check permissions and try again.",
        variant: "destructive"
      });
      setCameraActive(false);
      setCurrentSymptomForPhoto("");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !currentSymptomForPhoto) {
      console.error("Missing required elements for photo capture");
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }
    
    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      toast({
        title: "Camera not ready",
        description: "Please wait for camera to initialize",
        variant: "destructive"
      });
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64 and compress
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    setSymptomPhotos(prev => ({
      ...prev,
      [currentSymptomForPhoto]: imageData
    }));
    
    stopCamera();
    
    toast({
      title: "Photo captured",
      description: `Photo captured for ${currentSymptomForPhoto}`
    });
  };

  const stopCamera = () => {
    console.log("Stopping camera");
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log("Camera track stopped");
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setCurrentSymptomForPhoto("");
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

      // Check if there are dental symptoms for specialized analysis
      const dentalSymptoms = selectedSymptoms.filter(symptom => isDentalSymptom(symptom));
      const hasDentalSymptoms = dentalSymptoms.length > 0;
      
      // Enhanced analysis request with comprehensive diagnosis instructions
      const response = await supabase.functions.invoke('analyze-symptoms', {
        body: { 
          symptoms: selectedSymptoms,
          severity,
          duration,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          symptomDetails: symptomsWithPhotos,
          previousConditions: previousConditions ? previousConditions.split(',').map(item => item.trim()).filter(item => item) : [],
          medications: medications ? medications.split(',').map(item => item.trim()).filter(item => item) : [],
          notes: notes.trim() || null,
          // Enhanced analysis instructions
          analysisInstructions: {
            requireComprehensiveDiagnosis: true,
            includeDifferentialDiagnosis: true,
            provideDetailedExplanations: true,
            specialFocus: hasDentalSymptoms ? 'dental' : 'general',
            dentalSymptoms: dentalSymptoms,
            requestedAnalysisDepth: 'comprehensive',
            includeTreatmentRecommendations: true,
            includePreventiveMeasures: true,
            includeMedicalSpecialistReferrals: true,
            analysisType: 'high_detail_diagnostic_report'
          }
        }
      });

      console.log("Enhanced comprehensive analysis response:", response);

      if (response.data && response.data.conditions) {
        
        // Enhanced toast message for comprehensive diagnosis
        let toastMessage = `Generated comprehensive diagnosis report with ${response.data.conditions.length} potential conditions`;
        
        if (hasDentalSymptoms) {
          toastMessage += ` including specialized dental analysis for ${dentalSymptoms.length} dental symptoms`;
        }
        
        if (response.data.comprehensiveAnalysis) {
          const analysisFactors = [];
          if (response.data.includedMedicalHistory) analysisFactors.push("medical history");
          if (response.data.includedMedications) analysisFactors.push("current medications");
          if (response.data.includedNotes) analysisFactors.push("additional notes");
          if (response.data.visualAnalysisIncluded) analysisFactors.push("photo analysis");
          if (height && weight) analysisFactors.push("physical measurements");
          
          if (analysisFactors.length > 0) {
            toastMessage += ` based on ${analysisFactors.join(", ")}.`;
          }
        }
        
        toast({
          title: "Comprehensive Diagnosis Complete",
          description: toastMessage,
        });

        // Navigate with enhanced health check data
        const healthCheckData = {
          symptoms: selectedSymptoms,
          severity,
          duration,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          previous_conditions: previousConditions ? previousConditions.split(',').map(item => item.trim()).filter(item => item) : [],
          medications: medications ? medications.split(',').map(item => item.trim()).filter(item => item) : [],
          notes,
          analysis_results: response.data.conditions,
          symptom_photos: symptomPhotos,
          comprehensive_analysis: response.data.comprehensiveAnalysis,
          urgency_level: response.data.urgencyLevel,
          overall_assessment: response.data.overallAssessment,
          dental_analysis_included: hasDentalSymptoms,
          specialized_analysis_type: hasDentalSymptoms ? 'dental_comprehensive' : 'general_comprehensive'
        };
        
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
    
    toast({
      title: "Photo removed",
      description: `Photo for ${symptom} removed`
    });
  };

  // Check if any selected symptoms support photos
  const hasPhotoSupportedSymptoms = selectedSymptoms.some(symptom => {
    const category = symptomCategories.find(cat => 
      cat.symptoms.includes(symptom) && cat.supportsPhoto
    );
    return category !== undefined;
  });

  // Get all selected symptoms that support photos
  const selectedPhotoSupportedSymptoms = selectedSymptoms.filter(symptom => {
    const category = symptomCategories.find(cat => 
      cat.symptoms.includes(symptom) && cat.supportsPhoto
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
      
      <form className="space-y-8">
        {/* Patient Physical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Physical Information</CardTitle>
            <CardDescription>Your height and weight help provide more accurate analysis</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input 
                id="height" 
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 170"
                min="50"
                max="250"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input 
                id="weight" 
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 70"
                min="10"
                max="300"
              />
            </div>
          </CardContent>
        </Card>

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
                  {category.supportsPhoto && (
                    <span className="ml-2 text-sm text-blue-600 font-normal">
                      (Photos supported for better analysis)
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
                        {selectedSymptoms.includes(symptom) && category.supportsPhoto && !symptomPhotos[symptom] && (
                          <Camera className="h-4 w-4 ml-1 text-blue-500" />
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
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Camera modal with improved styling and error handling */}
        {cameraActive && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Capture Photo for {currentSymptomForPhoto}
                </h3>
                <Button variant="outline" size="sm" onClick={stopCamera}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    console.log("Video metadata loaded");
                  }}
                  onError={(e) => {
                    console.error("Video error:", e);
                  }}
                />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Initializing camera...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={capturePhoto}
                  disabled={!stream}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  Cancel
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mt-3 text-center">
                Make sure the symptom area is clearly visible and well-lit for better analysis
              </p>
            </div>
          </div>
        )}
        
        {/* Display area for symptom photos */}
        {hasPhotoSupportedSymptoms && (
          <Card>
            <CardHeader>
              <CardTitle>Symptom Photos (Optional)</CardTitle>
              <CardDescription>
                Adding photos can help provide more accurate analysis for visual symptoms like eye, skin, and dental conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedPhotoSupportedSymptoms.map(symptom => {
                  return (
                    <div 
                      key={`photo-${symptom}`} 
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <h4 className="font-medium">{symptom}</h4>
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Optional
                          </span>
                        </div>
                        {!symptomPhotos[symptom] ? (
                          <div className="flex gap-2">
                            <Button
                              type="button" 
                              size="sm"
                              variant="outline"
                              onClick={() => startCamera(symptom)}
                              disabled={uploadingPhoto || cameraActive}
                            >
                              <Camera className="h-4 w-4 mr-1" />
                              Camera
                            </Button>
                            <Button
                              type="button" 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCurrentSymptomForPhoto(symptom);
                                if (fileInputRef.current) fileInputRef.current.click();
                              }}
                              disabled={uploadingPhoto || cameraActive}
                            >
                              {uploadingPhoto && currentSymptomForPhoto === symptom ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-1" />
                              )}
                              Upload
                            </Button>
                          </div>
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
                          className="w-full aspect-video bg-gray-100 rounded-md flex flex-col items-center justify-center"
                        >
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                          <p className="text-sm text-gray-500 mt-2 text-center">
                            Add a photo for better analysis
                          </p>
                        </div>
                      )}
                      
                      {symptomPhotos[symptom] && (isEyeSymptom(symptom) || isSkinSymptom(symptom) || isDentalSymptom(symptom)) && (
                        <div className="p-2 bg-blue-50 border border-blue-100 rounded">
                          <p className="text-sm text-blue-700">
                            {isEyeSymptom(symptom) 
                              ? "Eye photo will be analyzed for conditions like conjunctivitis, dry eye, or irritation" 
                              : isSkinSymptom(symptom)
                              ? "Skin photo will be analyzed for rash patterns, discoloration, and other visual characteristics"
                              : "Dental photo will be analyzed for tooth decay, gum disease, oral lesions, and other dental conditions"}
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
                  <p className="mt-1">Photos are optional but can significantly improve analysis accuracy for visual conditions. 
                  You can either upload existing photos or take new ones using your device's camera.</p>
                  <p className="mt-1 font-semibold">Our AI can analyze photos to identify specific patterns and characteristics 
                  that help with more accurate diagnosis.</p>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Generating Comprehensive Diagnosis...
                </>
              ) : (
                'Generate Comprehensive Health Analysis'
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

function isDentalSymptom(symptom: string): boolean {
  const dentalSymptoms = [
    "Tooth pain", "Gum bleeding", "Tooth sensitivity", "Bad breath", "Loose teeth", "Jaw pain", "Tooth decay", "Gum swelling", "Cracked tooth", "Wisdom tooth pain",
    "Mouth ulcers", "Oral lesions", "Tongue pain", "Dry mouth", "Burning mouth sensation", "Oral infections",
    "Facial swelling", "Jaw stiffness", "TMJ disorders", "Facial trauma", "Impacted teeth", "Oral cysts",
    "White patches in mouth", "Red patches in mouth", "Oral cancer symptoms", "Unusual growths in mouth", "Recurring mouth infections",
    "Denture problems", "Crown pain", "Bridge discomfort", "Missing teeth", "Bite problems", "Chewing difficulties",
    "Root canal pain", "Filling sensitivity", "Cavity pain", "Tooth nerve pain", "Post-treatment sensitivity",
    "Children's dental pain", "Teething problems", "Dental development issues", "Early childhood caries",
    "Gum disease", "Gum recession", "Periodontal pockets", "Gum inflammation", "Plaque buildup", "Tartar formation",
    "Oral hygiene issues", "Preventive care needs", "Community dental problems",
    "Crooked teeth", "Overbite", "Underbite", "Crossbite", "Spacing issues", "Jaw alignment problems", "Braces pain"
  ];
  return dentalSymptoms.includes(symptom);
}

export default HealthCheck;
