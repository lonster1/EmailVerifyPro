import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  stats?: string[];
}

export function FeatureCard({ icon: Icon, title, description, stats }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-start p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {stats && stats.length > 0 && (
        <ul className="space-y-1 text-sm">
          {stats.map((stat, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{stat}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
