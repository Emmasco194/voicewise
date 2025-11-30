'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar';
import type { ChatSession } from './chat-interface';
import { PlusCircle, Search } from 'lucide-react';

export default function ChatHistory() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = () => {
      const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      setChatHistory(history);
    };
    
    loadHistory();
    window.addEventListener('history-updated', loadHistory);
    window.addEventListener('chat-selected', (e) => {
      setActiveChatId((e as CustomEvent).detail.id);
    });

    return () => {
      window.removeEventListener('history-updated', loadHistory);
      window.removeEventListener('chat-selected', (e) => {
        setActiveChatId((e as CustomEvent).detail.id);
      });
    };
  }, []);

  const handleSelectChat = (session: ChatSession) => {
    window.dispatchEvent(new CustomEvent('chat-selected', { detail: session }));
    setActiveChatId(session.id);
  };
  
  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent('new-chat-started'));
    setActiveChatId(null);
  };

  const filteredHistory = chatHistory.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">History</h2>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleNewChat}>
                <PlusCircle />
            </Button>
        </div>
        <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
                placeholder="Search history..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow">
        <ScrollArea className="h-full">
            <SidebarMenu className="p-2">
                {filteredHistory.map(session => (
                    <SidebarMenuItem key={session.id}>
                        <SidebarMenuButton 
                          onClick={() => handleSelectChat(session)}
                          isActive={session.id === activeChatId}
                          className="truncate"
                          variant="ghost"
                        >
                            {session.title}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </div>
  );
}
