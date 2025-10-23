import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Heart, Target, Calendar, CheckCircle } from 'lucide-react';

const goalOptions = [
  { days: 7, label: '1 Week', description: 'A great first milestone' },
  { days: 14, label: '2 Weeks', description: 'Build momentum' },
  { days: 30, label: '1 Month', description: 'Most popular goal' },
  { days: 60, label: '2 Months', description: 'Strong commitment' },
  { days: 90, label: '3 Months', description: 'Break the habit' },
  { days: 180, label: '6 Months', description: 'Long-term change' },
  { days: 365, label: '1 Year', description: 'Complete transformation' },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': document.cookie.split('csrf-token=')[1]?.split(';')[0] || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          goalDays: parseInt(selectedGoal),
          startDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        toast({
          title: 'Welcome to your journey!',
          description: 'Your goals have been set. Let\'s begin!',
        });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      } else {
        throw new Error('Failed to save onboarding');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save your preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to PurityPath</CardTitle>
            <CardDescription className="text-lg">
              Let's personalize your recovery journey
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Target className="w-12 h-12 mx-auto text-primary" />
                  <h3 className="text-xl font-semibold">Set Your Initial Goal</h3>
                  <p className="text-muted-foreground">
                    Choose a timeframe that feels achievable. You can always adjust this later.
                  </p>
                </div>

                <RadioGroup value={selectedGoal} onValueChange={setSelectedGoal}>
                  <div className="grid gap-3">
                    {goalOptions.map((option) => (
                      <div key={option.days} className="relative">
                        <RadioGroupItem
                          value={option.days.toString()}
                          id={`goal-${option.days}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`goal-${option.days}`}
                          className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        >
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-semibold">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                          <div className="text-2xl font-bold text-primary">{option.days}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <Button onClick={() => setStep(2)} className="w-full" size="lg">
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <CheckCircle className="w-12 h-12 mx-auto text-primary" />
                  <h3 className="text-xl font-semibold">How Daily Tracking Works</h3>
                </div>

                <div className="space-y-4">
                  <Card className="bg-accent/50">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Automatic Progress</h4>
                          <p className="text-sm text-muted-foreground">
                            Each day you stay clean, your streak automatically increases at midnight.
                            No daily check-in required!
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <Heart className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Honest Accountability</h4>
                          <p className="text-sm text-muted-foreground">
                            If you relapse, press the "I Relapsed" button. This resets your streak but
                            saves your longest streak as motivation.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Your Goal: {goalOptions.find(g => g.days.toString() === selectedGoal)?.label}</h4>
                          <p className="text-sm text-muted-foreground">
                            We'll celebrate when you reach {selectedGoal} days clean. You're starting today!
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      💡 <strong>Pro tip:</strong> Use the journal and panic button features whenever you need support.
                      Your privacy is always protected with encryption.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Setting up...' : 'Start My Journey'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Your journey begins today. You've got this! 💪</p>
        </div>
      </div>
    </div>
  );
}
