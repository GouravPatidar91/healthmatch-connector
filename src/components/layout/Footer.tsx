
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin, Shield, FileText, Users, Settings } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                <Heart className="text-white h-6 w-6" />
              </div>
              <span className="font-bold text-xl text-white">
                HealthMatch
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your trusted healthcare companion for symptom analysis, 
              appointment booking, and emergency assistance.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-slate-400">HIPAA Compliant</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-lg">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/health-check" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Health Check
                </Link>
              </li>
              <li>
                <Link to="/appointments" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Appointments
                </Link>
              </li>
              <li>
                <Link to="/medical-reports" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Medical Reports
                </Link>
              </li>
              <li>
                <Link to="/emergency" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Emergency
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-lg">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/settings" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-lg">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-slate-400">1-800-HEALTH</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-slate-400">support@healthmatch.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
                <span className="text-slate-400">
                  123 Healthcare Ave<br />
                  Medical District<br />
                  New York, NY 10001
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} HealthMatch. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
