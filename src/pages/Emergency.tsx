
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneIcon, VideoIcon, ClipboardIcon } from "lucide-react";

export default function Emergency() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Emergency Medical Services</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get immediate medical assistance. Choose your preferred method of communication.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedOption('video')}>
          <CardHeader className="text-center">
            <VideoIcon className="mx-auto h-12 w-12 text-blue-500 mb-2" />
            <CardTitle>Video Assistant</CardTitle>
            <CardDescription>Connect with AI video assistant</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedOption('phone')}>
          <CardHeader className="text-center">
            <PhoneIcon className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <CardTitle>Phone Call</CardTitle>
            <CardDescription>Receive emergency call assistance</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedOption('form')}>
          <CardHeader className="text-center">
            <ClipboardIcon className="mx-auto h-12 w-12 text-orange-500 mb-2" />
            <CardTitle>Form Interface</CardTitle>
            <CardDescription>Fill out emergency form</CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      {selectedOption && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {selectedOption === 'video' && 'Video Assistant Selected'}
              {selectedOption === 'phone' && 'Phone Call Selected'}
              {selectedOption === 'form' && 'Form Interface Selected'}
            </CardTitle>
            <CardDescription>
              Emergency service option selected. This is a simplified UI to test functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                You selected: <strong>{selectedOption}</strong>
              </p>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => alert(`Starting ${selectedOption} emergency service...`)}
              >
                Start Emergency Service
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="text-center mt-8">
        <Button 
          variant="outline" 
          onClick={() => setSelectedOption(null)}
          className="mr-4"
        >
          Reset Selection
        </Button>
        <Button 
          variant="destructive"
          onClick={() => alert('Emergency services contacted!')}
        >
          Emergency Contact
        </Button>
      </div>
    </div>
  );
}
