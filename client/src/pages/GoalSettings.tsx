import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Heart, Target, Calendar, TrendingUp, ArrowLeft } from 'lucide-react';

const goalOptions = [
  { days: 7, label: '1 Week', description: 'A great first milestone', emoji: '🌱' },
  { days: 14, label: '2 Weeks', description: 'Build momentum', emoji: '💪' },
  { days: 30, label: '1 Month', description: 'Most popular goal', emoji: '🔥' },
  { days: 60, label: '2 Months', description: 'Strong commitment', emoji: '⭐' },
  { days: 90, label: '3 Months', description: 'Break the habit', emoji: '🎯' },
  { days: 180, label: '6 Months', description: 'Long-term change', emoji: '🚀' },
  { days: 365, label: '1 Year', description: 'Complete transformation', emoji: '🏆' },
];

export default function GoalSettings() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();

  // Parse URL parameters
  const params = new URLSearchParams(searchString);
  const isRelapse = params.get('relapse') === 'true';
  const completedGoal = params.get('completed') === 'true';
  const previousGoal = params.get('previousGoal') ? parseInt(params.get('previousGoal')!) : undefined;

  const [selectedGoal, setSelectedGoal] = useState(previousGoal ? previousGoal.toString() : '30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Suggest higher goal on relapse or completion
  useEffect(() => {
    if (previousGoal && (isRelapse || completedGoal)) {
      const currentIndex = goalOptions.findIndex(g => g.days === previousGoal);
      if (currentIndex !== -1 && currentIndex < goalOptions.length - 1) {
        setSelectedGoal(goalOptions[currentIndex + 1].days.toString());
      }
    }
  }, [previousGoal, isRelapse, completedGoal]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user/update-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': document.cookie.split('csrf-token=')[1]?.split(';')[0] || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          goalDays: parseInt(selectedGoal),
          startDate: new Date().toISOString().split('T')[0],
          isNewGoal: completedGoal,
        }),
      });

      if (response.ok) {
        toast({
          title: completedGoal ? 'New goal set!' : isRelapse ? 'Fresh start!' : 'Goal updated!',
          description: `Your new goal is ${selectedGoal} days. You've got this!`,
        });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      } else {
        throw new Error('Failed to update goal');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update your goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeaderContent = () => {
    if (completedGoal) {
      return {
        icon: <TrendingUp className="w-8 h-8 text-green-500" />,
        title: "You Did It! 🎉",
        description: "You've reached your goal! Ready to aim even higher?",
        color: "text-green-500"
      };
    }
    if (isRelapse) {
      return {
        icon: <Heart className="w-8 h-8 text-primary" />,
        title: "Every Day is a New Beginning",
        description: "Recovery isn't linear. Let's set a new goal and keep moving forward.",
        color: "text-primary"
      };
    }
    return {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "Update Your Goal",
      description: "Adjust your recovery goal to match your journey",
      color: "text-primary"
    };
  };

  const header = getHeaderContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-2xl">
        {!completedGoal && (
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}

        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {header.icon}
              </div>
            </div>
            <CardTitle className={`text-3xl font-bold ${header.color}`}>{header.title}</CardTitle>
            <CardDescription className="text-lg">
              {header.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {isRelapse && previousGoal && (
              <div className="p-4 bg-accent/50 border border-border rounded-lg space-y-2">
                <p className="text-sm font-medium">Your Previous Goal: {previousGoal} days</p>
                <p className="text-sm text-muted-foreground">
                  Consider setting a similar or slightly higher goal. Remember, progress isn't always perfect,
                  but every attempt makes you stronger.
                </p>
              </div>
            )}

            {completedGoal && previousGoal && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  🏆 Completed: {previousGoal} days clean!
                </p>
                <p className="text-sm text-muted-foreground">
                  Amazing achievement! Your dedication is inspiring. Ready to challenge yourself even more?
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Target className="w-10 h-10 mx-auto text-primary" />
                <h3 className="text-xl font-semibold">
                  {completedGoal ? 'Set Your Next Challenge' : isRelapse ? 'Choose Your Fresh Start Goal' : 'Select Your Goal'}
                </h3>
              </div>

              <RadioGroup value={selectedGoal} onValueChange={setSelectedGoal}>
                <div className="grid gap-3">
                  {goalOptions.map((option) => {
                    const isHigherThanPrevious = previousGoal && option.days > previousGoal;
                    const isSameAsPrevious = previousGoal && option.days === previousGoal;

                    return (
                      <div key={option.days} className="relative">
                        <RadioGroupItem
                          value={option.days.toString()}
                          id={`goal-${option.days}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`goal-${option.days}`}
                          className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 ${
                            isHigherThanPrevious ? 'border-green-500/30 bg-green-500/5' : ''
                          }`}
                        >
                          <div className="text-2xl">{option.emoji}</div>
                          <div className="flex-1">
                            <div className="font-semibold flex items-center gap-2">
                              {option.label}
                              {isHigherThanPrevious && (
                                <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                  Recommended ⬆️
                                </span>
                              )}
                              {isSameAsPrevious && isRelapse && (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                                  Try again 💪
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                          <div className="text-2xl font-bold text-primary">{option.days}</div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                💡 <strong>Remember:</strong> Your streak will auto-increment daily.
                Only press "I Relapsed" if you actually relapse. Be honest with yourself.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : completedGoal ? 'Start New Challenge' : isRelapse ? 'Start Fresh' : 'Update Goal'}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Your journey, your pace. We believe in you! 💜</p>
        </div>
      </div>
    </div>
  );
}
