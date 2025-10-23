import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles, Heart, Target } from 'lucide-react';

interface CongratsModalProps {
  isOpen: boolean;
  goalDays: number;
  onClose: () => void;
}

export default function CongratsModal({ isOpen, goalDays, onClose }: CongratsModalProps) {
  const [, setLocation] = useLocation();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Reset confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSetNewGoal = () => {
    const params = new URLSearchParams({
      completed: 'true',
      previousGoal: goalDays.toString()
    });
    setLocation(`/goal-settings?${params.toString()}`);
    onClose();
  };

  const getMessage = () => {
    if (goalDays >= 365) {
      return {
        title: "ONE YEAR CLEAN! 🏆",
        description: "You've achieved something truly extraordinary! A full year of dedication, strength, and growth.",
        emoji: "🎊",
      };
    } else if (goalDays >= 180) {
      return {
        title: "Six Months Strong! 💪",
        description: "Half a year of commitment! You're proving to yourself what's possible.",
        emoji: "⭐",
      };
    } else if (goalDays >= 90) {
      return {
        title: "90 Days of Freedom! 🎯",
        description: "Three incredible months! You've broken the pattern and built new habits.",
        emoji: "🚀",
      };
    } else if (goalDays >= 30) {
      return {
        title: "One Month Milestone! 🔥",
        description: "A full month clean! This is a major achievement worth celebrating.",
        emoji: "🎉",
      };
    } else if (goalDays >= 7) {
      return {
        title: "One Week Complete! 🌱",
        description: "Seven days of strength! This is just the beginning of your journey.",
        emoji: "✨",
      };
    }
    return {
      title: "Goal Achieved! 🎉",
      description: "You did it! Every step forward matters.",
      emoji: "💜",
    };
  };

  const message = getMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                  animationDuration: `${2 + Math.random()}s`,
                }}
              >
                {['🎉', '⭐', '🏆', '✨', '🎊', '💜'][Math.floor(Math.random() * 6)]}
              </div>
            ))}
          </div>
        )}

        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <Trophy className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {message.title}
            </DialogTitle>
            <div className="text-6xl">{message.emoji}</div>
            <DialogDescription className="text-lg">
              {message.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-xs text-muted-foreground">Achievement</p>
              <p className="font-semibold">{goalDays} Days</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold">Completed!</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-muted-foreground">Growth</p>
              <p className="font-semibold">Unstoppable</p>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <p className="font-semibold text-primary">What's Next?</p>
            </div>
            <p className="text-sm text-muted-foreground">
              You've proven your strength. Ready to challenge yourself even more? Set a new goal and keep this momentum going!
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Continue Journey
            </Button>
            <Button
              onClick={handleSetNewGoal}
              className="flex-1 bg-gradient-to-r from-primary to-accent"
            >
              Set New Goal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
