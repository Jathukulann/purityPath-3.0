import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Wind, Clock } from 'lucide-react';

interface PanicButtonProps {
  onActivate?: () => void;
}

export default function PanicButton({ onActivate }: PanicButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleActivate = () => {
    onActivate?.();
    setIsOpen(true);
  };

  // Cleanup breathing timer when component unmounts or dialog closes
  useEffect(() => {
    if (!isOpen && breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
      breathingIntervalRef.current = null;
      setIsBreathing(false);
      setCycleCount(0);
      setBreathingPhase('inhale');
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
    };
  }, []);

  const startBreathing = () => {
    // Clear any existing interval
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
    }

    setIsBreathing(true);
    setCycleCount(0);
    setBreathingPhase('inhale');

    // Simulate breathing cycle
    let count = 0;
    breathingIntervalRef.current = setInterval(() => {
      count++;
      if (count % 4 === 0) {
        setBreathingPhase('hold');
      } else if (count % 8 === 0) {
        setBreathingPhase('exhale');
      } else if (count % 12 === 0) {
        setBreathingPhase('inhale');
        setCycleCount(prev => prev + 1);
      }

      if (count >= 60) { // 5 cycles of 12 seconds each
        if (breathingIntervalRef.current) {
          clearInterval(breathingIntervalRef.current);
          breathingIntervalRef.current = null;
        }
        setIsBreathing(false);
      }
    }, 1000);
  };

  const getBreathingText = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe in slowly...';
      case 'hold': return 'Hold your breath...';
      case 'exhale': return 'Breathe out gently...';
    }
  };

  const emergencyContacts = [
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741' },
    { name: 'SAMHSA Helpline', contact: '1-800-662-4357' },
    { name: 'Suicide Prevention', contact: '988' }
  ];

  return (
    <>
      <Button
        onClick={handleActivate}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg animate-pulse"
        size="lg"
        data-testid="button-panic"
      >
        <Heart className="w-6 h-6 mr-2" />
        Need Help Now
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold text-primary">
              You're Safe. Let's Breathe Together.
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {!isBreathing ? (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Wind className="w-12 h-12 text-primary" />
                </div>
                
                <p className="text-muted-foreground">
                  Take a moment to center yourself with a guided breathing exercise.
                </p>
                
                <Button 
                  onClick={startBreathing}
                  className="w-full"
                  data-testid="button-start-breathing"
                >
                  <Wind className="w-4 h-4 mr-2" />
                  Start Breathing Exercise
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className={`w-32 h-32 mx-auto rounded-full border-4 border-primary/20 flex items-center justify-center transition-all duration-1000 ${
                  breathingPhase === 'inhale' ? 'scale-110 bg-primary/20' : 
                  breathingPhase === 'hold' ? 'scale-110 bg-primary/30' : 
                  'scale-90 bg-primary/10'
                }`}>
                  <div className="text-2xl font-bold text-primary">
                    {breathingPhase === 'inhale' ? '↑' : breathingPhase === 'hold' ? '⏸' : '↓'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-primary">{getBreathingText()}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Cycle {cycleCount + 1} of 5
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 text-center">Emergency Resources</h4>
              <div className="space-y-2">
                {emergencyContacts.map((contact, index) => (
                  <Card key={index} className="p-3 text-sm">
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-muted-foreground">{contact.contact}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}