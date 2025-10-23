import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Shield, Heart, ArrowRight, LogIn } from 'lucide-react';
import heroImage from '@assets/generated_images/Peaceful_wellness_landscape_335173a8.png';

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/signup');
  };

  const handleLogin = () => {
    setLocation('/login');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Heart className="w-6 h-6" />
            <span className="text-xl font-semibold">PurityPath</span>
          </div>
          <Button
            variant="outline"
            onClick={handleLogin}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary-foreground/80">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium tracking-wide">Safe • Private • Supportive</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Your Journey to
              <span className="block text-primary-foreground bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Recovery & Wellness
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
              A compassionate digital companion designed to support you through addiction recovery
              with daily tracking, private journaling, and crisis support.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
              data-testid="button-get-started"
            >
              <Heart className="w-5 h-5 mr-2" />
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Private & Secure</h3>
              <p className="text-primary-foreground/80 text-sm">
                Your data is encrypted and completely private. No judgments, just support.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">24/7 Support</h3>
              <p className="text-primary-foreground/80 text-sm">
                Crisis support and breathing exercises available whenever you need them.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Track Progress</h3>
              <p className="text-primary-foreground/80 text-sm">
                Celebrate milestones and visualize your journey toward wellness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}