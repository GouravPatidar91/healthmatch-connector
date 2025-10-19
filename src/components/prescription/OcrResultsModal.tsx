import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, ShoppingCart } from 'lucide-react';

interface OcrResultsModalProps {
  open: boolean;
  onClose: () => void;
  extractedMedicines: any[];
  onAddToCart: (medicine: any, quantity: number) => void;
}

export const OcrResultsModal: React.FC<OcrResultsModalProps> = ({
  open,
  onClose,
  extractedMedicines,
  onAddToCart
}) => {
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-600">High Confidence</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-yellow-600">Medium Confidence</Badge>;
    } else {
      return <Badge className="bg-red-600">Low Confidence</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Extracted Medicines from Prescription
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {extractedMedicines.map((item, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{item.extracted.name}</h3>
                    {getConfidenceBadge(item.match_confidence)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.extracted.dosage} • {item.extracted.form} • Qty: {item.extracted.quantity}
                  </p>
                  {item.extracted.frequency && (
                    <p className="text-sm text-muted-foreground">
                      {item.extracted.frequency} {item.extracted.duration && `for ${item.extracted.duration}`}
                    </p>
                  )}
                </div>
                
                {item.matches.length > 0 ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>

              {item.matches.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-sm font-medium">Available Options:</p>
                  {item.matches.map((medicine: any) => (
                    <div key={medicine.id} className="bg-secondary/50 p-3 rounded flex justify-between items-center">
                      <div>
                        <p className="font-medium">{medicine.brand} - {medicine.name}</p>
                        <p className="text-sm text-muted-foreground">₹{medicine.mrp}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onAddToCart(medicine, item.extracted.quantity || 1)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  ))}

                  {item.alternatives && item.alternatives.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-blue-600">Cheaper Alternatives:</p>
                      {item.alternatives.map((alt: any) => (
                        <div key={alt.id} className="bg-blue-50 dark:bg-blue-950 p-2 rounded flex justify-between items-center mt-1">
                          <div>
                            <p className="text-sm font-medium">{alt.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ₹{alt.mrp} (Save ₹{(item.matches[0].mrp - alt.mrp).toFixed(2)})
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onAddToCart(alt, item.extracted.quantity || 1)}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {item.matches.length === 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded flex items-center gap-2 mt-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Medicine not found in database</p>
                    <p className="text-xs text-muted-foreground">{item.suggestion}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onClose}>
            Continue to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
