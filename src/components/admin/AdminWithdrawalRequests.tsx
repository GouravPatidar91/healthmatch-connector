import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import type { WithdrawalRequest } from "@/services/adminWalletService";
import { adminWalletService } from "@/services/adminWalletService";
import { useToast } from "@/hooks/use-toast";

interface AdminWithdrawalRequestsProps {
  requests: WithdrawalRequest[];
  loading?: boolean;
  onUpdate: () => void;
}

export const AdminWithdrawalRequests = ({
  requests,
  loading,
  onUpdate,
}: AdminWithdrawalRequestsProps) => {
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const handleProcess = async (approved: boolean) => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      await adminWalletService.processWithdrawal(
        selectedRequest.id,
        approved,
        adminNotes
      );
      toast({
        title: approved ? "Withdrawal Approved" : "Withdrawal Rejected",
        description: `Successfully ${approved ? "approved" : "rejected"} withdrawal request`,
      });
      setSelectedRequest(null);
      setAdminNotes("");
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          No withdrawal requests found
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Withdrawal Requests
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested At</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {format(new Date(request.requested_at), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{Number(request.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {request.user_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Review
                      </Button>
                    )}
                    {request.status !== "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRequest(request)}
                      >
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdrawal Request</DialogTitle>
            <DialogDescription>
              Review and process this withdrawal request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold">
                    ₹{Number(selectedRequest.amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Requested At</p>
                <p className="text-sm">
                  {format(new Date(selectedRequest.requested_at), "PPpp")}
                </p>
              </div>
              {selectedRequest.bank_details && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bank Details</p>
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(selectedRequest.bank_details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedRequest.status === "pending" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this decision..."
                    rows={3}
                  />
                </div>
              )}
              {selectedRequest.admin_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm">{selectedRequest.admin_notes}</p>
                </div>
              )}
            </div>
          )}
          {selectedRequest?.status === "pending" && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => handleProcess(false)}
                disabled={processing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={() => handleProcess(true)} disabled={processing}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
