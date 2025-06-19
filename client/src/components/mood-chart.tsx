import { useMemo } from "react";

interface MoodChartProps {
  data: Array<{
    date: string;
    mood: string;
    entries: number;
  }>;
}

export default function MoodChart({ data }: MoodChartProps) {
  const maxEntries = useMemo(() => {
    return Math.max(...data.map(d => d.entries), 1);
  }, [data]);

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'bg-accent';
      case 'sad': return 'bg-primary';
      case 'anxious': return 'bg-yellow-500';
      case 'suicidal': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😔';
      case 'anxious': return '😰';
      case 'suicidal': return '😢';
      default: return '😐';
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="grid grid-cols-7 gap-4">
      {data.map((day, index) => {
        const heightPercentage = day.entries > 0 
          ? Math.max((day.entries / maxEntries) * 100, 20)
          : 10;

        return (
          <div key={day.date} className="text-center">
            <div className="text-xs font-medium text-gray-500 mb-2">
              {getDayName(day.date)}
            </div>
            <div 
              className="mood-bar mx-auto rounded-lg transition-all duration-300 hover:scale-105"
              style={{ width: '20px', height: '120px' }}
            >
              <div 
                className={`w-full rounded-lg ${getMoodColor(day.mood)} transition-all duration-500`}
                style={{ height: `${heightPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {day.entries > 0 ? getMoodEmoji(day.mood) : '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
