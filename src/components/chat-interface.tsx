'use client';

import { useState, useTransition } from 'react';
import { Send, Sparkles, LoaderCircle, PlusSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getAiResponse, getSummarizedResponse } from '@/app/actions';
import { ChatMessage, type Message } from './chat-message';
import { Avatar, AvatarFallback } from './ui/avatar';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const processUserInput = (text: string) => {
    if (!text.trim() || isPending) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    const loadingMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'loading...' };
    
    const currentMessages = [...messages, newUserMessage, loadingMessage];
    setMessages(currentMessages);
    
    startTransition(async () => {
      const result = await getAiResponse(text);
      let finalMessages;

      if (result.error) {
        finalMessages = currentMessages.filter(msg => msg.id !== loadingMessage.id);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        const newAssistantMessage: Message = { id: Date.now().toString(), role: 'assistant', content: result.response };
        finalMessages = currentMessages.map(msg => msg.id === loadingMessage.id ? newAssistantMessage : msg);
      }
      setMessages(finalMessages);
    });
  }

  const handleNewChat = () => {
    setMessages([]);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    processUserInput(input);
    setInput('');
  };

  const handleSummarize = (text: string) => {
    startTransition(async () => {
      toast({ title: "Summarizing...", description: "Please wait while we process the response." });
      const result = await getSummarizedResponse(text);
      if (result.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      } else {
        const summaryMessage: Message = { id: Date.now().toString(), role: 'assistant', content: `✨ **Summary**:\n\n${result.summary}` };
        const updatedMessages = [...messages, summaryMessage];
        setMessages(updatedMessages);
      }
    });
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">GhanaAi</h1>
        </div>
      </header>
      <div className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4 max-w-3xl mx-auto w-full">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 pt-20 px-4">
                <div className="flex justify-center items-center mb-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10">
                      <Sparkles className="text-primary" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-2xl font-semibold text-foreground/80">How can I help you today?</p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onSummarize={handleSummarize} />
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 bg-background border-t">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={'Message GhanaAi...'}
              disabled={isPending}
              className="flex-grow rounded-full py-6 px-6 border-border shadow-sm focus:ring-primary focus:border-primary"
            />
            <div className="absolute right-4 flex items-center gap-2">
              <Button type="submit" size="icon" disabled={isPending || !input.trim()} aria-label="Send message" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
              </Button>
            </div>
          </form>
          <div className="flex justify-center mt-2">
            <Button variant="ghost" onClick={handleNewChat} className="text-xs text-muted-foreground">
              <PlusSquare className="w-4 h-4 mr-2"/>
              New Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
