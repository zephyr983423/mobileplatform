"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

const SERVICE_STATUSES = [
  "PENDING",
  "RECEIVED",
  "DIAGNOSING",
  "AWAITING_PARTS",
  "REPAIRING",
  "QA",
  "READY_TO_SHIP",
  "SHIPPING",
  "DELIVERED",
  "CLOSED",
  "RETURNED",
  "CANCELLED",
];

export default function StaffCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [serviceCase, setServiceCase] = useState<any>(null);

  // Status update form
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");

  // Round update form
  const [diagnosis, setDiagnosis] = useState("");
  const [resolution, setResolution] = useState("");
  const [cost, setCost] = useState("");
  const [warranty, setWarranty] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchCase(params.id as string);
    }
  }, [params.id]);

  const fetchCase = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/cases/${id}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch case");
      }

      setServiceCase(data.data);

      // Select latest round by default
      if (data.data.serviceRounds.length > 0) {
        const latestRound = data.data.serviceRounds[data.data.serviceRounds.length - 1];
        setSelectedRound(latestRound.id);
        setNewStatus(latestRound.status);
        setDiagnosis(latestRound.diagnosis || "");
        setResolution(latestRound.resolution || "");
        setCost(latestRound.cost?.toString() || "");
        setWarranty(latestRound.warrantyDays?.toString() || "");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRound || !newStatus) {
      toast({
        title: "Validation Error",
        description: "Please select a round and status",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/staff/rounds/${selectedRound}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus: newStatus,
          notes,
          location,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to update status");
      }

      toast({
        title: "Success",
        description: "Status updated successfully",
      });

      // Refresh case data
      fetchCase(params.id as string);
      setNotes("");
      setLocation("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateRound = async () => {
    if (!selectedRound) return;

    setUpdating(true);
    try {
      const body: any = {};
      if (diagnosis) body.diagnosis = diagnosis;
      if (resolution) body.resolution = resolution;
      if (cost) body.cost = parseFloat(cost);
      if (warranty) body.warrantyDays = parseInt(warranty);

      const res = await fetch(`/api/staff/rounds/${selectedRound}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to update round");
      }

      toast({
        title: "Success",
        description: "Round details updated successfully",
      });

      fetchCase(params.id as string);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!serviceCase) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8">
            <p>Case not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/staff/cases")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Cases
      </Button>

      {/* Case Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{serviceCase.title}</span>
            <Badge variant="outline">#{serviceCase.caseNumber}</Badge>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {serviceCase.device.brand} {serviceCase.device.model}
            {serviceCase.device.customer && (
              <> • Customer: {serviceCase.device.customer.name}</>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Update Status */}
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Service Round</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceCase.serviceRounds?.map((round: any) => (
                    <SelectItem key={round.id} value={round.id}>
                      Round {round.roundNo} - {round.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location (optional)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Repair Desk 3, Warehouse A"
              />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this status update"
                rows={3}
              />
            </div>

            <Button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="w-full"
            >
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </CardContent>
        </Card>

        {/* Update Round Details */}
        <Card>
          <CardHeader>
            <CardTitle>Round Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Diagnosis</Label>
              <Textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Technical diagnosis"
                rows={3}
              />
            </div>

            <div>
              <Label>Resolution</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="What was done to fix the issue"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Warranty (days)</Label>
                <Input
                  type="number"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="90"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateRound}
              disabled={updating}
              className="w-full"
              variant="secondary"
            >
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Details
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Status History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Status History</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceCase.serviceRounds?.map((round: any) => (
            <div key={round.id} className="mb-4 last:mb-0">
              <h4 className="font-semibold mb-2">
                Round {round.roundNo}
                {round.roundNo > 1 && " (Rework)"}
              </h4>
              <div className="space-y-2">
                {round.statusEvents
                  ?.slice(0, 3)
                  .map((event: any) => (
                    <div
                      key={event.id}
                      className="flex justify-between items-center text-sm p-2 bg-muted rounded"
                    >
                      <div>
                        <Badge className="mr-2">
                          {event.toStatus.replace(/_/g, " ")}
                        </Badge>
                        {event.location && (
                          <span className="text-muted-foreground">
                            @ {event.location}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
