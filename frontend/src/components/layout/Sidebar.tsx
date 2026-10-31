import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Landmark, 
  Smartphone, 
  ShieldAlert, 
  Bot, 
  Network, 
  FileBarChart, 
  Layers, 
  Radio, 
  Gift, 
  Eye, 
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  X,
  CheckCircle2
} from 'lucide-react';
import { useDerivedState } from '../../context/DerivedStateContext';
import { TaraLogo } from '../common/TaraLogo';

interface NavGroup {
  title: string;
  items: {
    name: string;
    path?: string;
    onClick?: () => void;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
    isExternal?: boolean;
    isAction?: boolean;
  }[];
}

export const Sidebar: React.FC<{ onOpenTara?: () => void; isTaraOpen?: boolean }> = ({ onOpenTara, isTaraOpen }) => {
  const { state } = useDerivedState();
  const navigate = useNavigate();
  const openCasesCount = state.open_cases.length;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleOpenTara = () => {
    if (onOpenTara) {
      onOpenTara();
    } else {
      window.dispatchEvent(new CustomEvent('tara:open_panel'));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/?mode=onboarding';
  };

  const NAV_GROUPS: NavGroup[] = [
    {
      title: 'TRACK',
      items: [
        { name: 'Overview', path: '/home', icon: LayoutDashboard },
        { name: 'Transactions', path: '/transactions', icon: Receipt, badge: '68' },
        { name: 'Settlements', path: '/settlements', icon: Landmark, badge: 'T+0' },
        { name: 'Devices', path: '/devices', icon: Smartphone, badge: 'Online', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
        { 
          name: 'Disputes', 
          path: '/disputes', 
          icon: ShieldAlert, 
          badge: openCasesCount > 0 ? `${openCasesCount} Alert` : undefined,
          badgeColor: 'bg-rose-50 text-rose-800 border-rose-200'
        },
      ]
    },
    {
      title: 'SERVICES & AI',
      items: [
        { name: 'Reports', path: '/reports', icon: FileBarChart },
        { name: 'Offers', path: '/offers', icon: Gift },
        { name: '3D Room', path: '/room', icon: Eye },
        { name: 'Ontology Graph', path: '/ontology', icon: Network },
        { 
          name: 'Tara Teammate', 
          onClick: handleOpenTara, 
          isAction: true,
          icon: Bot, 
          badge: isTaraOpen ? 'Open' : 'Active', 
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' 
        },
      ]
    },
    {
      title: 'LIVE HARDWARE & APPS',
      items: [
        { name: 'Paytm Blueprint', path: '/integration', icon: Layers, badge: 'API' },
        { name: 'Mobile PWA (/mobile)', path: '/mobile', icon: Smartphone },
        { name: 'Soundbox Hardware (/soundbox)', path: '/soundbox', icon: Radio },
        { name: 'Merchant Support', path: '/support', icon: HelpCircle },
        { name: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200/80 flex flex-col shrink-0 select-none font-sans h-full relative">
      
      {/* Brand Logo Header with Precision TaraLogo & Quick Actions */}
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
        <TaraLogo size="md" showSubtitle={true} badgeText="PRO" />
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => navigate('/security')}
            title="Security & Trust Center" 
            aria-label="Security & Trust Center"
            className="p-1.5 hover:bg-neutral-100 rounded-lg text-emerald-600 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </button>

          <button 
            onClick={() => setShowNotifications(prev => !prev)}
            title="Notifications" 
            aria-label="Notifications"
            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors relative"
          >
            <Bell className="w-4 h-4 lucide-bell" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Notifications Popover Dropdown */}
      {showNotifications && (
        <div className="absolute top-16 left-3 right-3 z-50 bg-white rounded-2xl shadow-2xl border border-neutral-200/90 p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Notifications</span>
            </div>
            <button 
              onClick={() => setShowNotifications(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="py-2 space-y-2 text-xs">
            <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-xl text-neutral-800">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Soundbox SB-4421 Active</span>
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5">All 68 transactions announced with 0 audio drops.</p>
            </div>
            <div className="p-2 bg-neutral-50 border border-neutral-100 rounded-xl text-neutral-800">
              <span className="font-semibold text-[11px] text-neutral-900">Settlement Verified</span>
              <p className="text-[10px] text-neutral-500 mt-0.5">₹48,250.00 credited to HDFC Bank A/c •••• 1111.</p>
            </div>
          </div>
        </div>
      )}

      {/* Origin Clean Navigation Groupings */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              {group.title}
            </div>

            {group.items.map((item) => {
              // Action item that opens Tara side chat in-place
              if (item.isAction) {
                return (
                  <button
                    key={item.name}
                    onClick={item.onClick}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isTaraOpen
                        ? 'bg-neutral-100 text-neutral-900 font-semibold shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon className={`w-4 h-4 shrink-0 ${isTaraOpen ? 'text-emerald-600' : 'text-neutral-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border text-[9px] shrink-0 ${item.badgeColor || 'bg-neutral-100 text-neutral-600 border-neutral-200/60'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              }

              // Standard NavLink
              return (
                <NavLink
                  key={item.name}
                  to={item.path || '#'}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noreferrer' : undefined}
                  aria-label={item.name}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive && !item.isExternal
                        ? 'bg-neutral-100 text-neutral-900 font-semibold shadow-2xs'
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5 truncate">
                        <item.icon className={`w-4 h-4 shrink-0 ${isActive && !item.isExternal ? 'text-neutral-900' : 'text-neutral-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border text-[9px] shrink-0 ${
                          isActive && !item.isExternal
                            ? 'bg-white text-neutral-900 border-neutral-200' 
                            : item.badgeColor || 'bg-neutral-100 text-neutral-600 border-neutral-200/60'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Profile Popover / Dropdown for Kumar Stores */}
      {showProfileMenu && (
        <div className="absolute bottom-20 left-3 right-3 z-50 bg-white rounded-2xl shadow-2xl border border-neutral-200/90 p-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-full bg-[#002970] text-white flex items-center justify-center text-xs font-bold shrink-0">
              KS
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-neutral-900 truncate">Kumar Stores</div>
              <div className="text-[10px] text-neutral-400">Rahul Sharma · Owner</div>
            </div>
          </div>
          
          <div className="py-2 space-y-1 text-[11px] text-neutral-600 border-b border-neutral-100">
            <div className="flex justify-between">
              <span className="text-neutral-400">Merchant ID:</span>
              <span className="font-mono font-medium text-neutral-800">MERCH_9921</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Primary Bank:</span>
              <span className="font-medium text-neutral-800">HDFC Bank •••• 1111</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Soundbox:</span>
              <span className="text-emerald-700 font-semibold">SB-4421 Live</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
            >
              <span>Log Out</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Origin-style Bottom Action Buttons & Profile Card */}
      <div className="p-3 border-t border-neutral-100 bg-white space-y-2">
        <button
          onClick={handleOpenTara}
          className="w-full py-2.5 px-3 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>✦ Ask anything</span>
        </button>

        {/* Profile Element for Kumar Stores */}
        <button
          onClick={() => setShowProfileMenu(prev => !prev)}
          className="w-full p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 flex items-center justify-between transition-colors text-left"
          title="Account Profile"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#002970] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
              KS
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-neutral-900 truncate leading-none">Kumar Stores</div>
              <div className="text-[10px] text-neutral-400 mt-0.5 truncate">Rahul Sharma · Owner</div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1" />
        </button>
      </div>

    </aside>
  );
};
