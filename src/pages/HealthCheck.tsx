import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, 
  Brain, 
  Bone, 
  Eye, 
  Ear, 
  Smile, 
  Baby, 
  Users, 
  Stethoscope,
  Activity,
  Camera,
  Upload,
  X
} from "lucide-react";

const SYMPTOM_CATEGORIES = {
  "Heart & Circulation": {
    icon: Heart,
    symptoms: ["Chest pain", "Shortness of breath", "Heart palpitations", "Dizziness", "Fainting", "Swelling in legs"]
  },
  "Brain & Nervous System": {
    icon: Brain,
    symptoms: ["Headache", "Memory problems", "Confusion", "Seizures", "Numbness", "Weakness", "Tremors"]
  },
  "Bones & Muscles": {
    icon: Bone,
    symptoms: ["Joint pain", "Back pain", "Muscle weakness", "Bone pain", "Stiffness", "Swelling", "Limited mobility"]
  },
  "Eye": {
    icon: Eye,
    symptoms: ["Blurred vision", "Eye pain", "Double vision", "Light sensitivity", "Eye discharge", "Dry eyes", "Vision loss"]
  },
  "Ear": {
    icon: Ear,
    symptoms: ["Ear pain", "Hearing loss", "Ringing in ears", "Ear discharge", "Balance problems", "Ear pressure"]
  },
  "Dental": {
    icon: Smile,
    symptoms: ["Tooth pain", "Gum bleeding", "Bad breath", "Tooth sensitivity", "Jaw pain", "Braces pain", "Wisdom tooth pain"]
  },
  "Child Health": {
    icon: Baby,
    symptoms: ["Fever in child", "Rash", "Crying", "Feeding problems", "Sleep issues", "Development delays"]
  },
  "Women's Health": {
    icon: Users,
    symptoms: ["Menstrual problems", "Pregnancy symptoms", "Breast pain", "Pelvic pain", "Hot flashes"]
  },
  "General": {
    icon: Stethoscope,
    symptoms: ["Fever", "Fatigue", "Nausea", "Vomiting", "Cough", "Cold symptoms", "Weight loss", "Weight gain"]
  },
  "Skin": {
    icon: Activity,
    symptoms: ["Rash", "Itching", "Skin discoloration", "Wounds", "Acne", "Dry skin", "Hair loss"]
  }
};

const HealthCheck = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomCategoryMap, setSymptomCategoryMap] = useState<Record<string, string>>({});
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const { toast } = useToast();

  const handleSymptomSelect = (symptom: string, category: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
      const newCategories = { ...symptomCategoryMap };
      delete newCategories[symptom];
      setSymptomCategoryMap(newCategories);
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
      setSymptomCategoryMap({ ...symptomCategoryMap, [symptom]: category });
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + photos.length > 5) {
      toast({
        title: "Too many photos",
        description: "You can upload a maximum of 5 photos",
        variant: "destructive",
      });
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      toast({
        title: "No symptoms selected",
        description: "Please select at least one symptom",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload photos if any
      const photoUrls: Record<string, string> = {};
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileName = `${user.id}/${Date.now()}_${i}_${photo.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('symptom-photos')
          .upload(fileName, photo);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('symptom-photos')
          .getPublicUrl(fileName);

        photoUrls[`photo_${i + 1}`] = publicUrl;
      }

      // Analyze symptoms with AI
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-symptoms', {
        body: {
          symptoms: selectedSymptoms,
          symptomCategories: symptomCategoryMap,
          severity,
          duration,
          notes,
          photos: photoUrls
        }
      });

      if (analysisError) throw analysisError;

      // Save health check
      const healthCheckData = {
        user_id: user.id,
        symptoms: selectedSymptoms,
        severity,
        duration,
        notes,
        analysis_results: analysisData,
        symptom_photos: photoUrls,
        created_at: new Date().toISOString()
      };

      const { error: saveError } = await supabase
        .from('health_checks')
        .insert([healthCheckData]);

      if (saveError) throw saveError;

      toast({
        title: "Analysis complete",
        description: "Your symptoms have been analyzed successfully",
      });

      // Reset form
      setSelectedSymptoms([]);
      setSymptomCategoryMap({});
      setSeverity("");
      setDuration("");
      setNotes("");
      setPhotos([]);

    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Health Check</h1>
        <p className="text-muted-foreground">
          Select your symptoms for AI-powered health analysis
        </p>
      </div>

      {/* Symptom Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(SYMPTOM_CATEGORIES).map(([category, { icon: Icon, symptoms }]) => (
          <Card key={category} className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="h-5 w-5" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <Badge
                    key={symptom}
                    variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => handleSymptomSelect(symptom, category)}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Symptoms */}
      {selectedSymptoms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Symptoms ({selectedSymptoms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map((symptom) => (
                <Badge key={symptom} variant="default" className="gap-1">
                  {symptom}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleSymptomSelect(symptom, symptomCategoryMap[symptom])}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Severity Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Mild", "Moderate", "Severe", "Critical"].map((level) => (
                <Badge
                  key={level}
                  variant={severity === level ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSeverity(level)}
                >
                  {level}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Less than 1 day", "1-3 days", "1 week", "1 month", "More than 1 month"].map((dur) => (
                <Badge
                  key={dur}
                  variant={duration === dur ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setDuration(dur)}
                >
                  {dur}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Symptom Photos (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                  </span>
                </Button>
              </label>
              <span className="text-sm text-muted-foreground">
                Max 5 photos
              </span>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Symptom photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe any additional details about your symptoms..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button
          onClick={analyzeSymptoms}
          disabled={loading || selectedSymptoms.length === 0}
          size="lg"
          className="min-w-[200px]"
        >
          {loading ? "Analyzing..." : "Analyze Symptoms"}
        </Button>
      </div>
    </div>
  );
};

export default HealthCheck;
