
import React from 'react';
import { motion } from 'framer-motion';
import { EmergencyForm } from '@/components/sos/EmergencyForm';

export default function Emergency() {
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
            Connect with doctors immediately for urgent medical situations. 
            Fill out the form below to get help right away.
          </p>
        </div>
        
        <EmergencyForm />
      </motion.div>
    </div>
  );
}
