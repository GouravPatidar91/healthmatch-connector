
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EmergencyForm } from '@/components/sos/EmergencyForm';
import VoiceInterface from '@/components/sos/VoiceInterface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneIcon, ClipboardIcon } from "lucide-react";

export default function Emergency() {
  const [activeTab, setActiveTab] = useState<string>("voice");
  
  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Emergency Medical Services</h1>
          <p className="text-gray-600 text-center max-w-2xl">
            Get immediate medical assistance with our AI-powered emergency service.
            Choose between our voice assistant or fill out the form manually.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-3xl mx-auto">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="voice" className="flex items-center">
              <PhoneIcon className="mr-2 h-4 w-4" /> Voice Assistant
            </TabsTrigger>
            <TabsTrigger value="form">
              <span className="flex items-center">
                <ClipboardIcon className="mr-2 h-4 w-4" />
                Form Interface
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="voice">
            <VoiceInterface />
          </TabsContent>
          
          <TabsContent value="form">
            <EmergencyForm />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
