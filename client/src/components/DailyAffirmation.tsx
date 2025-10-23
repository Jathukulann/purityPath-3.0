import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, RefreshCw, Star } from 'lucide-react';

interface DailyAffirmationProps {
  onRefresh?: () => void;
}

export default function DailyAffirmation({ onRefresh }: DailyAffirmationProps) {
  const affirmations = [
    "You are stronger than your urges and worthy of recovery.",
    "Every day clean is a victory worth celebrating.",
    "Your journey matters, and you're making incredible progress.",
    "You have the power to choose healing over harm.",
    "Your worth isn't defined by your past, but by your courage to change.",
    "Recovery is not about perfection, it's about progress.",
    "You are building a life you can be proud of, one day at a time.",
    "Your decision to recover shows incredible strength and wisdom."
  ];

  const [currentAffirmation, setCurrentAffirmation] = useState(
    affirmations[Math.floor(Math.random() * affirmations.length)]
  );

  const handleRefresh = () => {
    const newAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
    setCurrentAffirmation(newAffirmation);
    onRefresh?.();
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-primary">Daily Affirmation</h3>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            className="text-muted-foreground hover:text-primary"
            data-testid="button-refresh-affirmation"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-center space-y-4">
          <Heart className="w-8 h-8 mx-auto text-primary/60" />
          
          <blockquote className="text-lg leading-relaxed text-foreground font-medium italic">
            "{currentAffirmation}"
          </blockquote>
          
          <p className="text-sm text-muted-foreground">
            Take a moment to let these words sink in
          </p>
        </div>
      </div>
    </Card>
  );
}