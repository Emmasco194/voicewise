'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Send, Mic, Sparkles, LoaderCircle, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getAiResponse, getSummarizedResponse } from '@/app/actions';
import { ChatMessage, type Message } from './chat-message';
import { Avatar, AvatarFallback } from './ui/avatar';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const readAloud = (text: string) => {
    if (!isTtsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };
  
  const processUserInput = (text: string) => {
    if (!text.trim() || isPending) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    const loadingMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'loading...' };
    setMessages(prev => [...prev, newUserMessage, loadingMessage]);

    startTransition(async () => {
      const result = await getAiResponse(text);

      if (result.error) {
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        const newAssistantMessage: Message = { id: Date.now().toString(), role: 'assistant', content: result.response };
        setMessages(prev => prev.map(msg => msg.id === loadingMessage.id ? newAssistantMessage : msg));
        readAloud(result.response);
      }
    });
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
        setMessages(prev => [...prev, summaryMessage]);
        readAloud(`Here is the summary: ${result.summary}`);
      }
    });
  };
  
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Browser Not Supported',
        description: 'Your browser does not support voice recognition.',
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      toast({
        variant: 'destructive',
        title: 'Voice Recognition Error',
        description: event.error,
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput('');
      processUserInput(transcript);
    };

    recognition.start();
  };

  return (
    <Card className="w-full max-w-3xl h-[95vh] shadow-2xl flex flex-col bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary/20">
              <Sparkles className="text-primary" />
            </AvatarFallback>
          </Avatar>
          <CardTitle className="font-headline text-xl">VoiceWise AI</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsTtsEnabled(prev => !prev)} className="text-muted-foreground hover:text-foreground">
            {isTtsEnabled ? <Volume2 /> : <VolumeX />}
            <span className="sr-only">{isTtsEnabled ? 'Disable' : 'Enable'} Text-to-Speech</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground pt-10 px-4">
                <p className="text-lg">Welcome to VoiceWise AI</p>
                <p>Ask me anything, or use the microphone to talk.</p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onSummarize={handleSummarize} onReadAloud={readAloud} />
            ))}
          </div>
          <div ref={scrollEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Type your question...'}
            disabled={isPending || isListening}
            className="flex-grow"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleVoiceInput}
            disabled={isPending}
            variant={isListening ? 'destructive' : 'outline'}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            <Mic />
          </Button>
          <Button type="submit" size="icon" disabled={isPending || !input.trim()} aria-label="Send message">
            {isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
