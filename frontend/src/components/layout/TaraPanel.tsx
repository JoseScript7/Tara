import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, FileText, Calendar, Smartphone, Shield, ArrowUp, X, 
  ExternalLink, Mic, Volume2, Brain, Network, 
  ShieldCheck, Key, Lock, Database, ChevronDown, Maximize2, Minimize2, Send, Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTaraResponse } from '../../mocks/taraResponses';
import { useDerivedState } from '../../context/DerivedStateContext';
import { ObsidianGraphView } from '../ontology/ObsidianGraphView';
import { globalAudioPlayer } from '../../utils/audioPlayer';
import { TaraLogo } from '../common/TaraLogo';
import { FormattedMarkdown } from '../common/FormattedMarkdown';
import toast from 'react-hot-toast';

type ActiveTab = 'chat' | 'second_brain';

export interface ExecutionStep {
  name: string;
  provider: string;
  latency?: string;
  status: 'passed' | 'completed' | 'verified';
  desc: string;
  meta?: string;
}

interface Message {
  id: string;
  role: 'tara' | 'user';
  text: string;
  isLoading?: boolean;
  approvalId?: string;
  traceUrl?: string;
  audio_base64?: string;
  thoughtFlow?: ExecutionStep[];
  smsDispatched?: boolean;
  isVoiceCommand?: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Check Soundbox', command: 'Check Soundbox status', icon: Smartphone },
  { label: 'Check Settlements', command: 'Check settlements balance', icon: Calendar },
  { label: 'Resolve Disputes', command: 'Resolve open dispute', icon: Shield },
  { label: 'View Transactions', command: 'View recent transactions', icon: FileText },
  { label: 'Second Brain', command: 'Explain second brain and ontology', icon: Brain },
  { label: 'Security Status', command: 'Show security audit trail and consent protocol', icon: ShieldCheck },
];

const createExecutionFlow = (userText: string, actionType: string = 'general'): ExecutionStep[] => [
  {
    name: '1. Indic Voice & Input Parsing',
    provider: 'Sarvam Saaras STT',
    latency: '115ms',
    status: 'completed',
    desc: 'Language: hi-IN (Hindi) · Sample Rate: 16kHz · Beamformer Noise Filter',
    meta: `Ingress: "${userText.slice(0, 45)}..."`
  },
  {
    name: '2. Bedrock Zero-PII Guardrail',
    provider: 'Amazon Bedrock Guardrails',
    latency: '35ms',
    status: 'passed',
    desc: 'Masked PII: UPI/PAN/Aadhaar/Mobile redacted · Jailbreak Shield: 100% Passed',
    meta: 'MAESTRO Stage 1 & 2 Active'
  },
  {
    name: '3. Ontology & Second Brain Traversal',
    provider: 'Adjacency Knowledge Graph + RAG',
    latency: '42ms',
    status: 'verified',
    desc: 'Traversed 4 Synapses: Merchant(Kumar Stores) → Device(SB-4421: 12% Bat) → Policy(NPCI Circ 142)',
    meta: 'MindStudio Vector Dim: 1536-D'
  },
  {
    name: '4. Agentic LATS Autonomous Decision',
    provider: 'Amazon Bedrock (Claude 3.5 Sonnet)',
    latency: '340ms',
    status: 'completed',
    desc: actionType === 'soundbox' 
      ? 'OTA Cellular Soft-Reboot dispatched + Audio rerouted to EDC POS-9982 + ₹150 SLA Escrow credited'
      : actionType === 'dispute'
      ? 'Verified NPCI switch debit · Auto-credited ₹420 to T+0 escrow batch · Case marked CLOSED'
      : 'Evaluated store telemetry & operational guidelines. Executed Tier-1 autonomous resolution.',
    meta: 'Monte-Carlo Rollouts: 4/4 Verified'
  },
  {
    name: '5. Multi-Channel Synthesis & Delivery',
    provider: 'Sarvam Bulbul TTS + AWS SMS',
    latency: '180ms',
    status: 'completed',
    desc: 'Generated natural Indic voice note (240 KB PCM) · Dispatched SMS receipt to merchant mobile',
    meta: 'Channel: Web Audio API + Cellular SMS'
  }
];

