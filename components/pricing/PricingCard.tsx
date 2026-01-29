import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PricingCardProps {
  credits: number;
  price: number;
  badge?: string;
  isPopular?: boolean;
  onSelect?: () => void;
}

export function PricingCard({ credits, price, badge, isPopular, onSelect }: PricingCardProps) {
  const costPerEmail = (price / credits).toFixed(4);
  const formattedCredits = credits.toLocaleString();
  const formattedPrice = `$${price}`;

  return (
    <Card className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            {badge}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl font-bold">{formattedPrice}</CardTitle>
        <CardDescription className="text-lg font-medium mt-2">
          {formattedCredits} Credits
        </CardDescription>
        <p className="text-sm text-muted-foreground mt-1">
          ${costPerEmail} per email
        </p>
      </CardHeader>

      <CardContent className="space-y-3 pb-6">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm">Never-expiring credits</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm">Full API access</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm">Email support</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm">All features included</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm">Free unknown results</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? "default" : "outline"}
          onClick={onSelect}
        >
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
}
