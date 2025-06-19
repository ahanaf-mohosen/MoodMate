import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Gift, Quote, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { JournalEntry } from "@shared/schema";

interface QuoteCardProps {
  entry: JournalEntry & { quote?: any };
  onQuoteRevealed?: () => void;
}

export default function QuoteCard({ entry, onQuoteRevealed }: QuoteCardProps) {
  const [isOpened, setIsOpened] = useState(entry.isQuoteRevealed || false);
  const { toast } = useToast();

  const revealQuoteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/journal/entries/${entry.id}/reveal-quote`);
    },
    onSuccess: () => {
      setIsOpened(true);
      onQuoteRevealed?.();
      toast({
        title: "Entry saved!",
        description: "Your mood has been logged and your quote is ready.",
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
        description: "Failed to reveal quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    if (!isOpened && !revealQuoteMutation.isPending) {
      revealQuoteMutation.mutate();
    }
  };

  if (!entry.quote) {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-2xl p-8 text-center">
          <p className="text-gray-500">No quote available for this entry</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div 
        className={`gift-box relative w-72 h-40 lg:w-80 lg:h-48 cursor-pointer transition-all duration-500 ${
          isOpened ? 'opened' : ''
        }`}
        onClick={handleClick}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of Box */}
        <div 
          className="gift-box-content absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-xl flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-center text-white p-4 lg:p-6">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
              <Gift className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <h3 className="text-base lg:text-lg font-semibold mb-2">Your Inspirational Quote</h3>
            <p className="text-white/80 text-xs lg:text-sm">
              {revealQuoteMutation.isPending 
                ? "Opening your gift..." 
                : "Click to open your personalized message"
              }
            </p>
          </div>
        </div>
        
        {/* Back of Box (Quote) */}
        <div 
          className="gift-box-content gift-box-back absolute inset-0 bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4 lg:p-6 flex items-center justify-center"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)'
          }}
        >
          <div className="text-center">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
              <Quote className="text-accent w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <blockquote className="text-sm lg:text-lg text-gray-800 font-medium leading-relaxed mb-3 lg:mb-4">
              "{entry.quote.quoteText}"
            </blockquote>
            {entry.quote.author && (
              <cite className="text-xs lg:text-sm text-gray-500">— {entry.quote.author}</cite>
            )}
            

          </div>
        </div>
      </div>
    </div>
  );
}
