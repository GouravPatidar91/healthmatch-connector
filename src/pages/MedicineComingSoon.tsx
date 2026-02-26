import { Pill, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function MedicineComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center py-16">
      <div className="max-w-2xl mx-auto px-4 text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <Pill className="h-24 w-24 text-primary relative animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Medicine Delivery Coming Soon
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Your pharmacy, delivered to your doorstep!
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-base md:text-lg text-foreground/80 max-w-md mx-auto">
            We're building a fast, reliable medicine delivery service with a comprehensive catalog, prescription uploads, and real-time order tracking. Stay tuned!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
            <Button onClick={() => navigate("/dashboard")} size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="pt-8 space-y-3">
          <div className="flex justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="text-sm text-muted-foreground">Stay tuned for updates</p>
        </div>
      </div>
    </div>
  );
}
