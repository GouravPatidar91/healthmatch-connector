
import React from 'react';
import { useDoctorNotifications } from '@/services/doctorNotificationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCircle, Clock, User } from "lucide-react";

const DoctorNotifications = () => {
  const { notifications, loading, error, markAsRead, markAsAcknowledged } = useDoctorNotifications();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading notifications: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />New</Badge>;
      case 'read':
        return <Badge variant="outline"><Bell className="w-3 h-3 mr-1" />Read</Badge>;
      case 'acknowledged':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Acknowledged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No patient health check notifications yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{notification.patient_name}</CardTitle>
                      <CardDescription>
                        Health Check Shared • {formatDate(notification.created_at)}
                        {notification.appointment_date && (
                          <span className="ml-2">
                            • Appointment: {new Date(notification.appointment_date).toLocaleDateString()}
                            {notification.appointment_time && ` at ${notification.appointment_time}`}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(notification.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Symptoms</h4>
                    <div className="flex flex-wrap gap-1">
                      {notification.symptoms_data?.symptoms?.map((symptom: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Severity & Duration</h4>
                    <p className="text-sm">
                      <span className="font-medium">Severity:</span> {notification.symptoms_data?.severity || 'Not specified'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Duration:</span> {notification.symptoms_data?.duration || 'Not specified'}
                    </p>
                  </div>
                </div>

                {notification.symptoms_data?.urgency_level && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Urgency Level</h4>
                    <Badge variant={notification.symptoms_data.urgency_level === 'High' ? 'destructive' : 'secondary'}>
                      {notification.symptoms_data.urgency_level}
                    </Badge>
                  </div>
                )}

                {notification.symptoms_data?.overall_assessment && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Overall Assessment</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {notification.symptoms_data.overall_assessment}
                    </p>
                  </div>
                )}

                {notification.symptoms_data?.previous_conditions && notification.symptoms_data.previous_conditions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Previous Conditions</h4>
                    <div className="flex flex-wrap gap-1">
                      {notification.symptoms_data.previous_conditions.map((condition: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {notification.symptoms_data?.medications && notification.symptoms_data.medications.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Current Medications</h4>
                    <div className="flex flex-wrap gap-1">
                      {notification.symptoms_data.medications.map((medication: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {medication}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {notification.symptoms_data?.notes && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Additional Notes</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {notification.symptoms_data.notes}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2 pt-3 border-t">
                  {notification.status === 'sent' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as Read
                    </Button>
                  )}
                  {notification.status !== 'acknowledged' && (
                    <Button
                      size="sm"
                      onClick={() => markAsAcknowledged(notification.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorNotifications;
