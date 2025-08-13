import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, Users, Clock, Award, AlertTriangle, Phone, Mail, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
const InternshipTerms = () => {
  return <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Briefcase className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900">Internship Terms & Conditions</h1>
          </div>
          <p className="text-lg text-slate-600">
            Join the Curezy team and gain valuable healthcare technology experience
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Back to Home Button */}
        <div className="mb-8">
          <Link to="/">
            
          </Link>
        </div>

        {/* Introduction */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              Welcome to Curezy Internship Program
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed">
              Welcome to the Curezy Internship Program! We are excited to offer talented individuals the opportunity to gain hands-on experience in healthcare technology, medical innovation, and digital health solutions. By participating in our internship program, you agree to the following terms and conditions.
            </p>
          </CardContent>
        </Card>

        {/* Program Overview */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Award className="h-6 w-6 text-green-600" />
              Program Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Duration & Commitment</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Internship duration: 3-6 months (flexible based on program track)</li>
                <li>Minimum commitment: 20 hours per week for part-time, 40 hours for full-time</li>
                <li>Remote work opportunities available with occasional in-person collaboration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Available Tracks</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Software Development (Frontend, Backend, Full-stack)</li>
                <li>Product Management & Strategy</li>
                <li>UI/UX Design & Research</li>
                <li>Data Science & Healthcare Analytics</li>
                <li>Digital Marketing & Content Creation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Eligibility & Requirements */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-purple-600" />
              Eligibility & Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Currently enrolled in or recently graduated from a relevant degree program</li>
              <li>Demonstrated interest in healthcare technology and digital health solutions</li>
              <li>Strong communication skills and ability to work in a collaborative environment</li>
              <li>Basic technical skills relevant to chosen track (portfolio/projects preferred)</li>
              <li>Commitment to maintaining confidentiality and professional conduct</li>
              <li>Legal authorization to work as an intern in your jurisdiction</li>
            </ul>
          </CardContent>
        </Card>

        {/* Responsibilities & Expectations */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-orange-600" />
              Responsibilities & Expectations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Intern Responsibilities</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Actively participate in assigned projects and team meetings</li>
                <li>Meet deadlines and deliverables as outlined by supervisors</li>
                <li>Maintain regular communication with mentors and team members</li>
                <li>Adhere to company policies, procedures, and code of conduct</li>
                <li>Contribute to a positive and inclusive work environment</li>
                <li>Participate in learning sessions and professional development activities</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Company Commitments</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Provide mentorship and guidance from experienced professionals</li>
                <li>Offer meaningful projects that contribute to real healthcare solutions</li>
                <li>Create learning opportunities and skill development workshops</li>
                <li>Maintain a supportive and inclusive work environment</li>
                <li>Provide feedback and performance evaluations</li>
                <li>Consider outstanding interns for full-time opportunities</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Compensation & Benefits */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle>Compensation & Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-slate-700">
                <strong>Stipend:</strong> Competitive monthly stipend based on track and experience level
              </p>
              <p className="text-slate-700">
                <strong>Benefits Include:</strong>
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                <li>Professional mentorship and career guidance</li>
                <li>Access to company learning resources and training materials</li>
                <li>Networking opportunities with healthcare technology professionals</li>
                <li>Certificate of completion and letter of recommendation</li>
                <li>Flexible working arrangements and modern development tools</li>
                <li>Opportunity to contribute to real healthcare innovation projects</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Confidentiality & Intellectual Property */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Confidentiality & Intellectual Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              <strong>Confidentiality:</strong> Interns must maintain strict confidentiality regarding all proprietary information, patient data (if applicable), business strategies, and technical developments encountered during the internship.
            </p>
            <p className="text-slate-700">
              <strong>Intellectual Property:</strong> All work products, inventions, and developments created during the internship period belong to Curezy. Interns agree to assign all rights to such intellectual property to the company.
            </p>
            <p className="text-slate-700">
              <strong>Non-Disclosure:</strong> Confidentiality obligations continue beyond the internship period and are binding for a period of 2 years post-completion.
            </p>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-slate-600" />
              Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              <strong>General Limitation:</strong> Curezy shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or relating to the intern's participation in the internship program.
            </p>
            <p className="text-slate-700">
              <strong>Scope of Limitation:</strong> This limitation includes, but is not limited to, damages for loss of profits, data, use, goodwill, or other intangible losses, even if Curezy has been advised of the possibility of such damages.
            </p>
            <p className="text-slate-700">
              <strong>Personal Responsibility:</strong> Interns participate in the program at their own risk and are responsible for their own actions, decisions, and any consequences arising therefrom during the internship period.
            </p>
            <p className="text-slate-700">
              <strong>Maximum Liability:</strong> In no event shall Curezy's total liability to any intern exceed the total amount of stipend paid to that intern during the internship period.
            </p>
            <p className="text-slate-700 text-sm">
              <em>Note: This limitation of liability clause does not exclude liability for death or personal injury caused by negligence, fraud, or other matters where liability cannot be excluded or limited by applicable law.</em>
            </p>
          </CardContent>
        </Card>

        {/* Termination & Completion */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle>Termination & Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              <strong>Successful Completion:</strong> Interns who successfully complete the program will receive a certificate of completion, performance evaluation, and letter of recommendation.
            </p>
            <p className="text-slate-700 mb-4">
              <strong>Early Termination:</strong> Either party may terminate the internship with 2 weeks' notice. Grounds for immediate termination include violation of company policies, confidentiality breaches, or unsatisfactory performance.
            </p>
            <p className="text-slate-700">
              <strong>Return of Materials:</strong> Upon completion or termination, interns must return all company property, including devices, documents, and access credentials.
            </p>
          </CardContent>
        </Card>

        {/* Application Process */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle>Application Process</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside text-slate-700 space-y-2">
              <li>Submit online application with resume and cover letter</li>
              <li>Complete skills assessment relevant to chosen track</li>
              <li>Participate in initial screening interview</li>
              <li>Technical/portfolio review with team members</li>
              <li>Final interview with program coordinator</li>
              <li>Reference checks and background verification</li>
              <li>Offer letter and program onboarding</li>
            </ol>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-green-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              For questions about the internship program or application process, please contact us:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700">internships@curezy.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700">1-800-CUREZY-1 (1-800-287-3991)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agreement */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Agreement Acceptance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              By applying for and participating in the Curezy Internship Program, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions. These terms may be updated periodically, and participants will be notified of any material changes.
            </p>
            <p className="text-slate-600 text-sm mt-4">
              This agreement is governed by the laws of the jurisdiction where Curezy operates. Any disputes arising from this internship program will be resolved through appropriate legal channels.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default InternshipTerms;
