import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto px-4 text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <Clock className="h-24 w-24 text-primary relative animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Coming Soon
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground">
            We're working on something amazing!
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-base md:text-lg text-foreground/80 max-w-md mx-auto">
            Our medicine ordering service is currently under development. 
            We'll be launching soon with a comprehensive catalog and fast delivery options.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
            <Button
              onClick={() => navigate("/")}
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            
            <Button
              onClick={() => navigate("/appointments")}
              variant="outline"
              size="lg"
            >
              Book Appointment Instead
            </Button>
          </div>
        </div>

        <div className="pt-8 space-y-3">
          <div className="flex justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="text-sm text-muted-foreground">
            Stay tuned for updates
          </p>
        </div>
      </div>
    </div>
  );
}
