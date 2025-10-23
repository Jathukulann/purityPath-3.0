import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Target, PlayCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  startDate?: string | null;
  goalDays?: number;
  onReset?: () => void;
}

export default function StreakCounter({ currentStreak, longestStreak, startDate, goalDays = 30, onReset }: StreakCounterProps) {
  const [showReset, setShowReset] = useState(false);

  const handleReset = () => {
    onReset?.();
    setShowReset(false);
  };

  const getMilestoneMessage = (streak: number) => {
    if (streak >= 365) return "One year strong! 🌟";
    if (streak >= 180) return "Half a year milestone! 💪";
    if (streak >= 90) return "Three months clean! 🎉";
    if (streak >= 30) return "One month achieved! 🔥";
    if (streak >= 7) return "One week done! ✨";
    if (streak >= 1) return "You're doing great! 💜";
    return "Your journey starts today! 🌱";
  };

  const calculateProgress = () => {
    if (!goalDays) return 0;
    return Math.min(Math.round((currentStreak / goalDays) * 100), 100);
  };

  const getDaysUntilGoal = () => {
    return Math.max(goalDays - currentStreak, 0);
  };

  return (
    <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Clean Days</span>
          </div>

          <div className="text-6xl font-bold text-primary tabular-nums" data-testid="text-current-streak">
            {currentStreak}
          </div>

          <p className="text-lg text-muted-foreground font-medium">
            {getMilestoneMessage(currentStreak)}
          </p>
        </div>

        {/* Progress Bar */}
        {goalDays && (
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {getDaysUntilGoal() > 0 ? (
                <span>{getDaysUntilGoal()} days until goal</span>
              ) : (
                <span className="text-primary font-semibold">Goal achieved! 🎉</span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-1 p-3 bg-background/50 rounded-lg">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Started</span>
            </div>
            <span className="text-sm font-semibold">
              {startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'Today'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 p-3 bg-background/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Best Record</span>
            </div>
            <span className="text-sm font-semibold" data-testid="text-longest-streak">
              {longestStreak} days
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 p-3 bg-accent/30 rounded-lg">
          <Target className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Goal: {goalDays} days</span>
        </div>

        {/* Relapse Button - Always visible for honesty */}
        <div className="pt-4 border-t border-border/50">
          {!showReset ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowReset(true)}
              className="gap-2"
              data-testid="button-show-reset"
            >
              <AlertCircle className="w-4 h-4" />
              I Relapsed
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                It's okay. Recovery isn't perfect. Your longest streak ({longestStreak} days) will be saved.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReset}
                  data-testid="button-confirm-reset"
                >
                  Reset & Start Fresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReset(false)}
                  data-testid="button-cancel-reset"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}