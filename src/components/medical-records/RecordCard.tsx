import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Pill, 
  Stethoscope, 
  Scan, 
  Syringe, 
  File, 
  Trash2, 
  Download, 
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { MedicalRecord, getSignedUrl, deleteMedicalRecord } from '@/services/medicalRecordService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RecordCardProps {
  record: MedicalRecord;
  onDelete: () => void;
}

const RECORD_TYPE_CONFIG = {
  prescription: { label: 'Prescription', icon: Pill, color: 'bg-blue-500/10 text-blue-500' },
  lab_report: { label: 'Lab Report', icon: FileText, color: 'bg-green-500/10 text-green-500' },
  diagnosis: { label: 'Diagnosis', icon: Stethoscope, color: 'bg-purple-500/10 text-purple-500' },
  imaging: { label: 'Imaging', icon: Scan, color: 'bg-orange-500/10 text-orange-500' },
  vaccination: { label: 'Vaccination', icon: Syringe, color: 'bg-teal-500/10 text-teal-500' },
  other: { label: 'Other', icon: File, color: 'bg-gray-500/10 text-gray-500' },
};

export default function RecordCard({ record, onDelete }: RecordCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const config = RECORD_TYPE_CONFIG[record.record_type] || RECORD_TYPE_CONFIG.other;
  const Icon = config.icon;

  const handleView = async () => {
    setLoading(true);
    try {
      const url = await getSignedUrl(record.file_url);
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const url = await getSignedUrl(record.file_url);
      const link = document.createElement('a');
      link.href = url;
      link.download = record.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMedicalRecord(record.id);
      toast({
        title: 'Record deleted',
        description: 'Your medical record has been removed.',
      });
      onDelete();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete record.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const hasExtractedData = record.extracted_conditions?.length > 0 || 
                           record.extracted_medications?.length > 0 ||
                           record.extracted_summary;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{record.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                {!record.is_analyzed && (
                  <Badge variant="outline" className="text-xs">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing...
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {record.record_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(record.record_date), 'MMM d, yyyy')}
              </div>
            )}
            {record.doctor_name && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {record.doctor_name}
              </div>
            )}
            {record.hospital_name && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {record.hospital_name}
              </div>
            )}
          </div>

          {/* Extracted Data Preview */}
          {hasExtractedData && (
            <div className="mt-3 space-y-2">
              {record.extracted_conditions?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {record.extracted_conditions.slice(0, expanded ? undefined : 3).map((condition, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-red-500/5 text-red-600 border-red-200">
                      {condition}
                    </Badge>
                  ))}
                  {!expanded && record.extracted_conditions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{record.extracted_conditions.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              {record.extracted_medications?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {record.extracted_medications.slice(0, expanded ? undefined : 3).map((med, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-blue-500/5 text-blue-600 border-blue-200">
                      {med}
                    </Badge>
                  ))}
                  {!expanded && record.extracted_medications.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{record.extracted_medications.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Expandable Summary */}
          {record.extracted_summary && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center text-xs text-primary hover:underline"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide summary
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    View summary
                  </>
                )}
              </button>
              {expanded && (
                <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  {record.extracted_summary}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleView}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDownload}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medical Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{record.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
