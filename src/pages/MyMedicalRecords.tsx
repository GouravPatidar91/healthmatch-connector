import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileHeart, Loader2, FolderOpen, RefreshCw } from 'lucide-react';
import { getMedicalRecords, MedicalRecord } from '@/services/medicalRecordService';
import RecordCard from '@/components/medical-records/RecordCard';
import UploadRecordDialog from '@/components/medical-records/UploadRecordDialog';
import { useToast } from '@/hooks/use-toast';

const RECORD_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'prescription', label: 'Prescriptions' },
  { value: 'lab_report', label: 'Lab Reports' },
  { value: 'diagnosis', label: 'Diagnoses' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'vaccination', label: 'Vaccinations' },
  { value: 'other', label: 'Other' },
];

export default function MyMedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await getMedicalRecords();
      setRecords(data);
    } catch (error: any) {
      toast({
        title: 'Error loading records',
        description: error.message || 'Failed to load medical records.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Poll for analysis updates
  useEffect(() => {
    const unanalyzedCount = records.filter(r => !r.is_analyzed).length;
    if (unanalyzedCount === 0) return;

    const interval = setInterval(() => {
      fetchRecords();
    }, 5000);

    return () => clearInterval(interval);
  }, [records]);

  const filteredRecords = filterType === 'all' 
    ? records 
    : records.filter(r => r.record_type === filterType);

  const handleRefresh = () => {
    fetchRecords();
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileHeart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Medical Records</h1>
            <p className="text-sm text-muted-foreground">
              Store and manage your medical documents securely
            </p>
          </div>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">AI-Powered Analysis:</strong> Your uploaded records are automatically analyzed to extract conditions and medications. This data is used to enhance your AI Health Check results for more accurate analysis.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {RECORD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Records Grid */}
      {loading && records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            {filterType === 'all' ? 'No medical records yet' : `No ${filterType.replace('_', ' ')} records`}
          </h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            {filterType === 'all' 
              ? 'Upload your prescriptions, lab reports, and other medical documents to keep them organized and enhance your AI Health Check.'
              : 'No records found for this category.'}
          </p>
          {filterType === 'all' && (
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Your First Record
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRecords.map((record) => (
            <RecordCard 
              key={record.id} 
              record={record} 
              onDelete={fetchRecords}
            />
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <UploadRecordDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={fetchRecords}
      />
    </div>
  );
}
