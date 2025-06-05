import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Calendar, 
  FileText, 
  Shield, 
  Users, 
  Clock,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const Homepage = () => {
  const features = [
    {
      icon: Heart,
      title: "Health Monitoring",
      description: "Track your vital signs and health metrics with our advanced monitoring system.",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: Calendar,
      title: "Easy Appointments",
      description: "Schedule appointments with healthcare professionals at your convenience.",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: FileText,
      title: "Medical Records",
      description: "Secure access to your complete medical history and test results.",
      color: "bg-blue-50 text-blue-600"
    }
  ];

  const benefits = [
    "24/7 Emergency Support",
    "HIPAA Compliant Security",
    "Expert Healthcare Team",
    "Comprehensive Health Reports"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-xl">
                <Heart className="text-white h-6 w-6" />
              </div>
              <span className="font-bold text-xl text-gray-800">
                HealthMatch
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-600 hover:text-blue-500 font-medium transition-colors">
                Services
              </a>
              <a href="#about" className="text-gray-600 hover:text-blue-500 font-medium transition-colors">
                About
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-500 font-medium transition-colors">
                Contact
              </a>
              <Link 
                to="/login" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                  Your Health,
                  <span className="text-blue-500"> Our Priority</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Experience personalized healthcare with our comprehensive platform. 
                  Monitor your health, book appointments, and access medical records 
                  all in one secure place.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button 
                    size="lg" 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-green-400 text-green-600 hover:bg-green-50 px-8 py-4 rounded-xl text-lg font-semibold"
                >
                  Learn More
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-600 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-2">
                <div className="bg-gradient-to-br from-blue-500 to-green-400 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Health Dashboard</h3>
                    <Heart className="h-6 w-6" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Heart Rate</span>
                      <span className="font-bold">72 BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blood Pressure</span>
                      <span className="font-bold">120/80</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Appointment</span>
                      <span className="font-bold">Today 2:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Comprehensive Healthcare Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your health effectively, 
              from monitoring to appointments and records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
                <CardContent className="p-8">
                  <div className={`inline-flex p-4 rounded-2xl ${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-green-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
            <div className="space-y-2">
              <div className="text-4xl font-bold">10K+</div>
              <div className="text-xl opacity-90">Happy Patients</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">500+</div>
              <div className="text-xl opacity-90">Healthcare Providers</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">24/7</div>
              <div className="text-xl opacity-90">Emergency Support</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">99.9%</div>
              <div className="text-xl opacity-90">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who trust HealthMatch for their healthcare needs.
          </p>
          <Link to="/login">
            <Button 
              size="lg" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-12 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-xl">
                  <Heart className="text-white h-6 w-6" />
                </div>
                <span className="font-bold text-xl text-white">
                  HealthMatch
                </span>
              </div>
              <p className="text-gray-400">
                Your trusted partner in healthcare management and wellness.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg">Services</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Health Monitoring</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Appointments</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Medical Records</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>24/7 Support</span>
                </li>
                <li>support@healthmatch.com</li>
                <li>1-800-HEALTH</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} HealthMatch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
