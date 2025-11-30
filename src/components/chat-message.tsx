import { Bot, User, LoaderCircle, Volume2, Sparkles, Clipboard } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatMessageProps = {
  message: Message;
  onSummarize: (text: string) => void;
  onReadAloud: (text: string) => void;
};

export function ChatMessage({ message, onSummarize, onReadAloud }: ChatMessageProps) {
  const { toast } = useToast();
  const isAssistant = message.role === 'assistant';
  const isLongResponse = isAssistant && message.content.length > 250;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content).then(() => {
        toast({ title: 'Copied to clipboard!' });
      });
    }
  };

  if (isAssistant && message.content === 'loading...') {
    return (
      <div className="flex items-start gap-4 p-4">
        <Avatar className="w-8 h-8 border">
          <AvatarFallback className="bg-primary/80 text-primary-foreground">
            <Bot size={20} />
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <LoaderCircle className="animate-spin w-5 h-5" />
          <span className="text-sm">Thinking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-4', isAssistant ? '' : 'justify-end')}>
      {isAssistant && (
        <Avatar className="w-8 h-8 border bg-background">
          <AvatarFallback className="bg-primary/20">
            <Bot size={20} className="text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
          "max-w-[80%] rounded-xl px-4 py-3 shadow-sm",
          isAssistant
            ? "bg-card text-card-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        {isAssistant && message.content && (
          <div className="flex items-center justify-end gap-1 mt-2 -mb-1 -mr-2">
            {isLongResponse && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-accent-foreground" onClick={() => onSummarize(message.content)}>
                <Sparkles size={16} />
                <span className="sr-only">Summarize</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-accent-foreground" onClick={() => onReadAloud(message.content)}>
              <Volume2 size={16} />
              <span className="sr-only">Read aloud</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-accent-foreground" onClick={handleCopy}>
              <Clipboard size={16} />
              <span className="sr-only">Copy</span>
            </Button>
          </div>
        )}
      </div>
      {!isAssistant && (
        <Avatar className="w-8 h-8 border">
          <AvatarFallback>
            <User size={20} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
