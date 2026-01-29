import { LucideIcon, ArrowRight } from 'lucide-react';

interface ProcessStepProps {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  showArrow?: boolean;
}

export function ProcessStep({ number, icon: Icon, title, description, showArrow = true }: ProcessStepProps) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 relative">
        <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
          {number}
        </span>
        <Icon className="h-10 w-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/80 max-w-xs">{description}</p>

      {showArrow && (
        <div className="hidden lg:block absolute top-10 -right-12 text-white/30">
          <ArrowRight className="h-8 w-8" />
        </div>
      )}
    </div>
  );
}
