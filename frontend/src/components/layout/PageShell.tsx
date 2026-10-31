import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TaraPanel } from './TaraPanel';
import { VoiceJobHUD } from '../voice/VoiceJobHUD';

interface PageShellProps {
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ children }) => {
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat';
  const [isTaraOpen, setIsTaraOpen] = useState(true);

  // Global listener for toggling the side chat
  useEffect(() => {
    const handleToggle = () => setIsTaraOpen(prev => !prev);
    const handleOpen = () => setIsTaraOpen(true);
    const handleClose = () => setIsTaraOpen(false);

    window.addEventListener('tara:toggle_panel', handleToggle);
    window.addEventListener('tara:open_panel', handleOpen);
    window.addEventListener('tara:close_panel', handleClose);
    return () => {
      window.removeEventListener('tara:toggle_panel', handleToggle);
      window.removeEventListener('tara:open_panel', handleOpen);
      window.removeEventListener('tara:close_panel', handleClose);
    };
  }, []);

  return (
    <div className="h-screen bg-[#F9FAFB] flex font-sans overflow-hidden">
      {/* Full-height Sidebar on the left (No separate TopBar above it!) */}
      <Sidebar onOpenTara={() => setIsTaraOpen(true)} isTaraOpen={isTaraOpen} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className={`flex-1 overflow-auto bg-[#F9FAFB] relative transition-all duration-300 ${isChatRoute ? 'p-0 flex flex-col h-full' : 'p-6 sm:p-8'}`}>
          {children}

          {/* Floating Origin-style Ask Tara trigger when panel is closed */}
          {!isChatRoute && !isTaraOpen && (
            <button
              onClick={() => setIsTaraOpen(true)}
              className="fixed bottom-6 right-6 z-40 bg-[#151615] hover:bg-black text-[#FAF9F5] px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105 active:scale-95 border border-white/10"
              title="Open Tara AI Teammate"
              aria-label="Open Tara AI Teammate"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>✦ Ask Tara</span>
            </button>
          )}
        </main>

        {/* Tara Copilot Drawer right on current page */}
        {!isChatRoute && isTaraOpen && (
          <TaraPanel onClose={() => setIsTaraOpen(false)} />
        )}
      </div>

      <VoiceJobHUD />
    </div>
  );
};
