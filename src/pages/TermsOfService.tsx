import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  Users, 
  CreditCard, 
  Scale, 
  Mail, 
  Phone,
  Heart,
  Stethoscope,
  Truck,
  CheckCircle,
  XCircle,
  Globe,
  RefreshCw,
  ArrowLeft
} from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-slate-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-slate-400 mt-1">Last updated: January 9, 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Introduction */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600 leading-relaxed">
              Welcome to Curezy. These Terms of Service ("Terms") govern your access to and use of the Curezy 
              platform, mobile applications, and services (collectively, the "Services"). By accessing or using 
              our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please 
              do not use our Services.
            </p>
            <p className="text-slate-600 leading-relaxed mt-4">
              Curezy is operated by Curezy Healthcare Technologies Private Limited, a company registered in 
              India. These Terms constitute a legally binding agreement between you and Curezy.
            </p>
          </CardContent>
        </Card>

        {/* Acceptance of Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <CheckCircle className="h-5 w-5 text-green-600" />
              1. Acceptance of Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-600">By using Curezy, you acknowledge that you have read, understood, and agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
              <li>These Terms of Service in their entirety</li>
              <li>Our <Link to="/Privacy Policy" className="text-blue-600 hover:underline">Privacy Policy</Link></li>
              <li>Any additional terms and conditions that may apply to specific features or services</li>
              <li>Comply with all applicable laws and regulations in India</li>
            </ul>
            <p className="text-slate-600 mt-4">
              We reserve the right to modify these Terms at any time. Continued use of the Services after 
              changes constitutes acceptance of the modified Terms.
            </p>
          </CardContent>
        </Card>

        {/* Service Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Heart className="h-5 w-5 text-red-500" />
              2. Description of Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">Curezy provides the following healthcare-related services:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <Stethoscope className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">AI Health Analysis</h4>
                  <p className="text-sm text-slate-600">Symptom assessment and preliminary health guidance using artificial intelligence</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Doctor Appointments</h4>
                  <p className="text-sm text-slate-600">Online booking and management of appointments with healthcare professionals</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <Truck className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Medicine Delivery</h4>
                  <p className="text-sm text-slate-600">Ordering and delivery of medicines from licensed pharmacies</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Medical Records</h4>
                  <p className="text-sm text-slate-600">Secure storage and management of your health documents</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Eligibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Users className="h-5 w-5 text-blue-600" />
              3. User Eligibility & Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-600">To use our Services, you must:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
              <li>Be at least 18 years of age, or have parental/guardian consent if a minor</li>
              <li>Be legally capable of entering into binding contracts under Indian law</li>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update your information if it changes</li>
              <li>Accept full responsibility for all activities under your account</li>
            </ul>
            <p className="text-slate-600 mt-4">
              You agree to notify us immediately of any unauthorized access or security breach of your account.
            </p>
          </CardContent>
        </Card>

        {/* Medical Disclaimer - Important */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              4. Important Medical Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-amber-200">
              <p className="text-amber-900 font-semibold mb-2">Please Read Carefully:</p>
              <ul className="space-y-3 text-amber-800">
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Curezy is NOT a substitute for professional medical advice, diagnosis, or treatment</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>AI-generated health assessments are for informational purposes only</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Always seek advice from qualified healthcare providers for medical conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>In case of medical emergency, contact emergency services immediately (102/108)</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>We do not guarantee the accuracy, completeness, or reliability of AI health assessments</span>
                </li>
              </ul>
            </div>
            <p className="text-amber-800 text-sm">
              By using our health assessment features, you acknowledge and accept that any reliance on such 
              information is at your own risk.
            </p>
          </CardContent>
        </Card>

        {/* Acceptable Use */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Shield className="h-5 w-5 text-green-600" />
              5. Acceptable Use Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
              <li>Use the Services for any unlawful purpose or in violation of any laws</li>
              <li>Impersonate any person or entity, or falsely represent your affiliation</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Harvest or collect user information without consent</li>
              <li>Use the Services for commercial purposes without authorization</li>
              <li>Misuse prescription medicines or attempt to obtain medicines fraudulently</li>
              <li>Provide false prescriptions or medical documents</li>
            </ul>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Globe className="h-5 w-5 text-purple-600" />
              6. Intellectual Property Rights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-600">
              All content, features, and functionality of the Services, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
              <li>Text, graphics, logos, icons, images, and software</li>
              <li>The Curezy name, logo, and trademarks</li>
              <li>AI algorithms and health assessment methodologies</li>
              <li>User interface design and user experience elements</li>
            </ul>
            <p className="text-slate-600 mt-4">
              Are owned by Curezy or its licensors and are protected by Indian and international copyright, 
              trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or 
              create derivative works without our express written permission.
            </p>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <CreditCard className="h-5 w-5 text-blue-600" />
              7. Payment Terms & Refunds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Payment Methods</h4>
              <p className="text-slate-600">
                We accept various payment methods including UPI, credit/debit cards, net banking, 
                and Cash on Delivery (for medicine orders). All payments are processed securely through 
                our payment partners.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Pricing</h4>
              <p className="text-slate-600">
                All prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes 
                unless otherwise stated. We reserve the right to modify prices at any time.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Refunds & Cancellations</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Medicine orders can be cancelled before dispatch for a full refund</li>
                <li>Prescription medicines cannot be returned once delivered (as per Indian law)</li>
                <li>Appointment cancellations must be made at least 2 hours before the scheduled time</li>
                <li>Refunds are processed within 5-7 business days to the original payment method</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Shield className="h-5 w-5 text-teal-600" />
              8. Privacy & Data Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-600">
              Your privacy is important to us. Our collection, use, and protection of your personal 
              information is governed by our <Link to="/Privacy Policy" className="text-blue-600 hover:underline">Privacy Policy</Link>, 
              which is incorporated into these Terms by reference.
            </p>
            <p className="text-slate-600">
              We are committed to protecting your health information in accordance with applicable Indian 
              data protection laws and industry best practices.
            </p>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Scale className="h-5 w-5 text-slate-600" />
              9. Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-600">
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
              <li>Curezy provides the Services "as is" without warranties of any kind</li>
              <li>We do not guarantee uninterrupted, secure, or error-free operation of the Services</li>
              <li>We are not liable for any indirect, incidental, special, or consequential damages</li>
              <li>Our total liability shall not exceed the amount paid by you in the preceding 12 months</li>
              <li>We are not responsible for actions of third-party healthcare providers, pharmacies, or delivery partners</li>
            </ul>
            <p className="text-slate-600 mt-4">
              Some jurisdictions do not allow limitation of liability, so some of the above may not apply to you.
            </p>
          </CardContent>
        </Card>

        {/* Indemnification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Shield className="h-5 w-5 text-indigo-600" />
              10. Indemnification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              You agree to indemnify, defend, and hold harmless Curezy, its officers, directors, employees, 
              agents, and affiliates from any claims, damages, losses, liabilities, costs, and expenses 
              (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4 mt-3">
              <li>Your use or misuse of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you submit or upload to the Services</li>
            </ul>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <XCircle className="h-5 w-5 text-red-500" />
              11. Termination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-600">
              We may suspend or terminate your access to the Services at any time, without prior notice, 
              for any reason, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
              <li>Violation of these Terms</li>
              <li>Suspected fraudulent, abusive, or illegal activity</li>
              <li>Request by law enforcement or government agencies</li>
              <li>Discontinuation or modification of the Services</li>
            </ul>
            <p className="text-slate-600 mt-4">
              You may terminate your account at any time by contacting us. Upon termination, your right 
              to use the Services will immediately cease.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Scale className="h-5 w-5 text-blue-600" />
              12. Governing Law & Dispute Resolution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-600">
              These Terms shall be governed by and construed in accordance with the laws of India, 
              without regard to conflict of law principles.
            </p>
            <p className="text-slate-600">
              Any disputes arising from these Terms or the Services shall be subject to the exclusive 
              jurisdiction of the courts in Bengaluru, Karnataka, India.
            </p>
            <p className="text-slate-600">
              Before initiating legal proceedings, you agree to attempt to resolve disputes through 
              good-faith negotiation or mediation.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <RefreshCw className="h-5 w-5 text-orange-600" />
              13. Changes to Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-600">
              We reserve the right to modify these Terms at any time. When we make material changes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
              <li>We will update the "Last Updated" date at the top of this page</li>
              <li>We may notify you via email or through the Services</li>
              <li>Continued use of the Services after changes constitutes acceptance</li>
            </ul>
            <p className="text-slate-600 mt-4">
              We encourage you to review these Terms periodically for any updates.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Mail className="h-5 w-5 text-blue-600" />
              14. Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-blue-800">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">legal@curezy.in</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-slate-900">1-800-CUREZY</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Registered Office</p>
              <p className="text-slate-900">
                Curezy Healthcare Technologies Private Limited<br />
                123 Healthcare Avenue, Tech Park<br />
                Bengaluru, Karnataka 560001, India
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Agreement */}
        <Card className="bg-slate-900 text-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Agreement Acknowledgment</h3>
                <p className="text-slate-300">
                  By using Curezy, you acknowledge that you have read, understood, and agree to be bound 
                  by these Terms of Service and our Privacy Policy. If you are using the Services on behalf 
                  of an organization, you represent that you have the authority to bind that organization 
                  to these Terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-slate-400 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-white hover:text-blue-400 transition-colors">
            <Heart className="h-5 w-5" />
            <span className="font-semibold">Curezy</span>
          </Link>
          <p className="mt-2 text-sm">
            © {new Date().getFullYear()} Curezy Healthcare Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
