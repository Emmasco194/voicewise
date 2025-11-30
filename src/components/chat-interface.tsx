'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Send, Mic, Sparkles, LoaderCircle, PlusCircle } from 'lucide-react';
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
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const getVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      };
      getVoices();
      window.speechSynthesis.onvoiceschanged = getVoices;
    }
  }, []);

  const readAloud = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const femaleVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.startsWith('en'));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
      utterance.pitch = 1; 
      utterance.rate = 1;
    }

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

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="w-full max-w-4xl h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">VoiceWise AI</h1>
        <Button variant="ghost" size="sm" onClick={handleNewChat}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </header>
      <div className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4 max-w-3xl mx-auto w-full">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 pt-20 px-4">
                <div className="flex justify-center items-center mb-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100">
                      <Sparkles className="text-blue-500" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-2xl font-semibold text-gray-700">How can I help you today?</p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onSummarize={handleSummarize} onReadAloud={readAloud} />
            ))}
          </div>
          <div ref={scrollEndRef} />
        </ScrollArea>
      </div>
      <div className="p-4 bg-white border-t">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Message VoiceWise AI...'}
              disabled={isPending || isListening}
              className="flex-grow rounded-full py-6 px-6 border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute right-4 flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                onClick={handleVoiceInput}
                disabled={isPending}
                variant={isListening ? 'destructive' : 'ghost'}
                className="rounded-full text-gray-500 hover:text-gray-700"
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                <Mic />
              </Button>
              <Button type="submit" size="icon" disabled={isPending || !input.trim()} aria-label="Send message" className="rounded-full bg-blue-500 hover:bg-blue-600 text-white">
                {isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
