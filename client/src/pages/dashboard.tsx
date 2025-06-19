import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Heart, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import Sidebar from "@/components/sidebar";
import QuoteCard from "@/components/quote-card";
import { useAuth } from "@/hooks/use-auth";
import { JournalEntry } from "@shared/schema";

export default function Dashboard() {
  const [moodText, setMoodText] = useState("");
  const [currentEntry, setCurrentEntry] = useState<(JournalEntry & { quote?: any }) | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const submitMoodMutation = useMutation({
    mutationFn: async (entryText: string) => {
      const response = await apiRequest("POST", "/api/journal/entries", { entryText });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentEntry(data);
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood/weekly"] });
      toast({
        title: "Entry saved!",
        description: "Your mood has been analyzed. Click to reveal your quote.",
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
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save your mood entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    if (!moodText.trim()) {
      toast({
        title: "Empty entry",
        description: "Please write about your mood first.",
        variant: "destructive",
      });
      return;
    }

    await submitMoodMutation.mutateAsync(moodText);
  };

  const resetEntry = () => {
    setMoodText("");
    setCurrentEntry(null);
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 pl-16 lg:pl-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                How are you feeling today?
              </h2>
              <p className="text-gray-600 text-xs lg:text-sm mt-1">{currentDate}</p>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-medium text-sm lg:text-base">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs lg:text-sm font-medium text-gray-700 hidden md:block">
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center">
          <div className="max-w-3xl mx-auto w-full">
            {!currentEntry ? (
              <div className="mb-8">
                <Textarea
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                  className="w-full h-40 lg:h-48 p-4 lg:p-6 border-2 border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-700 placeholder-gray-400 text-sm lg:text-base"
                  placeholder="Write about your mood today... Share your thoughts, feelings, or what's on your mind."
                />

                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                  <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm text-gray-500">
                    <span className="flex items-center">
                      <Lock className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                      Private & Secure
                    </span>
                    <span className="flex items-center">
                      <Heart className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                      AI-Powered Insights
                    </span>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitMoodMutation.isPending}
                    className="px-6 lg:px-8 py-2 lg:py-3 rounded-xl font-medium flex items-center space-x-2 text-sm lg:text-base w-full sm:w-auto"
                  >
                    <span>
                      {submitMoodMutation.isPending ? "Analyzing..." : "Get Quote"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="fade-in">
                <div className="text-center mb-6">
                  <Badge variant="secondary" className="bg-accent/10 text-accent px-4 py-2 text-sm font-medium">
                    Mood Detected: {currentEntry.detectedMood.charAt(0).toUpperCase() + currentEntry.detectedMood.slice(1)}
                  </Badge>
                </div>

                <QuoteCard 
                  entry={currentEntry}
                  onQuoteRevealed={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/mood/weekly"] });
                  }}
                />

                <div className="text-center mt-6">
                  <Button
                    variant="ghost" 
                    onClick={resetEntry}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Write Another Entry
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
