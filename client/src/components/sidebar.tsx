import { useLocation } from "wouter";
import { Heart, PenTool, BarChart3, User, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { JournalEntry } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: entries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal/entries"],
  });

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const recentEntries = entries
    .filter(entry => entry.createdAt)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 5);

  const getRelativeTime = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown';
    const entryDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - entryDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return entryDate.toLocaleDateString();
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'bg-green-100 text-green-800';
      case 'sad': return 'bg-blue-100 text-blue-800';
      case 'anxious': return 'bg-yellow-100 text-yellow-800';
      case 'suicidal': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navItems = [
    { path: "/", icon: PenTool, label: "Write Entry" },
    { path: "/mood-tracker", icon: BarChart3, label: "Mood Tracker" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const SidebarContent = ({ showCloseButton = false }) => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Daily Journal</h1>
              <p className="text-xs text-gray-500">Track your mood</p>
            </div>
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden"
            >
              <X size={20} className="text-gray-600" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Recent Entries */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Entries</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                setLocation("/");
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  {getRelativeTime(entry.createdAt)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getMoodColor(entry.detectedMood)}`}>
                  {entry.detectedMood}
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {entry.entryText}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md border border-gray-200 hover:bg-gray-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
      </Button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 bg-white border-r border-gray-200 flex-col">
        <SidebarContent showCloseButton={false} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity duration-300" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[80vw] bg-white border-r border-gray-200 flex flex-col shadow-xl transform transition-transform duration-300">
            <SidebarContent showCloseButton={true} />
          </div>
        </div>
      )}
    </>
  );
}