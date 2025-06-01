
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Star, Stethoscope, User } from "lucide-react";
import { useDoctors, useDoctorsBySpecialization } from '@/services/doctorService';
import DoctorSlots from '@/components/appointments/DoctorSlots';

const specializations = [
  "Cardiology",
  "Dermatology", 
  "Emergency Medicine",
  "Family Medicine",
  "Internal Medicine",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery"
];

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [activeTab, setActiveTab] = useState('browse');
  
  const { doctors: allDoctors, loading: allLoading, findNearbyDoctors } = useDoctors();
  const { doctors: specializedDoctors, loading: specializedLoading } = useDoctorsBySpecialization(selectedSpecialization);

  const doctors = selectedSpecialization ? specializedDoctors : allDoctors;
  const loading = selectedSpecialization ? specializedLoading : allLoading;

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.hospital.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFindNearbyDoctors = async () => {
    const success = await findNearbyDoctors();
    if (success) {
      setActiveTab('browse');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Book Appointments</h1>
          <p className="text-slate-500">Find and book appointments with verified doctors</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="browse">Browse Doctors</TabsTrigger>
            <TabsTrigger value="nearby">Find Nearby</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search doctors, specializations, or hospitals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Specializations</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading doctors...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDoctors.map((doctor) => (
                  <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {doctor.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Stethoscope className="h-4 w-4" />
                            {doctor.specialization}
                          </CardDescription>
                        </div>
                        {doctor.verified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {doctor.hospital}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {doctor.address}
                        </div>
                        {doctor.experience && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {doctor.experience} years experience
                          </div>
                        )}
                        {doctor.rating && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {doctor.rating}/5
                          </div>
                        )}
                      </div>

                      <DoctorSlots doctor={doctor} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && filteredDoctors.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No doctors found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="nearby" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Find Doctors Near You</CardTitle>
                <CardDescription>
                  Allow location access to find doctors closest to your current location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleFindNearbyDoctors} className="w-full">
                  <MapPin className="mr-2 h-4 w-4" />
                  Find Nearby Doctors
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Appointments;
