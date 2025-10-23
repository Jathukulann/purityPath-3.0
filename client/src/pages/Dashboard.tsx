import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import type { User, Streak, JournalEntry, Milestone } from '@shared/schema';
import StreakCounter from '@/components/StreakCounter';
import PanicButton from '@/components/PanicButton';
import JournalEntryComponent from '@/components/JournalEntry';
import DailyAffirmation from '@/components/DailyAffirmation';
import ProgressChart from '@/components/ProgressChart';
import ThemeToggle from '@/components/ThemeToggle';
import CongratsModal from '@/components/CongratsModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bell, Menu, LogOut, Settings } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  // Fetch streak data
  const { data: streak, isLoading: streakLoading, error: streakError } = useQuery<Streak>({
    queryKey: ['/api/streak'],
  });

  // Handle streak fetch errors
  if (streakError && isUnauthorizedError(streakError as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Fetch journal entries
  const { data: journalEntries = [], isLoading: journalLoading, error: journalError } = useQuery<JournalEntry[]>({
    queryKey: ['/api/journal'],
  });

  // Handle journal fetch errors
  if (journalError && isUnauthorizedError(journalError as Error)) {
    toast({
      title: "Unauthorized", 
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Fetch milestones
  const { data: milestones = [], isLoading: milestonesLoading, error: milestonesError } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones'],
  });

  // Handle milestones fetch errors
  if (milestonesError && isUnauthorizedError(milestonesError as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Reset streak mutation
  const resetStreakMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/streak/reset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/streak'] });
      toast({
        title: "Streak Reset",
        description: "Your streak has been reset. Remember, recovery is a journey.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to reset streak. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Add journal entry mutation
  const addJournalEntryMutation = useMutation({
    mutationFn: async (entry: { content: string; mood: 'good' | 'neutral' | 'difficult' }) => {
      await apiRequest('POST', '/api/journal', {
        ...entry,
        entryDate: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      toast({
        title: "Entry Saved",
        description: "Your journal entry has been saved privately.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to save journal entry. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Generate progress data from milestones
  const progressData = milestones
    .filter(m => m.isAchieved)
    .map(m => ({
      days: m.targetDays,
      title: m.title,
      achieved: m.isAchieved,
      date: m.achievedDate ? new Date(m.achievedDate).toLocaleDateString() : undefined
    }));

  // Calculate weekly data from journal entries and streak
  const calculateWeeklyData = () => {
    const weeks = [];
    const today = new Date();

    // Generate last 4 weeks of data
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay()); // Start from Sunday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Count journal entries with "good" mood in this week
      const entriesInWeek = journalEntries.filter(entry => {
        const dateValue = entry.entryDate || entry.createdAt;
        if (!dateValue) return false;
        const entryDate = new Date(dateValue);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      const cleanDays = entriesInWeek.filter(entry => entry.mood === 'good').length;

      weeks.push({
        week: `Week ${4 - i}`,
        cleanDays,
        totalDays: 7
      });
    }

    return weeks;
  };

  const weeklyData = calculateWeeklyData();

  // Check if goal is completed
  const isGoalCompleted = user?.goalDays && streak?.currentStreak
    ? streak.currentStreak >= user.goalDays
    : false;

  // Show congrats modal when goal is completed (only once per goal)
  const [hasShownCongrats, setHasShownCongrats] = useState(() => {
    // Track if we've shown the modal for this goal
    const key = `congrats-shown-${user?.id}-${user?.goalDays}`;
    return localStorage.getItem(key) === 'true';
  });

  if (isGoalCompleted && !hasShownCongrats && !showCongratsModal) {
    setShowCongratsModal(true);
    const key = `congrats-shown-${user?.id}-${user?.goalDays}`;
    localStorage.setItem(key, 'true');
    setHasShownCongrats(true);
  }

  const handleStreakReset = () => {
    // Redirect to goal settings with relapse context
    const params = new URLSearchParams({
      relapse: 'true',
      previousGoal: user?.goalDays?.toString() || '30'
    });
    setLocation(`/goal-settings?${params.toString()}`);
  };

  const handleAddJournalEntry = (entry: { content: string; mood: 'good' | 'neutral' | 'difficult' }) => {
    addJournalEntryMutation.mutate(entry);
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const formatJournalEntries = journalEntries.map(entry => ({
    id: entry.id,
    date: entry.entryDate || (entry.createdAt ? new Date(entry.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    content: entry.content,
    mood: entry.mood,
    isPrivate: entry.isPrivate
  }));

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Friend';
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'F';
  };

  if (streakLoading || journalLoading || milestonesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <Avatar className="w-10 h-10">
                        {user?.profileImageUrl && (
                          <AvatarImage src={user.profileImageUrl} alt={getUserDisplayName()} />
                        )}
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{getUserDisplayName()}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                        Dashboard
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" disabled>
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" disabled>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                    <div className="pt-4 border-t">
                      <Button variant="destructive" className="w-full" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-semibold text-primary">Recovery Path</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" disabled title="Notifications (Coming Soon)">
                <Bell className="w-5 h-5" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="hidden lg:flex">
                <LogOut className="w-5 h-5" />
              </Button>
              <Avatar className="w-8 h-8 hidden lg:block">
                {user?.profileImageUrl && (
                  <AvatarImage src={user.profileImageUrl} alt={getUserDisplayName()} />
                )}
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Welcome back, {getUserDisplayName()}</h2>
            <p className="text-muted-foreground">
              You're doing amazing. Here's your progress today.
            </p>
          </div>

          {/* Top Section - Streak and Panic Button */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StreakCounter
                currentStreak={streak?.currentStreak || 0}
                longestStreak={streak?.longestStreak || 0}
                startDate={streak?.startDate}
                goalDays={user?.goalDays || 30}
                onReset={handleStreakReset}
              />
            </div>
            <div className="flex items-center justify-center">
              <PanicButton />
            </div>
          </div>

          {/* Daily Affirmation */}
          <DailyAffirmation />

          {/* Progress and Journal */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <ProgressChart
                weeklyData={weeklyData}
                milestones={progressData}
              />
            </div>
            <div>
              <JournalEntryComponent 
                entries={formatJournalEntries}
                onAddEntry={handleAddJournalEntry}
              />
            </div>
          </div>

          {/* Footer */}
          <Card className="p-6 text-center bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Remember: Recovery is a journey, not a destination. You're stronger than you know. 💜
            </p>
          </Card>
        </div>
      </main>

      {/* Congratulations Modal */}
      <CongratsModal
        isOpen={showCongratsModal}
        goalDays={user?.goalDays || 30}
        onClose={() => setShowCongratsModal(false)}
      />
    </div>
  );
}