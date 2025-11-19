import { Clock } from 'lucide-react';

interface ETADisplayProps {
  eta: string;
  status: string;
}

export function ETADisplay({ eta, status }: ETADisplayProps) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[600] animate-fade-in">
      <div className="bg-background/95 backdrop-blur-lg rounded-2xl shadow-lg px-6 py-4 min-w-[200px] border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-foreground">{eta}</div>
            <div className="text-xs text-muted-foreground">{status}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
