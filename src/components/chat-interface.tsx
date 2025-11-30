'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Send, Mic, Sparkles, LoaderCircle, PlusSquare } from 'lucide-react';
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
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        handleVoicesChanged(); // Initial call
    }

    return () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        }
    };
  }, []);

  const readAloud = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const speak = (allVoices: SpeechSynthesisVoice[]) => {
      window.speechSynthesis.cancel();

      const cleanText = text.replace(/(\*|_|`|#)/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const siriVoice = allVoices.find(voice => 
        voice.name.toLowerCase() === 'samantha' && voice.lang.startsWith('en')
      );
  
      const femaleVoice = siriVoice || allVoices.find(voice => 
        voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
      ) || allVoices.find(voice => voice.lang.startsWith('en'));
  
      if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.pitch = 1;
        utterance.rate = 1;
      }
  
      window.speechSynthesis.speak(utterance);
    };

    const currentVoices = window.speechSynthesis.getVoices();
    if (currentVoices.length > 0) {
      setVoices(currentVoices);
      speak(currentVoices);
    } else {
      const voiceCheckInterval = setInterval(() => {
        const allVoices = window.speechSynthesis.getVoices();
        if (allVoices.length > 0) {
          setVoices(allVoices);
          clearInterval(voiceCheckInterval);
          speak(allVoices);
        }
      }, 100);
    }
  };
  
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
        readAloud(result.response);
      }
      setMessages(finalMessages);
    });
  }

  const handleNewChat = () => {
    setMessages([]);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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
    <div className="w-full h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">VoiceWise AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNewChat}>
              <PlusSquare className="mr-2 h-4 w-4" />
              New Chat
          </Button>
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
              <ChatMessage key={msg.id} message={msg} onSummarize={handleSummarize} onReadAloud={readAloud} />
            ))}
          </div>
          <div ref={scrollEndRef} />
        </ScrollArea>
      </div>
      <div className="p-4 bg-background border-t">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Message VoiceWise AI...'}
              disabled={isPending || isListening}
              className="flex-grow rounded-full py-6 px-6 border-border shadow-sm focus:ring-primary focus:border-primary"
            />
            <div className="absolute right-4 flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                onClick={handleVoiceInput}
                disabled={isPending}
                variant={isListening ? 'destructive' : 'ghost'}
                className="rounded-full text-muted-foreground hover:text-foreground"
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                <Mic />
              </Button>
              <Button type="submit" size="icon" disabled={isPending || !input.trim()} aria-label="Send message" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
