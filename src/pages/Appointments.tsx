import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { mockDoctors } from "@/data/mockData";
import { Doctor } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, MapPin, Calendar as CalendarIcon, Clock } from "lucide-react";

const Appointments = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const fromHealthCheck = location.state?.fromHealthCheck || false;
  const symptoms = location.state?.symptoms || [];
  const possibleConditions = location.state?.possibleConditions || [];
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(mockDoctors);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reason, setReason] = useState<string>(
    fromHealthCheck && possibleConditions.length > 0
      ? `Consultation regarding possible ${possibleConditions[0].name} based on symptoms: ${symptoms.join(", ")}`
      : ""
  );
  
  const [step, setStep] = useState(1);
  
  const filterDoctorsByRegion = (region: string) => {
    if (!region) {
      setFilteredDoctors(mockDoctors);
    } else {
      setFilteredDoctors(mockDoctors.filter(doctor => doctor.region === region));
    }
  };
  
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    filterDoctorsByRegion(region);
  };
  
  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  const getAvailableTimesForSelectedDate = () => {
    if (!selectedDoctor || !selectedDate) return [];
    
    const dayOfWeek = format(selectedDate, "EEEE");
    const availabilityForDay = selectedDoctor.availability.find(
      (a) => a.day === dayOfWeek
    );
    
    return availabilityForDay?.slots || [];
  };
  
  const confirmAppointment = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select a doctor, date, and time for your appointment.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send data to the backend
    toast({
      title: "Appointment Booked!",
      description: `Your appointment with ${selectedDoctor.name} on ${format(selectedDate, "MMMM d, yyyy")} at ${selectedTime} has been confirmed.`
    });
    
    navigate("/dashboard");
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Book an Appointment</h1>
      
      <Tabs defaultValue="upcoming" className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="new" className="bg-medical-green-light">Book New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>View your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-medical-blue/10 p-6 rounded-lg text-center">
                <p className="text-lg font-medium">You have one upcoming appointment</p>
                <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Dr. Sarah Johnson</h3>
                      <p className="text-medical-neutral-dark">General Practitioner</p>
                      <div className="flex items-center mt-2">
                        <MapPin className="h-4 w-4 text-medical-neutral-dark mr-1" />
                        <span className="text-sm">City Medical Center</span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:text-right">
                      <div className="flex items-center justify-start md:justify-end">
                        <CalendarIcon className="h-4 w-4 text-medical-blue mr-1" />
                        <span>October 15, 2023</span>
                      </div>
                      <div className="flex items-center justify-start md:justify-end mt-1">
                        <Clock className="h-4 w-4 text-medical-blue mr-1" />
                        <span>10:00 AM</span>
                      </div>
                      <Badge className="mt-2" variant="outline">Confirmed</Badge>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full sm:w-auto">Reschedule</Button>
                    <Button variant="ghost" className="mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto text-medical-red-dark">Cancel</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Appointments</CardTitle>
              <CardDescription>View your previous appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-medical-neutral-dark">
                <p>You have no past appointments.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Book a New Appointment</CardTitle>
              <CardDescription>Step {step}: {step === 1 ? "Select a doctor" : "Choose date and time"}</CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Filter by region:</label>
                    <Select value={selectedRegion} onValueChange={handleRegionChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All regions</SelectItem>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                        <SelectItem value="Central">Central</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-4">
                    {filteredDoctors.map((doctor) => (
                      <Card key={doctor.id} className="overflow-hidden card-hover">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{doctor.name}</h3>
                                <p className="text-sm text-medical-neutral-dark">{doctor.specialization}</p>
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                                <span className="text-sm font-medium">{doctor.rating}</span>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center text-sm text-medical-neutral-dark">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{doctor.hospital}, {doctor.region}</span>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-1">
                              {doctor.availability.slice(0, 3).map((day, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {day.day.slice(0, 3)}
                                </Badge>
                              ))}
                              {doctor.availability.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{doctor.availability.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="border-t p-3 bg-gray-50">
                            <Button 
                              onClick={() => handleDoctorSelect(doctor)}
                              className="w-full"
                            >
                              Select
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {filteredDoctors.length === 0 && (
                      <div className="text-center py-8 text-medical-neutral-dark">
                        <p>No doctors found in this region.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {step === 2 && selectedDoctor && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{selectedDoctor.name}</h3>
                          <p className="text-sm text-medical-neutral-dark">{selectedDoctor.specialization}</p>
                          <div className="mt-1 flex items-center text-sm text-medical-neutral-dark">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{selectedDoctor.hospital}, {selectedDoctor.region}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setStep(1)}
                        >
                          Change
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Select a date:</h3>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="border rounded-md"
                        disabled={(date) => {
                          // Disable dates in the past
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // Disable weekend (6 = Saturday, 0 = Sunday)
                          const day = date.getDay();
                          const isWeekend = day === 0 || day === 6;
                          
                          return date < today || isWeekend;
                        }}
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Select a time:</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {getAvailableTimesForSelectedDate().length > 0 ? (
                          getAvailableTimesForSelectedDate().map((time, index) => (
                            <Button
                              key={index}
                              variant={selectedTime === time ? "default" : "outline"}
                              onClick={() => handleTimeSelect(time)}
                              className={`text-center ${
                                selectedTime === time ? "bg-medical-blue" : ""
                              }`}
                            >
                              {time}
                            </Button>
                          ))
                        ) : (
                          <div className="col-span-3 text-center py-4 text-medical-neutral-dark">
                            <p>No available times for selected date.</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="font-medium mb-3">Reason for visit:</h3>
                        <Textarea
                          placeholder="Please describe your symptoms or reason for the appointment..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            {step === 2 && (
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button 
                  onClick={confirmAppointment}
                  disabled={!selectedTime || !selectedDate}
                >
                  Confirm Appointment
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Appointments;
