import { supabase } from '@/integrations/supabase/client';

export interface MedicalRecord {
  id: string;
  user_id: string;
  title: string;
  record_type: 'prescription' | 'lab_report' | 'diagnosis' | 'imaging' | 'vaccination' | 'other';
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  extracted_conditions: string[];
  extracted_medications: string[];
  extracted_summary: string | null;
  notes: string | null;
  record_date: string | null;
  doctor_name: string | null;
  hospital_name: string | null;
  is_analyzed: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecordMetadata {
  title: string;
  record_type: MedicalRecord['record_type'];
  record_date?: string;
  doctor_name?: string;
  hospital_name?: string;
  notes?: string;
}

export interface AggregatedMedicalData {
  conditions: string[];
  medications: string[];
  summaries: { title: string; summary: string; date: string | null }[];
  recordCount: number;
}

// Fetch all medical records for current user
export async function getMedicalRecords(): Promise<MedicalRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', user.id)
    .order('record_date', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data || []) as MedicalRecord[];
}

// Upload and analyze a new medical record
export async function uploadMedicalRecord(
  file: File,
  metadata: RecordMetadata
): Promise<MedicalRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('medical-records')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('medical-records')
    .getPublicUrl(fileName);

  // Create record in database
  const { data: record, error: insertError } = await supabase
    .from('medical_records')
    .insert({
      user_id: user.id,
      title: metadata.title,
      record_type: metadata.record_type,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      record_date: metadata.record_date || null,
      doctor_name: metadata.doctor_name || null,
      hospital_name: metadata.hospital_name || null,
      notes: metadata.notes || null,
      is_analyzed: false,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  // Trigger AI analysis in background
  analyzeRecordInBackground(record.id, file);

  return record as MedicalRecord;
}

// Analyze record with AI (called in background)
async function analyzeRecordInBackground(recordId: string, file: File) {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Call edge function to analyze
    const { data, error } = await supabase.functions.invoke('extract-medical-record', {
      body: {
        recordId,
        fileContent: base64,
        fileName: file.name,
        fileType: file.type,
      },
    });

    if (error) {
      console.error('Error analyzing medical record:', error);
      return;
    }

    // Update record with extracted data
    if (data) {
      await supabase
        .from('medical_records')
        .update({
          extracted_conditions: data.conditions || [],
          extracted_medications: data.medications || [],
          extracted_summary: data.summary || null,
          doctor_name: data.doctor_name || null,
          hospital_name: data.hospital_name || null,
          is_analyzed: true,
        })
        .eq('id', recordId);
    }
  } catch (error) {
    console.error('Background analysis failed:', error);
  }
}

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

// Delete a medical record
export async function deleteMedicalRecord(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get record to find file path
  const { data: record, error: fetchError } = await supabase
    .from('medical_records')
    .select('file_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) throw fetchError;

  // Extract file path from URL
  if (record?.file_url) {
    const urlParts = record.file_url.split('/medical-records/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('medical-records').remove([filePath]);
    }
  }

  // Delete record from database
  const { error: deleteError } = await supabase
    .from('medical_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) throw deleteError;
}

// Get aggregated medical data for health check
export async function getAggregatedMedicalData(): Promise<AggregatedMedicalData> {
  const records = await getMedicalRecords();
  
  const conditionsSet = new Set<string>();
  const medicationsSet = new Set<string>();
  const summaries: AggregatedMedicalData['summaries'] = [];

  records.forEach(record => {
    if (record.extracted_conditions) {
      record.extracted_conditions.forEach(c => conditionsSet.add(c));
    }
    if (record.extracted_medications) {
      record.extracted_medications.forEach(m => medicationsSet.add(m));
    }
    if (record.extracted_summary) {
      summaries.push({
        title: record.title,
        summary: record.extracted_summary,
        date: record.record_date,
      });
    }
  });

  return {
    conditions: Array.from(conditionsSet),
    medications: Array.from(medicationsSet),
    summaries,
    recordCount: records.length,
  };
}

// Get aggregated medical data from specific selected records
export async function getMedicalDataFromRecords(
  recordIds: string[]
): Promise<AggregatedMedicalData> {
  if (recordIds.length === 0) {
    return { conditions: [], medications: [], summaries: [], recordCount: 0 };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', user.id)
    .in('id', recordIds);

  if (error) throw error;

  const records = (data || []) as MedicalRecord[];
  
  const conditionsSet = new Set<string>();
  const medicationsSet = new Set<string>();
  const summaries: AggregatedMedicalData['summaries'] = [];

  records.forEach(record => {
    if (record.extracted_conditions) {
      record.extracted_conditions.forEach(c => conditionsSet.add(c));
    }
    if (record.extracted_medications) {
      record.extracted_medications.forEach(m => medicationsSet.add(m));
    }
    if (record.extracted_summary) {
      summaries.push({
        title: record.title,
        summary: record.extracted_summary,
        date: record.record_date,
      });
    }
  });

  return {
    conditions: Array.from(conditionsSet),
    medications: Array.from(medicationsSet),
    summaries,
    recordCount: records.length,
  };
}

// Get signed URL for viewing a file
export async function getSignedUrl(fileUrl: string): Promise<string> {
  const urlParts = fileUrl.split('/medical-records/');
  if (urlParts.length < 2) return fileUrl;
  
  const filePath = urlParts[1];
  const { data, error } = await supabase.storage
    .from('medical-records')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}
