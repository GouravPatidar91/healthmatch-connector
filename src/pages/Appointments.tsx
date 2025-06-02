
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, MapPin, Phone, Stethoscope, Star, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppointmentBooking } from "@/services/appointmentService";
import { useDoctors } from "@/services/doctorService";
import PatientAppointments from "@/components/appointments/PatientAppointments";
import DoctorSlots from "@/components/appointments/DoctorSlots";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";

const specializations = [
  "Cardiology",
  "Dermatology", 
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology"
];

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  
  const { doctors, loading, findNearbyDoctors } = useDoctors();

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.hospital.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const specializedDoctors = selectedSpecialization === 'all' 
    ? filteredDoctors 
    : filteredDoctors.filter(doctor => 
        doctor.specialization.toLowerCase() === selectedSpecialization.toLowerCase()
      );

  const handleFindNearbyDoctors = async () => {
    const success = await findNearbyDoctors();
    if (success) {
      setActiveTab('browse');
    }
  };

  const handleBookAppointment = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowBookingDialog(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-sage-700">Book Appointments</h1>
          <p className="text-slate-custom">Find and book appointments with verified doctors</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="my-appointments">My Appointments</TabsTrigger>
            <TabsTrigger value="browse">Browse Doctors</TabsTrigger>
            <TabsTrigger value="nearby">Find Nearby</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-appointments" className="space-y-6">
            <PatientAppointments />
          </TabsContent>
          
          <TabsContent value="browse" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search doctors, specializations, or hospitals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-sage-200 focus:ring-sage-500"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                  <SelectTrigger className="border-sage-200 focus:ring-sage-500">
                    <SelectValue placeholder="All Specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sage-500 mx-auto"></div>
                <p className="mt-4 text-slate-custom">Loading doctors...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {specializedDoctors.map((doctor) => (
                  <Card key={doctor.id} className="card-modern">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-slate-custom">
                            <User className="h-5 w-5 text-sage-600" />
                            {doctor.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Stethoscope className="h-4 w-4 text-coral-500" />
                            {doctor.specialization}
                          </CardDescription>
                        </div>
                        {doctor.verified && (
                          <Badge className="bg-sage-100 text-sage-800 border-sage-200">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-custom">
                          <MapPin className="h-4 w-4 text-sage-500" />
                          {doctor.hospital}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-custom">
                          <MapPin className="h-4 w-4 text-sage-500" />
                          {doctor.address}
                        </div>
                        {doctor.experience && (
                          <div className="flex items-center gap-2 text-sm text-slate-custom">
                            <Clock className="h-4 w-4 text-sage-500" />
                            {doctor.experience} years experience
                          </div>
                        )}
                        {doctor.rating && (
                          <div className="flex items-center gap-2 text-sm text-slate-custom">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {doctor.rating}/5
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleBookAppointment(doctor)}
                          className="btn-primary flex-1"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Book Appointment
                        </Button>
                      </div>

                      <DoctorSlots doctor={doctor} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && specializedDoctors.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-custom">No doctors found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="nearby" className="space-y-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sage-700">Find Doctors Near You</CardTitle>
                <CardDescription>
                  Allow location access to find doctors closest to your current location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleFindNearbyDoctors} className="btn-primary w-full">
                  <MapPin className="mr-2 h-4 w-4" />
                  Find Nearby Doctors
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <BookAppointmentDialog 
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          selectedDoctor={selectedDoctor}
        />
      </div>
    </div>
  );
};

export default Appointments;
