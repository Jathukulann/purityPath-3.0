import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Award } from 'lucide-react';

interface ProgressChartProps {
  weeklyData?: Array<{
    week: string;
    cleanDays: number;
    totalDays: number;
  }>;
  milestones?: Array<{
    days: number;
    title: string;
    achieved: boolean;
    date?: string;
  }>;
}

export default function ProgressChart({ weeklyData = [], milestones = [] }: ProgressChartProps) {
  const getProgressPercentage = (cleanDays: number, totalDays: number) => {
    return Math.round((cleanDays / totalDays) * 100);
  };

  const getBarHeight = (percentage: number) => {
    return Math.max(8, (percentage / 100) * 120); // Minimum 8px, max 120px
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Weekly Progress</h3>
          </div>
          
          {weeklyData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start tracking to see your progress here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-3 h-32">
                {weeklyData.map((week, index) => {
                  const percentage = getProgressPercentage(week.cleanDays, week.totalDays);
                  const height = getBarHeight(percentage);
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-xs font-medium text-primary">
                        {percentage}%
                      </div>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          percentage >= 80 ? 'bg-green-500' :
                          percentage >= 60 ? 'bg-yellow-500' :
                          percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ height: `${height}px` }}
                        data-testid={`bar-week-${index}`}
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        {week.week}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                Percentage of clean days per week
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Milestones</h3>
          </div>
          
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  milestone.achieved 
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                    : 'bg-muted/30 border-border'
                }`}
                data-testid={`milestone-${index}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    milestone.achieved 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {milestone.achieved ? '✓' : milestone.days}
                  </div>
                  
                  <div>
                    <div className="font-medium">{milestone.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {milestone.days} day{milestone.days !== 1 ? 's' : ''}
                      {milestone.achieved && milestone.date && (
                        <span> • Achieved {milestone.date}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant={milestone.achieved ? 'default' : 'secondary'}
                  className={milestone.achieved ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  {milestone.achieved ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}