import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  Activity,
  Calendar,
  ShieldCheck,
  FileText,
  Stethoscope,
  Pill,
  Truck,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Homepage = () => {
  return (
    <div className="font-sans antialiased text-gray-900 bg-white overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <Hero />
      <div id="services">
        <Features />
      </div>
      <div id="partners">
        <Network />
      </div>
      <Stats />
      <CTA />
      <div id="contact">
        <Footer />
      </div>
    </div>
  );
};

// --- Navbar ---
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Heart className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            Curezy
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Services", "Partners", "Contact"].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item.toLowerCase())}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              {item}
            </button>
          ))}
          <Button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-blue-600/20"
          >
            Login
          </Button>
        </div>

        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <X className="text-gray-800" />
            ) : (
              <Menu className="text-gray-800" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-4 flex flex-col gap-4"
        >
          {["Services", "Partners", "Contact"].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item.toLowerCase())}
              className="text-gray-800 font-medium py-2 border-b border-gray-100 text-left"
            >
              {item}
            </button>
          ))}
          <Button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold"
          >
            Login
          </Button>
        </motion.div>
      )}
    </nav>
  );
};

// --- Hero ---
const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
            Your Health, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Reimagined
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
            Experience next-generation healthcare with AI-powered symptom
            analysis, smart appointment booking, and comprehensive health
            monitoring.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button
              onClick={() => navigate("/login")}
              className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Sign Up <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Login
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" /> 24/7 AI Health
              Assistant
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" /> HIPAA Compliant
              Security
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" /> Expert
              Healthcare Network
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" /> Comprehensive
              Analytics
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-6 max-w-md mx-auto relative z-20"
          >
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Health Dashboard</h3>
                  <p className="text-xs text-green-500 font-medium">
                    ● System Active
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 flex justify-between items-center">
                <div>
                  <p className="text-blue-100 text-sm">Heart Rate</p>
                  <p className="text-2xl font-bold">72 BPM</p>
                </div>
                <Heart className="w-8 h-8 text-blue-200 animate-pulse" />
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-gray-500 text-sm">Blood Pressure</p>
                  <p className="text-xl font-bold text-gray-800">
                    120/80{" "}
                    <span className="text-sm font-normal text-gray-400">
                      mmHg
                    </span>
                  </p>
                </div>
                <div className="h-8 w-24 bg-blue-50 rounded-lg overflow-hidden flex items-end gap-1 px-1 pb-1">
                  {[40, 60, 45, 70, 50, 65].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-full bg-blue-400 rounded-t-sm"
                    ></div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">
                    Next Appointment
                  </p>
                  <p className="text-gray-800 font-semibold">Today, 2:00 PM</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="absolute top-10 -right-10 z-10 bg-white p-4 rounded-2xl shadow-xl animate-bounce-slow hidden lg:block">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-green-500" />
              <span className="font-bold text-gray-700">Secure</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// --- Features ---
const Features = () => {
  const features = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "AI Health Analysis",
      desc: "Advanced symptom analysis powered by machine learning for accurate health insights.",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Smart Scheduling",
      desc: "Effortlessly book appointments with top healthcare professionals in your area.",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Digital Health Records",
      desc: "Secure, encrypted access to your complete medical history and test results.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Intelligent Healthcare Solutions
          </h2>
          <p className="text-gray-600 text-lg">
            Harness the power of AI and modern technology to transform your
            healthcare experience with personalized insights.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              whileHover={{ y: -10 }}
              className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feat.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Network ---
const Network = () => {
  const navigate = useNavigate();
  
  const partners = [
    {
      icon: <Stethoscope className="w-7 h-7" />,
      title: "Healthcare Providers",
      subtitle: "Join as a doctor or clinic",
      route: "/doctor-registration",
    },
    {
      icon: <Pill className="w-7 h-7" />,
      title: "Pharmacy Partners",
      subtitle: "List your pharmacy with us",
      route: "/vendor-registration",
    },
    {
      icon: <Truck className="w-7 h-7" />,
      title: "Delivery Partners",
      subtitle: "Earn by delivering medicines",
      route: "/delivery-partner-registration",
    },
  ];

  return (
    <section className="py-24 bg-blue-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Join Our Network
          </h2>
          <p className="text-blue-100 text-lg">
            Become a partner and help us deliver healthcare to more people
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {partners.map((partner, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 transition-colors"
            >
              <div className="w-14 h-14 mx-auto bg-white rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-lg">
                {partner.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{partner.title}</h3>
              <p className="text-blue-100 text-sm mb-6">{partner.subtitle}</p>
              <button
                onClick={() => navigate(partner.route)}
                className="w-full py-2 bg-transparent border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
              >
                Register Now
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Stats ---
const Stats = () => {
  const stats = [
    { label: "Happy Patients", val: "50K+" },
    { label: "Healthcare Providers", val: "1K+" },
    { label: "AI Assistant", val: "24/7" },
    { label: "Uptime Guarantee", val: "99.9%" },
  ];

  return (
    <section className="py-16 bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-200/50">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-4"
            >
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                {stat.val}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- CTA ---
const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-white text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto px-4"
      >
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          Ready to Transform Your Healthcare?
        </h2>
        <p className="text-gray-600 text-xl mb-10 max-w-2xl mx-auto">
          Join thousands of users who trust Curezy for intelligent, personalized
          healthcare management.
        </p>
        <Button
          onClick={() => navigate("/login")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-10 py-4 rounded-full font-bold shadow-xl shadow-blue-600/30 hover:scale-105 transition-transform"
        >
          Get Started
        </Button>
      </motion.div>
    </section>
  );
};

// --- Footer ---
const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Heart className="fill-blue-600 text-blue-600" />
            <span className="text-2xl font-bold">Curezy</span>
          </div>
          <p className="text-gray-400 text-sm">
            Your trusted partner in healthcare management and wellness.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Services</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <button
                onClick={() => navigate("/health-check")}
                className="hover:text-blue-400 transition-colors"
              >
                Health Monitoring
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/appointments")}
                className="hover:text-blue-400 transition-colors"
              >
                Appointments
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/medical-reports")}
                className="hover:text-blue-400 transition-colors"
              >
                Medical Records
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Partners</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <button
                onClick={() => navigate("/doctor-registration")}
                className="hover:text-blue-400 transition-colors"
              >
                Become a Doctor
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/vendor-registration")}
                className="hover:text-blue-400 transition-colors"
              >
                Register Pharmacy
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/delivery-partner-registration")}
                className="hover:text-blue-400 transition-colors"
              >
                Delivery Partner
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Headphones className="w-4 h-4" /> 24/7 Support
            </li>
            <li>admin@curezy.in</li>
            <li>1-800-HEALTH</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
        © 2025 Curezy. All rights reserved.
      </div>
    </footer>
  );
};

export default Homepage;
