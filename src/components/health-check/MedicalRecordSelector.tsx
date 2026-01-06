import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MedicalRecord } from '@/services/medicalRecordService';
import { FileText, Calendar, Building2, User, Pill, AlertCircle, Check } from 'lucide-react';
import { format } from 'date-fns';

interface MedicalRecordSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: MedicalRecord[];
  selectedRecords: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onConfirm: () => void;
}

const recordTypeIcons: Record<string, React.ReactNode> = {
  prescription: <Pill className="h-4 w-4" />,
  lab_report: <FileText className="h-4 w-4" />,
  diagnosis: <AlertCircle className="h-4 w-4" />,
  imaging: <FileText className="h-4 w-4" />,
  vaccination: <FileText className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

const recordTypeLabels: Record<string, string> = {
  prescription: 'Prescription',
  lab_report: 'Lab Report',
  diagnosis: 'Diagnosis',
  imaging: 'Imaging',
  vaccination: 'Vaccination',
  other: 'Other',
};

export function MedicalRecordSelector({
  open,
  onOpenChange,
  records,
  selectedRecords,
  onSelectionChange,
  onConfirm,
}: MedicalRecordSelectorProps) {
  const analyzedRecords = records.filter(r => r.is_analyzed);

  const handleToggle = (recordId: string) => {
    if (selectedRecords.includes(recordId)) {
      onSelectionChange(selectedRecords.filter(id => id !== recordId));
    } else {
      onSelectionChange([...selectedRecords, recordId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(analyzedRecords.map(r => r.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Medical Records</DialogTitle>
          <DialogDescription>
            Choose which records to include in your health analysis. Only analyzed records can be selected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            Selected: {selectedRecords.length} of {analyzedRecords.length}
          </span>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-2">
            {analyzedRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No analyzed records available</p>
                <p className="text-xs mt-1">Upload records and wait for analysis to complete</p>
              </div>
            ) : (
              analyzedRecords.map((record) => (
                <div
                  key={record.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRecords.includes(record.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggle(record.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedRecords.includes(record.id)}
                      onCheckedChange={() => handleToggle(record.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-primary">
                          {recordTypeIcons[record.record_type] || recordTypeIcons.other}
                        </span>
                        <span className="font-medium text-sm truncate">{record.title}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {recordTypeLabels[record.record_type] || 'Record'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                        {record.record_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(record.record_date), 'MMM d, yyyy')}
                          </span>
                        )}
                        {record.doctor_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {record.doctor_name}
                          </span>
                        )}
                        {record.hospital_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {record.hospital_name}
                          </span>
                        )}
                      </div>

                      {record.extracted_conditions && record.extracted_conditions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {record.extracted_conditions.slice(0, 3).map((condition, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-red-500/10 text-red-600">
                              {condition}
                            </Badge>
                          ))}
                          {record.extracted_conditions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{record.extracted_conditions.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {record.extracted_medications && record.extracted_medications.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {record.extracted_medications.slice(0, 3).map((med, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                              {med}
                            </Badge>
                          ))}
                          {record.extracted_medications.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{record.extracted_medications.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedRecords.includes(record.id) && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}

            {records.filter(r => !r.is_analyzed).length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {records.filter(r => !r.is_analyzed).length} record(s) still being analyzed and not available for selection.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={selectedRecords.length === 0}>
            Include {selectedRecords.length} Record{selectedRecords.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
