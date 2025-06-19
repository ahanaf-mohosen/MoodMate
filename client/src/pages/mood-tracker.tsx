import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Calendar } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MoodChart from "@/components/mood-chart";

interface WeeklyMoodData {
  date: string;
  mood: string;
  entries: number;
}

export default function MoodTracker() {
  const { data: weeklyData = [], isLoading } = useQuery<WeeklyMoodData[]>({
    queryKey: ["/api/mood/weekly"],
  });

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😔';
      case 'anxious': return '😰';
      case 'suicidal': return '😢';
      default: return '😐';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'bg-accent';
      case 'sad': return 'bg-primary';
      case 'anxious': return 'bg-yellow-500';
      case 'suicidal': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading mood data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 pl-16 lg:pl-6">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Mood Tracker</h2>
          <p className="text-gray-600 text-xs lg:text-sm mt-1">Your emotional journey over time</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            
            {/* Weekly Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">This Week</h3>
              
              {/* Mood Chart */}
              <div className="grid grid-cols-7 gap-2 lg:gap-4 mb-6">
                {weeklyData.map((day, index) => (
                  <div key={day.date} className="text-center">
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      {getDayName(day.date)}
                    </div>
                    <div className="mood-bar mx-auto rounded-lg" style={{ width: '16px', height: '80px' }}>
                      <div 
                        className={`w-full rounded-lg transition-all duration-300 ${getMoodColor(day.mood)}`}
                        style={{ 
                          height: day.entries > 0 ? `${Math.min(day.entries * 30 + 20, 100)}%` : '10%'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {day.entries > 0 ? getMoodEmoji(day.mood) : '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mood Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-6 text-xs lg:text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span className="text-gray-600">Happy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-gray-600">Sad</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Anxious</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Crisis</span>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Insights</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Mood Tracking</p>
                      <p className="text-sm text-gray-600">
                        {weeklyData.reduce((sum, day) => sum + day.entries, 0)} entries this week
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Consistency</p>
                      <p className="text-sm text-gray-600">
                        {weeklyData.filter(day => day.entries > 0).length} out of 7 days tracked
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(
                    weeklyData.reduce((acc, day) => {
                      if (day.entries > 0) {
                        acc[day.mood] = (acc[day.mood] || 0) + 1;
                      }
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([mood, count]) => (
                    <div key={mood} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getMoodEmoji(mood)}</span>
                        <span className="font-medium text-gray-700 capitalize">{mood}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count} days</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
