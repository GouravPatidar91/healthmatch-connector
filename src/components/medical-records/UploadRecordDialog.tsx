import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Image, X, Loader2 } from 'lucide-react';
import { uploadMedicalRecord, RecordMetadata } from '@/services/medicalRecordService';
import { useToast } from '@/hooks/use-toast';

interface UploadRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RECORD_TYPES = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'diagnosis', label: 'Diagnosis Report' },
  { value: 'imaging', label: 'Imaging (X-Ray, MRI, CT)' },
  { value: 'vaccination', label: 'Vaccination Record' },
  { value: 'other', label: 'Other' },
];

export default function UploadRecordDialog({ open, onOpenChange, onSuccess }: UploadRecordDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState<string>('');
  const [recordDate, setRecordDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image (JPG, PNG) or PDF file.',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const isValidFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    return validTypes.includes(file.type);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image (JPG, PNG) or PDF file.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title || !recordType) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields and upload a file.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const metadata: RecordMetadata = {
        title,
        record_type: recordType as RecordMetadata['record_type'],
        record_date: recordDate || undefined,
        doctor_name: doctorName || undefined,
        hospital_name: hospitalName || undefined,
        notes: notes || undefined,
      };

      await uploadMedicalRecord(file, metadata);
      
      toast({
        title: 'Record uploaded',
        description: 'Your medical record is being analyzed. This may take a moment.',
      });
      
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload medical record.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setRecordType('');
    setRecordDate('');
    setDoctorName('');
    setHospitalName('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Medical Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border'
            } ${file ? 'bg-muted/50' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {file.type.startsWith('image/') ? (
                    <Image className="h-8 w-8 text-primary" />
                  ) : (
                    <FileText className="h-8 w-8 text-primary" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your file here, or
                </p>
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileChange}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports JPG, PNG, PDF (Max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Blood Test Results - Jan 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Record Type */}
          <div className="space-y-2">
            <Label>Record Type *</Label>
            <Select value={recordType} onValueChange={setRecordType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select record type" />
              </SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Record Date */}
          <div className="space-y-2">
            <Label htmlFor="recordDate">Record Date</Label>
            <Input
              id="recordDate"
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
            />
          </div>

          {/* Doctor & Hospital (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="doctorName">Doctor Name</Label>
              <Input
                id="doctorName"
                placeholder="Dr. John Smith"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hospitalName">Hospital/Clinic</Label>
              <Input
                id="hospitalName"
                placeholder="City Hospital"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this record..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={uploading || !file}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Record
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
