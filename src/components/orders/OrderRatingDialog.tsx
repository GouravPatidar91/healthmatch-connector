import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { ratingService } from '@/services/ratingService';
import { useToast } from '@/hooks/use-toast';

interface OrderRatingDialogProps {
  open: boolean;
  orderId: string;
  orderStatus: string;
  onClose: () => void;
  onRatingSubmitted?: () => void;
}

export const OrderRatingDialog: React.FC<OrderRatingDialogProps> = ({
  open,
  orderId,
  orderStatus,
  onClose,
  onRatingSubmitted
}) => {
  const [overallRating, setOverallRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [pharmacyRating, setPharmacyRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && orderId) {
      loadExistingRating();
    }
  }, [open, orderId]);

  const loadExistingRating = async () => {
    const rating = await ratingService.getOrderRating(orderId);
    if (rating) {
      setExistingRating(rating);
      setOverallRating(rating.rating);
      setDeliveryRating(rating.delivery_rating || 0);
      setPharmacyRating(rating.pharmacy_rating || 0);
      setReview(rating.review || '');
    }
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast({
        title: 'Error',
        description: 'Please provide an overall rating',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await ratingService.submitRating({
        order_id: orderId,
        rating: overallRating,
        delivery_rating: deliveryRating || undefined,
        pharmacy_rating: pharmacyRating || undefined,
        review: review.trim() || undefined
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: existingRating ? 'Rating updated successfully' : 'Thank you for your feedback!',
        });
        onRatingSubmitted?.();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit rating',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, setRating: (rating: number) => void, label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-8 w-8 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (orderStatus !== 'delivered') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingRating ? 'Update Your Rating' : 'Rate Your Order'}
          </DialogTitle>
          <DialogDescription>
            Help us improve our service by sharing your experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {renderStars(overallRating, setOverallRating, 'Overall Experience *')}
          {renderStars(pharmacyRating, setPharmacyRating, 'Pharmacy Service')}
          {renderStars(deliveryRating, setDeliveryRating, 'Delivery Partner')}

          <div className="space-y-2">
            <Label htmlFor="review">Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {review.length}/500 characters
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
