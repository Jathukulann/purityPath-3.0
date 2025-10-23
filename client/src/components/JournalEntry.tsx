import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { BookOpen, Calendar, Lock, Plus, Smile, Meh, Frown } from 'lucide-react';

interface JournalEntryProps {
  entries?: Array<{
    id: string;
    date: string;
    content: string;
    mood: 'good' | 'neutral' | 'difficult';
    isPrivate: boolean;
  }>;
  onAddEntry?: (entry: { content: string; mood: 'good' | 'neutral' | 'difficult' }) => void;
}

export default function JournalEntry({ entries = [], onAddEntry }: JournalEntryProps) {
  const [newEntry, setNewEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<'good' | 'neutral' | 'difficult'>('neutral');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = () => {
    if (newEntry.trim()) {
      onAddEntry?.({ content: newEntry, mood: selectedMood });
      setNewEntry('');
      setSelectedMood('neutral');
      setIsDialogOpen(false);
    }
  };

  const getMoodIcon = (mood: 'good' | 'neutral' | 'difficult') => {
    switch (mood) {
      case 'good': return <Smile className="w-4 h-4 text-green-500" />;
      case 'neutral': return <Meh className="w-4 h-4 text-yellow-500" />;
      case 'difficult': return <Frown className="w-4 h-4 text-red-500" />;
    }
  };

  const getMoodColor = (mood: 'good' | 'neutral' | 'difficult') => {
    switch (mood) {
      case 'good': return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'neutral': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'difficult': return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Personal Journal</h2>
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-entry">
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Journal Entry</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">How are you feeling today?</label>
                <div className="flex gap-2">
                  {(['good', 'neutral', 'difficult'] as const).map((mood) => (
                    <Button
                      key={mood}
                      variant={selectedMood === mood ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMood(mood)}
                      className="flex items-center gap-2"
                      data-testid={`button-mood-${mood}`}
                    >
                      {getMoodIcon(mood)}
                      <span className="capitalize">{mood}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Your thoughts</label>
                <Textarea
                  placeholder="Write about your feelings, challenges, or victories today..."
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  className="min-h-32"
                  data-testid="input-journal-content"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-entry"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!newEntry.trim()}
                  data-testid="button-save-entry"
                >
                  Save Entry
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">Start Your Journey</h3>
            <p className="text-sm">
              Your private journal is a safe space to reflect on your progress and feelings.
            </p>
          </Card>
        ) : (
          entries.map((entry, index) => (
            <Card 
              key={entry.id} 
              className={`p-4 ${getMoodColor(entry.mood)}`}
              data-testid={`card-entry-${index}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatDate(entry.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getMoodIcon(entry.mood)}
                    <Badge variant="secondary" className="capitalize">
                      {entry.mood}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm leading-relaxed">{entry.content}</p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}