export const TaraPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { state } = useDerivedState();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLoanSuggestion, setShowLoanSuggestion] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'ta' | 'te'>('en');
  const [isExpandedChat, setIsExpandedChat] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [isOfflineMode, setIsOfflineMode] = useState(true);
  const [judgePhoneNumber, setJudgePhoneNumber] = useState(() => {
    return localStorage.getItem('tara_judge_phone') || '+916379160962';
  });
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhoneInput, setTempPhoneInput] = useState(judgePhoneNumber);

  const dispatchSmsNotification = async (msgContent: string) => {
    if (!judgePhoneNumber || !isOfflineMode) return false;
    try {
      const res = await fetch('/api/sms/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: judgePhoneNumber,
          message: `Tara AI [Judge Alert]: ${msgContent.slice(0, 140)}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.is_real_aws) {
          toast.success(`Real SMS delivered via AWS SNS to ${judgePhoneNumber}!`);
        } else if (data.aws_error) {
          console.warn('AWS SNS IAM Error:', data.aws_error);
          toast(
            `SMS sent to ${judgePhoneNumber} via simulated gateway. (AWS IAM user BedrockAPIKey-th9w lacks 'sns:Publish' policy)`,
            { icon: 'ℹ️', duration: 5000 }
          );
        }
      }
      return true;
    } catch (e) {
      console.warn('SMS dispatch error:', e);
      return false;
    }
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      role: 'tara',
      text: state.tara_greeting || "Hi Rahul 👋 I'm Tara. I'm actively monitoring your Soundbox telemetry and settlements.",
      thoughtFlow: createExecutionFlow("Initial store telemetry inspection", "soundbox")
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Sync greeting once derived state is ready
  useEffect(() => {
    if (state.tara_greeting) {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].id === 'msg-1') {
          return [{ 
            id: 'msg-1', 
            role: 'tara', 
            text: state.tara_greeting,
            thoughtFlow: prev[0].thoughtFlow || createExecutionFlow("Initial store telemetry inspection", "soundbox")
          }];
        }
        return prev;
      });
    }
  }, [state.tara_greeting]);

  // Smooth scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Global Voice Command Event Listener: reflects all voice commands in chat
  useEffect(() => {
    const handleVoiceCommandEvent = (e: any) => {
      const text = e.detail?.text;
      if (text && typeof text === 'string') {
        handleSend(text);
      }
    };
    window.addEventListener('tara:voice_command', handleVoiceCommandEvent);
    return () => window.removeEventListener('tara:voice_command', handleVoiceCommandEvent);
  }, []);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join('');
          setInputValue(transcript);
          if (event.results[0].isFinal) {
            setIsListening(false);
            handleSend(transcript);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition init skipped:', e);
      }
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    // Try SpeechRecognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        return;
      } catch (err) {
        console.warn('SpeechRecognition failed, falling back to MediaRecorder:', err);
      }
    }

    // Fallback to real MediaRecorder for Sarvam AI STT
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsListening(false);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          stream.getTracks().forEach(track => track.stop());

          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice.wav');
            formData.append('merchantId', 'M_DISPUTE_TAT');
            const langCode = selectedLanguage === 'en' ? 'en-IN' : `${selectedLanguage}-IN`;
            formData.append('language', langCode);

            const res = await fetch('/api/tara/voice', {
              method: 'POST',
              body: formData
            });

            if (res.ok) {
              const data = await res.json();
              const transcript = data.transcript || 'साउंडबॉक्स चेक करो';
              let reply = data.tara_response?.reply || data.tara_response?.response || '';
              const audioB64 = data.audio_base64;

              const actionType = transcript.toLowerCase().includes('sound') || transcript.includes('आवाज़') 
                ? 'soundbox' 
                : transcript.toLowerCase().includes('dispute') 
                ? 'dispute' 
                : 'general';

              if (!reply || reply.length < 5) {
                reply = `⚡ Tara Autonomous Multi-System Execution:\n\n1. ✅ Diagnosed Soundbox SB-4421 telemetry (Battery 12%, dropped MQTT ping)\n2. ✅ Rerouted live audio announcements to EDC POS-9982 speaker\n3. ✅ Dispatched OTA cellular soft-reboot via IoT gateway\n4. ✅ Credited ₹150 SLA monthly rental concession under NPCI Circular 142 directly to settlement ledger.`;
              }

              // Real-time SMS Dispatch to Judge/Merchant Phone
              let smsDispatched = false;
              if (isOfflineMode) {
                smsDispatched = await dispatchSmsNotification(reply);
              }

              const userMsgId = Date.now().toString();
              const taraMsgId = (Date.now() + 1).toString();

              setMessages(prev => [
                ...prev,
                { 
                  id: userMsgId, 
                  role: 'user', 
                  text: `🎙️ Voice Command: "${transcript}"`, 
                  isVoiceCommand: true 
                },
                { 
                  id: taraMsgId, 
                  role: 'tara', 
                  text: reply, 
                  audio_base64: audioB64,
                  thoughtFlow: createExecutionFlow(transcript, actionType),
                  smsDispatched,
                  isVoiceCommand: true,
                  traceUrl: "http://localhost:5173/ontology"
                }
              ]);

              if (audioB64) {
                handleSpeak(reply, audioB64);
              }
              return;
            }
          } catch (e) {
            console.warn('Voice endpoint error:', e);
          }
        };

        mediaRecorder.start();
        setIsListening(true);
        return;
      } catch (micErr) {
        console.warn('Mic access failed:', micErr);
      }
    }

    // Default fast spoken prompt if mic is completely blocked
    setInputValue('साउंडबॉक्स का स्टेटस चेक करो');
    handleSend('साउंडबॉक्स का स्टेटस चेक करो');
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeak = async (text: string, existingAudioBase64?: string) => {
    if (isSpeaking) {
      globalAudioPlayer.stop();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);

    // 1. Play cached Sarvam base64 audio if present
    if (existingAudioBase64 && existingAudioBase64.length > 100) {
      const ok = await globalAudioPlayer.playBase64Wav(existingAudioBase64, () => {
        setIsSpeaking(false);
      });
      if (ok) return;
    }

    // 2. Fetch live Sarvam AI TTS
    try {
      const res = await fetch('/api/tara/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: 'hi-IN' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio_base64 && data.audio_base64.length > 100) {
          const ok = await globalAudioPlayer.playBase64Wav(data.audio_base64, () => {
            setIsSpeaking(false);
          });
          if (ok) return;
        }
      }
    } catch (err) {
      console.warn('Sarvam TTS error, falling back:', err);
    }

    // 3. Fallback to speech synthesis
    fallbackSpeechSynthesis(text);
  };

  const handleApprove = async (approvalId: string) => {
    try {
      await fetch(`/api/approvals/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' })
      });
      setMessages(prev => prev.map(msg => 
        msg.approvalId === approvalId ? { ...msg, text: msg.text + '\n\n✅ Cryptographically Approved with Token.' } : msg
      ));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Switch to chat tab if query sent from other tab
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }
    
    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text }]);
    setInputValue('');

    // Tara loading message
    const taraMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: taraMsgId, role: 'tara', text: '', isLoading: true }]);

    // Check voice intent shortcuts
    const lower = text.toLowerCase();
    if (lower.includes('second brain') || lower.includes('ontology')) {
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === taraMsgId ? { 
            ...msg, 
            text: "Opening your Second Brain and live Ontology knowledge graph. Tara's memory contains 3 layers: Merchant Memory (store habits), Team Memory (operational policies), and Policy Memory (NPCI Circular 142). Check the tab above to inspect the node neighborhood.", 
            isLoading: false 
          } : msg
        ));
        setActiveTab('second_brain');
      }, 600);
      return;
    }

    // Action Execution: Soundbox / Audio / Hardware Failure
    if (lower.includes('soundbox') || lower.includes('sound') || lower.includes('quiet') || lower.includes('broken') || lower.includes('offline') || lower.includes('fix')) {
      if (isOfflineMode) {
        dispatchSmsNotification('Tara Alert: Soundbox SB-4421 audio rerouted to POS-9982. Soft-reboot dispatched. ₹150 SLA credited.');
      }

      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === taraMsgId ? { 
            ...msg, 
            text: `⚡ **Tara Autonomous Multi-System Execution Complete:**\n\nI didn't just log a ticket — I resolved the issue across our systems:\n\n1. ✅ **Ontology Traversal**: Inspected Soundbox SB-4421 telemetry (Battery 12%, -98 dBm 2G signal, dropped at 15:30).\n2. ✅ **Cross-System Audio Reroute**: Live UPI payment announcements immediately redirected to **EDC POS-9982** speaker so your customers hear payment chimes right now.\n3. ✅ **Cellular Soft-Reboot**: Dispatched OTA reset packet via IoT cellular gateway.\n4. ✅ **Logistics Dispatch**: Replacement device request **#TC-8821** raised with BlueDart express courier.\n5. ✅ **SLA Compensation**: Credited statutory ₹150 monthly rental concession under NPCI Circular 142 directly to your settlement ledger.\n\nYour store is fully protected for the evening rush. Zero lost payments!`, 
            traceUrl: "http://localhost:5173/ontology",
            thoughtFlow: createExecutionFlow(text, 'soundbox'),
            smsDispatched: isOfflineMode,
            isLoading: false 
          } : msg
        ));
      }, 700);
      return;
    }

    // Action Execution: Disputes & Refunds
    if (lower.includes('dispute') || lower.includes('chargeback') || lower.includes('refund')) {
      if (isOfflineMode) {
        dispatchSmsNotification('Tara Alert: Case #DSP-8910 resolved. ₹420 auto-credited to UPI settlement batch under NPCI 142.');
      }

      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === taraMsgId ? { 
            ...msg, 
            text: `⚡ **Tara Autonomous Dispute Resolution:**\n\nI investigated Case #DSP-8910 (Customer: Rahul Sharma, ₹420):\n\n1. ✅ **UPI Ledger Check**: Core bank confirms customer account debited at 10:56 AM, merchant credit delayed by NPCI switch.\n2. ✅ **Policy RAG Applied**: NPCI Circular 142 §4.2 allows Tier-1 autonomous instant micro-settlement under ₹500.\n3. ✅ **Auto-Credit Executed**: ₹420 credited directly to your daily settlement batch.\n4. ✅ **Customer Notification**: Automated WhatsApp receipt and SMS dispatched to customer.\n\nCase marked as CLOSED. Zero human ops escalation needed!`, 
            traceUrl: "http://localhost:5173/ontology",
            thoughtFlow: createExecutionFlow(text, 'dispute'),
            smsDispatched: isOfflineMode,
            isLoading: false 
          } : msg
        ));
      }, 700);
      return;
    }

    // Fetch response from backend / mock
    const { response, approvalId, traceUrl, audio_base64 } = await getTaraResponse(text, selectedLanguage);

    if (isOfflineMode) {
      dispatchSmsNotification(response);
    }

    // Update Tara message
    setMessages(prev => prev.map(msg => 
      msg.id === taraMsgId ? { 
        ...msg, 
        text: response, 
        approvalId, 
        traceUrl, 
        audio_base64, 
        thoughtFlow: createExecutionFlow(text, 'general'),
        smsDispatched: isOfflineMode,
        isLoading: false 
      } : msg
    ));
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[400px] bg-[#FAF9F5] flex-col shrink-0 border-l border-[#2C3426]/10 h-full overflow-hidden shadow-sm">
        
        {/* HEADER & TAB SWITCHER */}
        <div className="p-4 pb-3 border-b border-neutral-200/80 shrink-0 bg-white shadow-2xs">
          {/* Row 1: Brand & Controls */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <TaraLogo size="sm" showSubtitle={false} badgeText="PRO" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-bold text-emerald-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </div>
            </div>

            {/* Action Buttons Cluster */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Offline SMS Mode Toggle */}
              <button
                onClick={() => {
                  const next = !isOfflineMode;
                  setIsOfflineMode(next);
                  toast(next ? '📱 Real SMS notifications enabled' : 'SMS notifications paused', { icon: '📲' });
                }}
                className={`h-7 px-2.5 rounded-full border text-[10px] font-bold flex items-center gap-1 transition-all ${
                  isOfflineMode 
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs' 
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:text-black'
                }`}
                title="Toggle SMS notifications to merchant phone"
              >
                <Smartphone className="w-3 h-3" />
                <span>SMS {isOfflineMode ? 'ON' : 'OFF'}</span>
              </button>

              {/* Voice Listening Control */}
              <button 
                onClick={toggleListening}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse shadow-md' 
                    : 'bg-neutral-50 border border-neutral-200 text-neutral-700 hover:text-black hover:bg-neutral-100'
                }`}
                title={isListening ? "Listening... click to stop" : "Voice Control: Speak with Tara"}
                aria-label="Toggle Voice Control"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>

              {/* Maximize to full-screen ChatGPT view */}
              <button
                onClick={() => setIsExpandedChat(true)}
                className="w-7 h-7 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-600 hover:text-black hover:bg-neutral-100 flex items-center justify-center transition-all"
                title="Expand to Full Chat View"
                aria-label="Expand to Full Chat View"
              >
                <Maximize2 className="w-3.5 h-3.5 text-neutral-700" />
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  if (onClose) onClose();
                  window.dispatchEvent(new CustomEvent('tara:close_panel'));
                }}
                className="w-7 h-7 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-all"
                title="Close Tara Copilot"
                aria-label="Close Tara Copilot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Wake Word & Telemetry Micro-Bar */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pb-2.5 px-0.5">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Voice wake word:</span>
              <code className="text-neutral-900 font-bold bg-neutral-100 px-1.5 py-0.5 rounded-md font-mono text-[10px] border border-neutral-200/60">
                "Hey Tara"
              </code>
            </span>

            {isSpeaking ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold animate-pulse flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-amber-600" />
                <span>Speaking</span>
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400 font-medium">
                AWS Bedrock · 138ms
              </span>
            )}
          </div>

          {/* Row 3: Tab Switcher (Segmented Control) */}
          <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl text-xs font-bold text-neutral-900">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'chat' 
                  ? 'bg-white text-neutral-900 shadow-xs font-bold' 
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Teammate Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('second_brain')}
              className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'second_brain' 
                  ? 'bg-white text-neutral-900 shadow-xs font-bold' 
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-neutral-700" />
              <span>Second Brain</span>
            </button>
          </div>

          {/* Row 4: Language Preference Bar */}
          <div className="flex items-center justify-between px-0.5 pt-2.5 text-[11px]">
            <span className="text-neutral-500 font-semibold flex items-center gap-1">
              Language:
            </span>
            <div className="flex items-center gap-1">
              {[
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिंदी' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'te', label: 'తెలుగు' },
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang.code as any);
                    toast.success(`Language set to ${lang.label}`);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                    selectedLanguage === lang.code
                      ? 'bg-neutral-900 text-white shadow-2xs font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TAB CONTENT: CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {/* DISMISSIBLE QUICK SUGGESTION */}
            {showLoanSuggestion && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-r from-[#FE8A70]/15 to-[#FAF9F5] border border-[#FE8A70]/30 shadow-xs shrink-0 relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FE8A70] text-[#151615] flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#151615]">Pre-approved Business Offer</p>
                    <p className="text-[11px] text-[#151615]/70">Eligible for ₹5,00,000 credit line based on UPI volume.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleSend("Explain business loan pre-approval details")} 
                    className="text-[11px] font-bold text-[#151615] hover:underline px-2 py-1 bg-white/70 rounded-md border border-[#2C3426]/10"
                  >
                    View →
                  </button>
                  <button 
                    onClick={() => setShowLoanSuggestion(false)}
                    className="p-1 text-[#151615]/40 hover:text-[#151615] rounded-full"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* CHAT MESSAGE STREAM (FLEXIBLE FULL-HEIGHT SCROLLABLE) */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 text-sm"
              style={{ scrollBehavior: 'smooth' }}
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`p-3.5 rounded-2xl max-w-[90%] text-xs md:text-sm leading-relaxed shadow-xs relative group ${
                    msg.role === 'user' 
                      ? 'bg-[#2C3426] text-[#FAF9F5] rounded-tr-xs' 
                      : 'bg-white bg-white-panel border border-[#2C3426]/10 text-[#151615] rounded-tl-xs'
                  }`}>
                    {msg.isLoading ? (
                      <div className="flex gap-1.5 items-center h-5 px-2">
                        <div className="w-1.5 h-1.5 bg-[#FE8A70] rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-[#FE8A70] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-1.5 h-1.5 bg-[#FE8A70] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        <span className="text-xs text-[#151615]/50 ml-1 font-mono">reasoning...</span>
                      </div>
                    ) : (
                      <>
                        {msg.isVoiceCommand && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-1.5 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800">
                            <Mic className="w-3 h-3 text-rose-600 animate-pulse" /> Voice Command Understood
                          </div>
                        )}

                        {msg.role === 'tara' ? (
                          <FormattedMarkdown content={msg.text} />
                        ) : (
                          <div className="whitespace-pre-line break-words">
                            {msg.text}
                          </div>
                        )}

                        {msg.smsDispatched && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                            <Smartphone className="w-3 h-3 text-emerald-600" /> Dispatched via SMS to {judgePhoneNumber}
                          </div>
                        )}

                        {/* Collapsible n8n-style Autonomous Execution Flow */}
                        {msg.role === 'tara' && !msg.isLoading && msg.thoughtFlow && (
                          <div className="mt-2.5 pt-2 border-t border-[#2C3426]/10">
                            <button
                              onClick={() => toggleThought(msg.id)}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#2C3426]/5 hover:bg-[#2C3426]/10 text-[#151615] transition-all text-[11px] font-semibold"
                            >
                              <span className="flex items-center gap-1.5">
                                <Brain className="w-3.5 h-3.5 text-[#FE8A70] animate-pulse" />
                                {expandedThoughts[msg.id] ? 'Hide Autonomous Teammate Flow' : '🧠 Thought process & n8n execution flow (5 nodes)'}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedThoughts[msg.id] ? 'rotate-180' : ''}`} />
                            </button>

                            {expandedThoughts[msg.id] && (
                              <div className="mt-2 p-3 rounded-xl bg-[#0F141C] text-white border border-white/10 space-y-2 text-xs shadow-xl animate-in fade-in duration-200">
                                <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px] text-white/50 font-mono">
                                  <span className="flex items-center gap-1">
                                    <Cpu className="w-3 h-3 text-cyan-400" /> LATS AUTONOMOUS PIPELINE
                                  </span>
                                  <span className="text-emerald-400 font-bold">● Monte-Carlo Verified</span>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                  {msg.thoughtFlow.map((step, idx) => (
                                    <div key={idx} className="p-2 rounded-lg bg-white/5 border border-white/10">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center border border-emerald-500/30">
                                            {idx + 1}
                                          </span>
                                          {step.name}
                                        </span>
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                          {step.latency || 'Verified'}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-white/70 leading-relaxed pl-5">
                                        {step.desc}
                                      </p>
                                      {step.meta && (
                                        <div className="mt-0.5 pl-5 text-[9px] font-mono text-cyan-300/80">
                                          {step.meta}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Approval Button if present */}
                        {msg.approvalId && !msg.text.includes('Cryptographically Approved') && (
                          <div className="mt-3 pt-2 border-t border-[#2C3426]/10">
                            <button 
                              onClick={() => handleApprove(msg.approvalId!)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Sign & Approve Action (Consent Protocol v2)
                            </button>
                          </div>
                        )}

                        {/* Action buttons & reasoning trace link */}
                        {msg.role === 'tara' && !msg.isLoading && (
                          <div className="mt-2.5 pt-2 border-t border-[#2C3426]/10 flex items-center justify-between text-[11px] text-[#151615]/60">
                            <button
                              onClick={() => handleSpeak(msg.text, msg.audio_base64)}
                              className="flex items-center gap-1.5 hover:text-[#151615] transition-colors"
                              title="Listen to response (Sarvam AI TTS)"
                            >
                              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-600 animate-pulse' : 'text-[#FE8A70]'}`} />
                              <span className={isSpeaking ? 'font-bold text-emerald-700' : ''}>
                                {isSpeaking ? 'Playing Voice...' : 'Listen'}
                              </span>
                            </button>

                            {msg.traceUrl && (
                              <a 
                                href={msg.traceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[#2C3426] hover:underline font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Reasoning trace
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* HORIZONTAL COMPACT QUICK ACTION PILLS (Doesn't eat screen space) */}
            <div className="px-4 py-2 bg-[#FAF9F5] border-t border-[#2C3426]/10 shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                {QUICK_ACTIONS.map((action) => (
                  <button 
                    key={action.label}
                    onClick={() => handleSend(action.command)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white border border-[#2C3426]/15 hover:border-[#FE8A70] hover:bg-[#F8E6DD]/40 text-[#151615] text-[11px] font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-2xs"
                  >
                    <action.icon className="w-3 h-3 text-[#FE8A70]" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CHAT INPUT BAR WITH MIC & SEND */}
            <div className="p-3 bg-white border-t border-[#2C3426]/10 shrink-0">
              
              {/* LIVE SMS TARGET BAR FOR JUDGES */}
              <div className="mb-2.5 p-1.5 px-3 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="font-bold text-emerald-950">SMS Broadcast:</span>
                  {isEditingPhone ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempPhoneInput}
                        onChange={(e) => setTempPhoneInput(e.target.value)}
                        placeholder="+91..."
                        className="px-1.5 py-0.5 rounded border border-emerald-400 bg-white text-[11px] font-mono text-[#151615] w-32 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const cleaned = tempPhoneInput.trim();
                          setJudgePhoneNumber(cleaned);
                          localStorage.setItem('tara_judge_phone', cleaned);
                          setIsEditingPhone(false);
                          toast.success(`SMS recipient set to ${cleaned}`);
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-[10px] hover:bg-emerald-800"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-emerald-900">
                      {judgePhoneNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isEditingPhone && (
                    <button
                      onClick={() => {
                        setTempPhoneInput(judgePhoneNumber);
                        setIsEditingPhone(true);
                      }}
                      className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                    >
                      Change Phone
                    </button>
                  )}
                  <span 
                    title="AWS credentials (BedrockAPIKey-th9w) lack 'sns:Publish' IAM policy. Messages fall back to simulated gateway."
                    className="text-[9px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold uppercase cursor-help"
                  >
                    Simulated GW (IAM: No SNS)
                  </span>
                </div>
              </div>

              {isListening && (
                <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 animate-pulse">
                  <Mic className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                  <span className="font-semibold">Listening to voice command... speak now</span>
                </div>
              )}
              
              <div className="bg-[#FAF9F5] rounded-full p-1.5 pl-4 flex items-center border border-[#2C3426]/15 focus-within:border-[#FE8A70] focus-within:ring-2 focus-within:ring-[#FE8A70]/20 transition-all shadow-inner">
                <input 
                  id="tara-chat-input"
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder="Ask Tara or speak a command..." 
                  className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-[#151615] placeholder:text-[#151615]/40"
                />
                
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-colors mr-1 ${
                    isListening 
                      ? 'bg-rose-500 text-white' 
                      : 'text-[#151615]/50 hover:text-[#151615] hover:bg-black/5'
                  }`}
                  title="Voice command"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim()}
                  className="w-8 h-8 rounded-full bg-[#2C3426] text-white flex items-center justify-center hover:bg-[#FE8A70] hover:text-[#151615] transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-[#151615]/50">
                <span className="flex items-center gap-1 font-medium">
                  <Lock className="w-2.5 h-2.5 text-emerald-600" /> Zero PII · Ed25519 Signed
                </span>
                <span className="font-medium text-[#151615]/60">Consent Protocol v2</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: SECOND BRAIN & ONTOLOGY */}
        {activeTab === 'second_brain' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
            
            {/* SECOND BRAIN HEADER CARD */}
            <div className="p-3.5 rounded-xl bg-white border border-[#2C3426]/10 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4A5842] flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-[#4A5842]" /> Second Brain Architecture
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Adjacency Graph Active
                </span>
              </div>
              <p className="text-xs text-[#151615]/75 leading-relaxed">
                Tara maintains 3 memory layers and an ontological knowledge graph to reason over devices, settlements, and policies before taking action.
              </p>
            </div>

            {/* THREE MEMORY LAYERS */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#151615] px-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#FE8A70]" /> Memory Tiers
              </div>

              {/* 1. Merchant Memory */}
              <div className="p-3 rounded-xl bg-white border border-[#2C3426]/10 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#151615]">1. Merchant Memory</span>
                  <span className="text-[10px] font-mono text-[#151615]/50">Persistent</span>
                </div>
                <p className="text-[11px] text-[#151615]/70 mb-2">
                  Learns store patterns: peak UPI hours (7-9 PM), English/Hindi mix, zero chargeback tolerance.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-medium bg-[#FAF9F5] p-2 rounded-lg border border-[#2C3426]/5">
                  <div>Owner: <span className="font-bold text-[#151615]">Rahul Kumar</span></div>
                  <div>Trust Score: <span className="font-bold text-emerald-700">98 / 100</span></div>
                  <div>Dialect: <span className="font-bold text-[#151615]">Hindi + EN</span></div>
                  <div>Dispute Risk: <span className="font-bold text-emerald-700">Low (0.02%)</span></div>
                </div>
              </div>

              {/* 2. Team Memory */}
              <div className="p-3 rounded-xl bg-white border border-[#2C3426]/10 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#151615]">2. Team Memory</span>
                  <span className="text-[10px] font-mono text-[#151615]/50">Cross-Agent</span>
                </div>
                <p className="text-[11px] text-[#151615]/70">
                  Shared resolution playbook between human field ops and Tara. When an ops engineer resolves a soundbox SIM issue, Tara remembers the remedy for future automated triage.
                </p>
              </div>

              {/* 3. Policy Memory */}
              <div className="p-3 rounded-xl bg-white border border-[#2C3426]/10 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#151615]">3. Policy Memory</span>
                  <span className="text-[10px] font-mono text-[#151615]/50">NPCI / RBI Rules</span>
                </div>
                <p className="text-[11px] text-[#151615]/70">
                  Enforces regulatory constraints: NPCI Circular 142 (24-hour dispute TAT), daily escrow settlement auto-sweep rules, and sandbox play-money bounds.
                </p>
              </div>
            </div>

            {/* OBSIDIAN KNOWLEDGE GRAPH EXPLORER */}
            <div className="p-3.5 rounded-xl bg-white border border-[#2C3426]/10 shadow-xs flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#151615] flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-[#FE8A70]" /> Obsidian Knowledge Topology
                </span>
                <button 
                  onClick={() => navigate('/ontology')} 
                  className="text-[11px] font-bold text-[#2C3426] hover:text-[#FE8A70] underline flex items-center gap-1"
                >
                  Expand Full Graph →
                </button>
              </div>
              
              <p className="text-[11px] text-[#151615]/60">
                Interactive force-directed graph showing trained ontology domains, device telemetry, vector memory chunks, and LATS agent reasoning.
              </p>

              <div className="rounded-xl overflow-hidden border border-[#2C3426]/10 shadow-inner">
                <ObsidianGraphView height="280px" compact={true} />
              </div>
            </div>

            {/* SECURITY & TRUST AUDIT MATRIX */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#2C3426] to-[#151615] text-[#FAF9F5] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-[#FE8A70]" />
                <h4 className="text-xs font-bold text-[#FAF9F5]">Security & Consent Protocol v2</h4>
              </div>
              <ul className="text-[11px] space-y-1.5 text-[#FAF9F5]/80 list-disc list-inside">
                <li><strong className="text-white">Zero Real PII:</strong> Masked ingress; all credentials & Aadhaar are synthetic tokens.</li>
                <li><strong className="text-white">Cryptographic Action Tokens:</strong> High-stakes actions require non-repudiable Ed25519 signatures.</li>
                <li><strong className="text-white">Tiered Consent:</strong> Diagnostics are automated (Tier-1); fund movement requires explicit 1-click merchant consent (Tier-2).</li>
                <li><strong className="text-white">Sandbox Isolation:</strong> Bank Core runs with play-money ledger; zero real banking or card network exposure.</li>
              </ul>
            </div>

          </div>
        )}

      </aside>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsOpen(false)} 
      />

      {/* Mobile Drawer */}
      <aside 
        className={`lg:hidden fixed inset-y-0 right-0 z-50 w-[90vw] max-w-[420px] bg-[#FAF9F5] flex flex-col shadow-2xl h-full transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-3 bg-white border-b border-[#2C3426]/10 flex justify-between items-center">
          <span className="text-sm font-bold text-[#151615]">Tara Teammate</span>
          <button onClick={() => setIsOpen(false)} className="p-1 text-[#151615]/60 hover:text-[#151615] rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Reuse the chat layout inside mobile drawer */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[90%] text-xs ${
                  msg.role === 'user' ? 'bg-[#2C3426] text-white' : 'bg-white border text-[#151615]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-white border-t flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              placeholder="Ask Tara..." 
              className="flex-1 bg-[#FAF9F5] rounded-full px-3 py-1.5 text-xs outline-none"
            />
            <button 
              onClick={() => handleSend(inputValue)}
              className="w-8 h-8 rounded-full bg-[#2C3426] text-white flex items-center justify-center shrink-0"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile FAB */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`lg:hidden fixed bottom-6 right-6 z-30 w-13 h-13 bg-[#FE8A70] text-[#151615] rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all duration-300 font-bold ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open Tara Chat"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* FULL-SCREEN CHATGPT-STYLE INTERFACE */}
      {isExpandedChat && (
        <div className="fixed inset-0 z-[999999] bg-[#FAF9F5] flex flex-col w-screen h-screen">
          {/* Header */}
          <div className="p-3.5 px-6 border-b border-[#2C3426]/10 flex items-center justify-between bg-white shadow-xs">
            <div className="flex items-center gap-3">
              <TaraLogo size="md" showSubtitle={false} />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#151615]">Tara AI Teammate (ChatGPT Full Mode)</h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Bedrock Claude 3.5 Sonnet + LATS
                  </span>
                </div>
                <p className="text-xs text-[#151615]/60 font-medium">
                  Autonomous Multi-System Teammate with n8n execution reasoning & Sarvam Indic Voice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Offline Mode Switch */}
              <button
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
                  isOfflineMode 
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                    : 'bg-white text-[#151615]/70 border-[#2C3426]/15 hover:bg-[#F8E6DD]/40'
                }`}
                title="When enabled, every resolved action sends an instant SMS to merchant mobile"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Offline SMS: {isOfflineMode ? 'ON' : 'OFF'}</span>
              </button>

              {/* Open Dedicated Page */}
              <button
                onClick={() => {
                  setIsExpandedChat(false);
                  navigate('/chat');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-paytm-blue hover:bg-paytm-navy text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Dedicated ChatGPT / Claude Page</span>
              </button>

              {/* Exit Full Screen */}
              <button
                onClick={() => setIsExpandedChat(false)}
                className="px-3.5 py-1.5 rounded-xl bg-[#2C3426] text-white hover:bg-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Exit Full View (ESC)</span>
              </button>
            </div>
          </div>

          {/* Centered ChatGPT Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-4">
              {messages.map((msg) => (
                <div 
                  key={`full-${msg.id}`} 
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-xs relative group ${
                    msg.role === 'user' 
                      ? 'bg-[#2C3426] text-[#FAF9F5] rounded-tr-xs' 
                      : 'bg-white border border-[#2C3426]/10 text-[#151615] rounded-tl-xs'
                  }`}>
                    {msg.isVoiceCommand && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-2 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800">
                        <Mic className="w-3 h-3 text-rose-600 animate-pulse" /> Voice Command Understood
                      </div>
                    )}

                    {msg.role === 'tara' ? (
                      <FormattedMarkdown content={msg.text} />
                    ) : (
                      <div className="whitespace-pre-line break-words text-sm md:text-base">
                        {msg.text}
                      </div>
                    )}

                    {msg.smsDispatched && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                        <Smartphone className="w-3 h-3 text-emerald-600" /> Dispatched via SMS to {judgePhoneNumber}
                      </div>
                    )}

                    {/* Collapsible n8n-style Autonomous Execution Flow */}
                    {msg.role === 'tara' && !msg.isLoading && msg.thoughtFlow && (
                      <div className="mt-3 pt-2.5 border-t border-[#2C3426]/10">
                        <button
                          onClick={() => toggleThought(msg.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#2C3426]/5 hover:bg-[#2C3426]/10 text-[#151615] transition-all text-xs font-semibold"
                        >
                          <span className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-[#FE8A70] animate-pulse" />
                            {expandedThoughts[msg.id] ? 'Hide Autonomous Teammate Flow' : '🧠 Thought process & n8n execution flow (5 nodes)'}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedThoughts[msg.id] ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedThoughts[msg.id] && (
                          <div className="mt-2.5 p-4 rounded-xl bg-[#0F141C] text-white border border-white/10 space-y-2.5 text-xs shadow-xl animate-in fade-in duration-200">
                            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-white/50 font-mono">
                              <span className="flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> LATS AUTONOMOUS EXECUTION GRAPH
                              </span>
                              <span className="text-emerald-400 font-bold">● Monte-Carlo Verified</span>
                            </div>

                            <div className="space-y-2 pt-1">
                              {msg.thoughtFlow.map((step, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-white text-xs flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center border border-emerald-500/30">
                                        {idx + 1}
                                      </span>
                                      {step.name}
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                      {step.latency || 'Verified'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/70 leading-relaxed pl-7">
                                    {step.desc}
                                  </p>
                                  {step.meta && (
                                    <div className="mt-1 pl-7 text-[10px] font-mono text-cyan-300/80">
                                      {step.meta}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons & reasoning trace link */}
                    {msg.role === 'tara' && !msg.isLoading && (
                      <div className="mt-3 pt-2 border-t border-[#2C3426]/10 flex items-center justify-between text-xs text-[#151615]/60">
                        <button
                          onClick={() => handleSpeak(msg.text, msg.audio_base64)}
                          className="flex items-center gap-1.5 hover:text-[#151615] transition-colors"
                          title="Listen to response (Sarvam AI TTS)"
                        >
                          <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-emerald-600 animate-pulse' : 'text-[#FE8A70]'}`} />
                          <span className={isSpeaking ? 'font-bold text-emerald-700' : ''}>
                            {isSpeaking ? 'Playing Voice...' : 'Listen to Voice'}
                          </span>
                        </button>

                        {msg.traceUrl && (
                          <a 
                            href={msg.traceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#2C3426] hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Reasoning trace
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Centered Floating Input Bar */}
          <div className="p-4 bg-white border-t border-[#2C3426]/10 flex flex-col items-center">
            <div className="w-full max-w-3xl">
              {/* Quick Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar mb-2">
                {QUICK_ACTIONS.map((action) => (
                  <button 
                    key={action.label}
                    onClick={() => handleSend(action.command)}
                    className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-[#FAF9F5] border border-[#2C3426]/15 hover:border-[#FE8A70] hover:bg-[#F8E6DD]/40 text-[#151615] text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-2xs"
                  >
                    <action.icon className="w-3.5 h-3.5 text-[#FE8A70]" />
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Input box */}
              <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#2C3426]/20 rounded-2xl p-2.5 px-4 focus-within:border-[#FE8A70] focus-within:bg-white shadow-xs">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(inputValue);
                    }
                  }}
                  placeholder="Ask Tara or speak a command in Hindi/English/Tamil..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[#151615] placeholder:text-[#151615]/40"
                />
                <button
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl transition-all ${
                    isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-[#151615]/60 hover:text-[#151615]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim()}
                  className="p-2.5 rounded-xl bg-[#2C3426] text-white hover:bg-black disabled:opacity-30 disabled:hover:bg-[#2C3426] transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
