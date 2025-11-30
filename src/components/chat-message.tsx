import { Bot, User, LoaderCircle, Volume2, Sparkles, Clipboard } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { memo } from 'react';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

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

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

const AssistantMessage = memo(({ message, onSummarize, onReadAloud, isLongResponse }: ChatMessageProps & { isLongResponse: boolean }) => {
  const { toast } = useToast();
  const htmlContent = marked.parse(message.content) as string;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content).then(() => {
        toast({ title: 'Copied to clipboard!' });
      });
    }
  };

  if (message.content === 'loading...') {
    return (
      <div className="flex items-start gap-4 p-4">
        <Avatar className="w-8 h-8 border">
          <AvatarFallback className="bg-blue-500 text-white">
            <Bot size={20} />
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2 text-gray-500 mt-1">
          <LoaderCircle className="animate-spin w-5 h-5" />
          <span className="text-sm">Thinking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='flex items-start gap-4'>
      <Avatar className="w-8 h-8 border bg-white">
        <AvatarFallback className="bg-blue-100">
          <Bot size={20} className="text-blue-500" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        {message.content && (
          <div className="flex items-center justify-start gap-1 mt-2">
            {isLongResponse && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-500" onClick={() => onSummarize(message.content)}>
                <Sparkles size={16} />
                <span className="sr-only">Summarize</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-500" onClick={() => onReadAloud(message.content)}>
              <Volume2 size={16} />
              <span className="sr-only">Read aloud</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-500" onClick={handleCopy}>
              <Clipboard size={16} />
              <span className="sr-only">Copy</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

AssistantMessage.displayName = 'AssistantMessage';

export function ChatMessage({ message, onSummarize, onReadAloud }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const isLongResponse = isAssistant && message.content.length > 250;

  if (isAssistant) {
    return <AssistantMessage message={message} onSummarize={onSummarize} onReadAloud={onReadAloud} isLongResponse={isLongResponse} />;
  }

  return (
    <div className={cn('flex items-start gap-4')}>
        <Avatar className="w-8 h-8 border">
            <AvatarFallback>
            <User size={20} />
            </AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <p className="whitespace-pre-wrap text-sm pt-1.5">{message.content}</p>
        </div>
    </div>
  );
}
