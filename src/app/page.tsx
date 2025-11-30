import ChatHistory from '@/components/chat-history';
import ChatInterface from '@/components/chat-interface';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function Home() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full items-start justify-center bg-background">
        <Sidebar>
          <ChatHistory />
        </Sidebar>
        <SidebarInset>
          <ChatInterface />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
