import React, { useState } from 'react';
import { Menu, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Activity, Cpu } from 'lucide-react';
import { Drawer } from '../../design-system/Drawer';
import { Avatar } from '../../design-system/Avatar';
import { EvidenceRow } from '../../design-system/EvidenceRow';
import './WelcomeHero.css';

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr';

interface WelcomeHeroProps {
  onGetStarted: () => void;
  currentLang?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

interface ContentTranslation {
  cornerIntro: string;
  cornerName: string;
  isIndic: boolean;
  headlineLines: [string, string, string];
  lede: string;
  ctaText: string;
  facts: [string, string];
  card1: {
    title: string;
    amount: string;
    chip: string;
    action: string;
  };
  card2: {
    items: [string, string, string];
    action: string;
  };
  card3: {
    title: string;
    subtitle: string;
  };
  drawer: {
    title: string;
    subtitle: string;
    signalLabel: string;
    signalValue: string;
    actionLabel: string;
    actionValue: string;
    ontologyLabel: string;
    ontologyValue: string;
    policyLabel: string;
    policyValue: string;
    riskLabel: string;
    riskValue: string;
    outcomeTitle: string;
    outcomeDesc: string;
  };
}

const TRANSLATIONS: Record<SupportedLanguage, ContentTranslation> = {
  en: {
    cornerIntro: "Hi, I'm",
    cornerName: 'Tara.',
    isIndic: false,
    headlineLines: ["Your shop's", 'problems, handled', 'before you ask'],
    lede: 'Tara watches your soundbox and settlements, fixes what she can, and asks you only when she needs you.',
    ctaText: 'Get started',
    facts: [
      'Autonomous device recovery & instant TAT tracking',
      'Multilingual Indic voice & photo diagnostics',
    ],
    card1: {
      title: "Today's settlement",
      amount: '₹4,280',
      chip: 'Settled',
      action: 'View detail',
    },
    card2: {
      items: [
        'Soundbox back online',
        'Settlement difference explained',
        'Compensation proposed, waiting for ops',
      ],
      action: 'See why',
    },
    card3: {
      title: 'Tara Teammate Active',
      subtitle: 'Shop QR & Audio paired',
    },
    drawer: {
      title: 'Why did Tara do this?',
      subtitle: 'Case #DEMO-701 · Automated Telemetry Healing',
      signalLabel: 'Signal Triggered',
      signalValue: 'Soundbox MQTT ping silent > 15m (Battery 84%)',
      actionLabel: 'Autonomous Action',
      actionValue: 'Remote cellular soft-reboot packet dispatched',
      ontologyLabel: 'Ontology Graph Path',
      ontologyValue: 'Device(SB-204) → BelongsTo(Shop-901) → CellularFailover',
      policyLabel: 'Policy Citation',
      policyValue: 'NPCI Soundbox Operational Guidelines §4.2',
      riskLabel: 'Autonomy Level',
      riskValue: 'Tier 1 (Safe autonomous self-healing, zero ops required)',
      outcomeTitle: 'Merchant Impact: Zero',
      outcomeDesc: 'The device restored in 42 seconds before peak evening hours. No physical visit needed.',
    },
  },
  hi: {
    cornerIntro: 'नमस्ते, मैं हूँ',
    cornerName: 'तारा।',
    isIndic: true,
    headlineLines: ['आपकी दुकान की', 'समस्याएं हल,', 'पूछने से पहले'],
    lede: 'तारा आपके साउंडबॉक्स और सेटलमेंट पर नज़र रखती है, जो संभव हो उसे खुद ठीक करती है, और ज़रूरत पड़ने पर ही आपसे पूछती है।',
    ctaText: 'शुरू करें',
    facts: [
      'स्वचालित डिवाइस रिकवरी व तत्काल समाधान',
      'भारतीय भाषाओं में आवाज़ व फ़ोटो सहायता',
    ],
    card1: {
      title: 'आज का सेटलमेंट',
      amount: '₹4,280',
      chip: 'सफल',
      action: 'विवरण देखें',
    },
    card2: {
      items: [
        'साउंडबॉक्स पुनः ऑनलाइन हुआ',
        'सेटलमेंट अंतर स्पष्ट किया गया',
        'मुआवज़ा प्रस्तावित, ऑप्स की प्रतीक्षा',
      ],
      action: 'कारण जानें',
    },
    card3: {
      title: 'तारा सक्रिय सहयोगी',
      subtitle: 'दुकान क्यूआर व ऑडियो लिंक',
    },
    drawer: {
      title: 'तारा ने ऐसा क्यों किया?',
      subtitle: 'केस #DEMO-701 · स्वचालित निदान',
      signalLabel: 'सिग्नल अलर्ट',
      signalValue: 'साउंडबॉक्स पिंग शांत > 15 मिनट (बैटरी 84%)',
      actionLabel: 'स्वचालित कार्रवाई',
      actionValue: 'सेलुलर सॉफ्ट-रीबूट कमांड भेजी गई',
      ontologyLabel: 'ऑन्टोलॉजी पथ',
      ontologyValue: 'डिवाइस(SB-204) → दुकान(Shop-901) → सेलुलर बैकअप',
      policyLabel: 'नीति संदर्भ',
      policyValue: 'NPCI साउंडबॉक्स संचालन दिशानिर्देश §4.2',
      riskLabel: 'स्वायत्तता स्तर',
      riskValue: 'टियर 1 (सुरक्षित स्वचालित समाधान)',
      outcomeTitle: 'दुकानदार पर प्रभाव: शून्य',
      outcomeDesc: 'डिवाइस 42 सेकंड में स्वतः ठीक हो गया। कोई परेशानी नहीं हुई।',
    },
  },
  ta: {
    cornerIntro: 'வணக்கம், நான்',
    cornerName: 'தாரா.',
    isIndic: true,
    headlineLines: ['உங்கள் கடையின்', 'சிக்கல்கள் தீர்வு,', 'கேட்கும் முன்பே'],
    lede: 'தாரா உங்கள் சவுண்ட்பாக்ஸ் மற்றும் செட்டில்மென்ட்டைக் கண்காணிக்கிறது, முடிந்ததைச் சரிசெய்கிறது, தேவைப்படும்போது மட்டுமே உங்களிடம் கேட்கிறது.',
    ctaText: 'தொடங்கவும்',
    facts: [
      'தானியங்கி சாதன மீட்டெடுப்பு மற்றும் விரைவுத் தீர்வு',
      'இந்திய குரல் மற்றும் புகைப்பட கண்டறிதல்',
    ],
    card1: {
      title: 'இன்றைய செட்டில்மென்ட்',
      amount: '₹4,280',
      chip: 'செட்டில் ஆனது',
      action: 'விவரம் பார்க்க',
    },
    card2: {
      items: [
        'சவுண்ட்பாக்ஸ் மீண்டும் ஆன்லைனில்',
        'செட்டில்மென்ட் வேறுபாடு விளக்கம்',
        'இழப்பீடு பரிந்துரைக்கப்பட்டது',
      ],
      action: 'காரணம் பார்க்க',
    },
    card3: {
      title: 'தாரா நேரடி தோழமை',
      subtitle: 'கடை க்யூஆர் & ஒலி இணைப்பு',
    },
    drawer: {
      title: 'தாரா இதை ஏன் செய்தது?',
      subtitle: 'வழக்கு #DEMO-701 · தானியங்கி மீட்டெடுப்பு',
      signalLabel: 'சிக்னல் கண்டறிதல்',
      signalValue: 'சவுண்ட்பாக்ஸ் பிங் > 15 நிமிடம் இல்லை',
      actionLabel: 'தானியங்கி செயல்',
      actionValue: 'செல்லுலார் ரீபூட் கட்டளை அனுப்பப்பட்டது',
      ontologyLabel: 'அமைப்பு வரைபடம்',
      ontologyValue: 'சாதனம்(SB-204) → கடை(Shop-901)',
      policyLabel: 'வழிகாட்டுதல்',
      policyValue: 'NPCI சவுண்ட்பாக்ஸ் விதிமுறைகள் §4.2',
      riskLabel: 'தன்னாட்சி நிலை',
      riskValue: 'நிலை 1 (பாதுகாப்பான தானியங்கி தீர்வு)',
      outcomeTitle: 'வணிகர் சிரமம்: ஏதுமில்லை',
      outcomeDesc: '42 வினாடிகளில் சாதனம் இயல்பு நிலைக்குத் திரும்பியது.',
    },
  },
  te: {
    cornerIntro: 'నమస్కారం, నేను',
    cornerName: 'తార.',
    isIndic: true,
    headlineLines: ['మీ దుకాణ', 'సమస్యల పరిష్కారం,', 'అడగకముందే'],
    lede: 'తార మీ సౌండ్‌బాక్స్ మరియు సెటిల్‌మెంట్లను పర్యవేక్షిస్తుంది, సాధ్యమైనంతవరకు స్వయంగా పరిష్కరిస్తుంది.',
    ctaText: 'ప్రారంభించండి',
    facts: [
      'ఆటోమేటిక్ డివైస్ రికవరీ & తక్షణ పరిష్కారం',
      'భారతీయ భాషల్లో వాయిస్ & ఫోటో సపోర్ట్',
    ],
    card1: {
      title: 'నేటి సెటిల్మెంట్',
      amount: '₹4,280',
      chip: 'జమ అయింది',
      action: 'వివరాలు చూడండి',
    },
    card2: {
      items: [
        'సౌండ్‌బాక్స్ తిరిగి ఆన్‌లైన్‌లోకి వచ్చింది',
        'సెటిల్‌మెంట్ వ్యత్యాసం వివరించబడింది',
        'పరిహారం ప్రతిపాదించబడింది',
      ],
      action: 'కారణం తెలుసుకోండి',
    },
    card3: {
      title: 'తార సహచరి సక్రియం',
      subtitle: 'దుకాణ QR మరియు ఆడియో',
    },
    drawer: {
      title: 'తార ఈ చర్య ఎందుకు తీసుకుంది?',
      subtitle: 'కేసు #DEMO-701 · ఆటోమేటెడ్ రిపేర్',
      signalLabel: 'సిగ్నల్ హెచ్చరిక',
      signalValue: 'సౌండ్‌బాక్స్ పింగ్ > 15 నిమిషాలు రాలేదు',
      actionLabel: 'తీసుకున్న చర్య',
      actionValue: 'రిమోట్ సెల్యులార్ రీబూట్ పంపబడింది',
      ontologyLabel: 'జ్ఞాన గ్రాఫ్',
      ontologyValue: 'డివైస్(SB-204) → దుకాణం(Shop-901)',
      policyLabel: 'నిబంధనావళి',
      policyValue: 'NPCI మార్గదర్శకాలు §4.2',
      riskLabel: 'అటానమీ స్థాయి',
      riskValue: 'టైర్ 1 (పూర్తిగా సురక్షిత స్వయంచాలక పరిష్కారం)',
      outcomeTitle: 'వ్యాపారికి ఇబ్బంది: సున్నా',
      outcomeDesc: '42 సెకన్లలో సమస్య పరిష్కరించబడింది.',
    },
  },
  bn: {
    cornerIntro: 'নমস্কার, আমি',
    cornerName: 'তারা।',
    isIndic: true,
    headlineLines: ['আপনার দোকানের', 'সমস্যার সমাধান,', 'জানানোর আগেই'],
    lede: 'তারা আপনার সাউন্ডবক্স এবং সেটেলমেন্ট পর্যবেক্ষণ করে, নিজে ঠিক করতে পারলে করে এবং দরকার হলেই আপনাকে জানায়।',
    ctaText: 'শুরু করুন',
    facts: [
      'স্বয়ংক্রিয় ডিভাইস রিকভারি ও দ্রুত সমাধান',
      'ভারতীয় ভাষায় ভয়েস ও ছবি সহায়তা',
    ],
    card1: {
      title: 'আজকের সেটেলমেন্ট',
      amount: '₹4,280',
      chip: 'সম্পন্ন',
      action: 'বিবরণ দেখুন',
    },
    card2: {
      items: [
        'সাউন্ডবক্স আবার অনলাইনে',
        'সেটেলমেন্টের অমিল ব্যাখ্যা করা হয়েছে',
        'ক্ষতিপূরণ প্রস্তাবিত, অপস অনুমোদনের অপেক্ষায়',
      ],
      action: 'কারণ জানুন',
    },
    card3: {
      title: 'তারা সহকারী সক্রিয়',
      subtitle: 'দোকান কিউআর ও সাউন্ড কানেক্টেড',
    },
    drawer: {
      title: 'তারা এই পদক্ষেপ কেন নিল?',
      subtitle: 'কেস #DEMO-701 · স্বয়ংক্রিয় পর্যবেক্ষণ',
      signalLabel: 'সিগন্যাল সতর্কতা',
      signalValue: 'সাউন্ডবক্স পিং নেই > ১৫ মিনিট (ব্যাটারি ৮৪%)',
      actionLabel: 'গৃহীত ব্যবস্থা',
      actionValue: 'সেলুলার সফ্ট-রিবুট কমান্ড পাঠানো হয়েছে',
      ontologyLabel: 'অন্টোলজি পাথ',
      ontologyValue: 'ডিভাইস(SB-204) → দোকান(Shop-901)',
      policyLabel: 'নিয়মাবলি',
      policyValue: 'NPCI নির্দেশিকা §৪.২',
      riskLabel: 'স্বায়ত্তশাসন স্তর',
      riskValue: 'টায়ার ১ (সম্পূর্ণ নিরাপদ স্বয়ংক্রিয় সমাধান)',
      outcomeTitle: 'দোকানদারের সময় বাঁচল',
      outcomeDesc: 'মাত্র ৪২ সেকেন্ডে ডিভাইস নিজে থেকেই পুনরায় চালু হয়েছে।',
    },
  },
  mr: {
    cornerIntro: 'नमस्कार, मी आहे',
    cornerName: 'तारा.',
    isIndic: true,
    headlineLines: ['तुमच्या दुकानातील', 'अडचणींचे निवारण,', 'विचारण्यापूर्वीच'],
    lede: 'तारा तुमच्या साउंडबॉक्स आणि सेटलमेंटवर लक्ष ठेवते, शक्य ते स्वतः सोडवते आणि गरज असेल तेव्हाच तुम्हाला विचारते.',
    ctaText: 'सुरुवात करा',
    facts: [
      'स्वयंचलित डिव्हाइस रिकव्हरी आणि त्वरित निवारण',
      'भारतीय भाषांमध्ये व्हॉइस आणि फोटो सपोर्ट',
    ],
    card1: {
      title: 'आजचे सेटलमेंट',
      amount: '₹4,280',
      chip: 'जमा झाले',
      action: 'तपशील पाहा',
    },
    card2: {
      items: [
        'साउंडबॉक्स पुन्हा ऑनलाइन झाला',
        'सेटलमेंटमधील फरक स्पष्ट केला',
        'भरपाई प्रस्तावित, ऑप्सच्या प्रतीक्षेत',
      ],
      action: 'कारण पाहा',
    },
    card3: {
      title: 'तारा सक्रिय जोडीदार',
      subtitle: 'दुकान क्यूआर व ऑडिओ जोडले',
    },
    drawer: {
      title: 'ताराने ही कृती का केली?',
      subtitle: 'प्रकरण #DEMO-701 · स्वयंचलित उपचार',
      signalLabel: 'सिग्नल अलर्ट',
      signalValue: 'साउंडबॉक्स पिंग बंद > १५ मिनिटे (बॅटरी ८४%)',
      actionLabel: 'झालेली कृती',
      actionValue: 'रिमोट सेल्युलर सॉफ्ट-रीबूट पाठवले',
      ontologyLabel: 'ऑन्टॉलॉजी मार्ग',
      ontologyValue: 'डिव्हाइस(SB-204) → दुकान(Shop-901)',
      policyLabel: 'धोरण संदर्भ',
      policyValue: 'NPCI मार्गदर्शक तत्त्वे §४.२',
      riskLabel: 'स्वायत्तता स्तर',
      riskValue: 'टियर १ (सुरक्षित स्वयंचलित दुरुस्ती)',
      outcomeTitle: 'दुकानदारावर कोणताही भार नाही',
      outcomeDesc: 'डिव्हाइस ४२ सेकंदात पुन्हा कार्यरत झाले. प्रत्यक्ष फेऱ्यांची गरज नाही.',
    },
  },
};

const LANGUAGES: { code: SupportedLanguage; label: string; scriptName: string }[] = [
  { code: 'en', label: 'EN', scriptName: 'English' },
  { code: 'hi', label: 'HI', scriptName: 'हिंदी' },
  { code: 'ta', label: 'TA', scriptName: 'தமிழ்' },
  { code: 'te', label: 'TE', scriptName: 'తెలుగు' },
  { code: 'bn', label: 'BN', scriptName: 'বাংলা' },
  { code: 'mr', label: 'MR', scriptName: 'मराठी' },
];

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  onGetStarted,
  currentLang = 'en',
  onLanguageChange,
}) => {
  const [lang, setLang] = useState<SupportedLanguage>(currentLang);
  const [isExplainDrawerOpen, setIsExplainDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleLanguageSelect = (newLang: SupportedLanguage) => {
    setLang(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  return (
    <main className="tara-welcome-page" aria-label="Welcome to Tara">
      <div className="tara-welcome-container">
        {/* ==================================================================
            LEFT PANEL: ~46% desktop width, rounded 32px
            IMG-1 still + looping ambient video + dust specks + 3 floating cards
            Stacks below on mobile
           ================================================================== */}
        <section className="tara-welcome-left" aria-label="Tara preview panel">
          {/* Background Media Layer: Coastal Cliffs & Wildflowers */}
          <div className="tara-welcome-media-wrap">
            <img 
              src="/assets/optimized/hero-poster.webp" 
              alt="Golden-hour clifftop meadow with wildflowers above the sea" 
              className="photo-fallback"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/assets/optimized/hero-poster.webp"
              className="loop-video"
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
            >
              <source src="/assets/optimized/coastal-cliffs.mp4" type="video/mp4" />
            </video>
            <div className="tara-welcome-media-overlay" aria-hidden="true" />
            <div className="tara-welcome-dust" aria-hidden="true" />
          </div>

          {/* Interactive foreground layer */}
          <div className="tara-welcome-left-content">
            {/* Top Corner Greeting */}
            <div className="tara-welcome-corner-text">
              <div className="tara-welcome-corner-intro">{t.cornerIntro}</div>
              <div className="tara-welcome-corner-name">
                <span
                  className={
                    t.isIndic
                      ? 'tara-welcome-accent-indic'
                      : 'tara-welcome-accent-latin'
                  }
                >
                  {t.cornerName}
                </span>
              </div>
            </div>

            {/* Floating Cards Stack (All labelled SAMPLE / DEMO) */}
            <div className="tara-welcome-cards-stack">
              {/* Card 1: Warm Sunset Frosted Glass settlement card */}
              <div className="tara-card-coral tara-anim-card-1">
                <div className="tara-card-header">
                  <span className="tara-card-title">
                    {t.card1.title}
                  </span>
                  <span className="tara-card-sample-badge" aria-label="Sample demonstration data">
                    SAMPLE
                  </span>
                </div>
                <div className="tara-card-settlement-body">
                  <div className="tara-card-amount">
                    {t.card1.amount}
                  </div>
                  <span className="tara-card-settled-chip">
                    <span className="tara-card-chip-icon">✓</span> {t.card1.chip}
                  </span>
                </div>
                <div className="tara-card-link-action" role="button" tabIndex={0}>
                  <span>{t.card1.action}</span>
                  <span className="tara-card-link-arrow">→</span>
                </div>
              </div>

              {/* Card 2: Crystalline Frosted Glass Explanation Card */}
              <div className="tara-card-glass tara-anim-card-2">
                <div className="tara-card-header">
                  <span className="tara-card-section-label">
                    Recent Work
                  </span>
                  <span className="tara-card-sample-badge" aria-label="Sample demonstration data">
                    SAMPLE
                  </span>
                </div>
                <ul className="tara-card-work-list">
                  {t.card2.items.map((item, idx) => (
                    <li key={idx} className="tara-card-work-item">
                      <CheckCircle2 size={15} className="tara-card-check-icon" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setIsExplainDrawerOpen(true)}
                  className="tara-card-explain-btn"
                  aria-haspopup="dialog"
                >
                  <span>{t.card2.action}</span>
                  <ChevronRight size={14} className="tara-card-btn-chevron" aria-hidden="true" />
                </button>
              </div>

              {/* Card 3: Obsidian Coastal Glass Card with Mascot Avatar */}
              <div className="tara-card-dark tara-anim-card-3">
                <div className="tara-card-dark-left">
                  <div className="tara-card-avatar-wrap">
                    <Avatar size="sm" state="idle" />
                    <span className="tara-card-online-dot" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="tara-card-dark-title">
                      {t.card3.title}
                    </div>
                    <div className="tara-card-dark-subtitle">
                      {t.card3.subtitle}
                    </div>
                  </div>
                </div>
                <span className="tara-card-sample-badge tara-card-badge-dark" aria-label="Demo status">
                  DEMO
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            RIGHT COLUMN: ~54% desktop width
            Header (Menu, Tara wordmark, Language switcher)
            3-line headline, lede, centered primary CTA with arrow, 2 facts
            Stacks above photo panel on mobile
           ================================================================== */}
        <section className="tara-welcome-right" aria-label="Welcome details and entry">
          {/* Header */}
          <header className="tara-welcome-header tara-anim-header">
            <button
              type="button"
              className="tara-welcome-menu-btn"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} aria-hidden="true" />
            </button>

            <div className="tara-welcome-brand">
              <span>Tara</span>
              <span className="tara-welcome-brand-dot" aria-hidden="true" />
            </div>

            {/* Language Switcher with native scripts */}
            <nav className="tara-lang-switcher" aria-label="Choose language">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`tara-lang-btn ${lang === item.code ? 'active' : ''}`}
                  onClick={() => handleLanguageSelect(item.code)}
                  aria-pressed={lang === item.code}
                  title={item.scriptName}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </header>

          {/* Main Body */}
          <div className="tara-welcome-body">
            <h1 className="tara-welcome-headline">
              <span className="tara-welcome-headline-line tara-anim-line-1">
                {t.headlineLines[0]}
              </span>
              <span className="tara-welcome-headline-line tara-anim-line-2">
                {t.headlineLines[1]}
              </span>
              <span className={`tara-welcome-headline-line tara-anim-line-3 ${!t.isIndic ? 'tara-welcome-headline-serif' : ''}`}>
                {t.headlineLines[2]}
              </span>
            </h1>

            <p className="tara-welcome-lede tara-anim-lede">
              {t.lede}
            </p>

            {/* Centered CTA with Arrow */}
            <div className="tara-welcome-cta-wrap tara-anim-cta">
              <button
                type="button"
                className="tara-welcome-cta-btn"
                onClick={onGetStarted}
                id="tara-welcome-get-started-btn"
              >
                <span>{t.ctaText}</span>
                <span className="tara-welcome-cta-arrow" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </button>
            </div>
          </div>

          {/* Bottom 2 Truthful Facts */}
          <footer className="tara-welcome-facts">
            <div className="tara-welcome-fact-item">
              <Activity size={16} className="tara-welcome-fact-icon" aria-hidden="true" />
              <span>{t.facts[0]}</span>
            </div>
            <div className="tara-welcome-fact-item">
              <Cpu size={16} className="tara-welcome-fact-icon" aria-hidden="true" />
              <span>{t.facts[1]}</span>
            </div>
          </footer>
        </section>
      </div>

      {/* ==================================================================
          DEMO EXPLAINABILITY DRAWER ("Why did Tara do this?")
         ================================================================== */}
      <Drawer
        isOpen={isExplainDrawerOpen}
        onClose={() => setIsExplainDrawerOpen(false)}
        title={t.drawer.title}
        subtitle={t.drawer.subtitle}
        width="460px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Status alert banner */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--status-ok-bg)',
              border: '1px solid var(--status-ok-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <ShieldCheck size={20} color="#145A19" aria-hidden="true" />
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: '#145A19' }}>
                {t.drawer.outcomeTitle}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)', marginTop: '2px' }}>
                {t.drawer.outcomeDesc}
              </div>
            </div>
          </div>

          {/* Evidence rows */}
          <div style={{ backgroundColor: 'var(--color-panel-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-panel-border)', overflow: 'hidden' }}>
            <EvidenceRow label={t.drawer.signalLabel} value={t.drawer.signalValue} />
            <EvidenceRow label={t.drawer.actionLabel} value={t.drawer.actionValue} />
            <EvidenceRow label={t.drawer.ontologyLabel} value={t.drawer.ontologyValue} />
            <EvidenceRow label={t.drawer.policyLabel} value={t.drawer.policyValue} />
            <EvidenceRow label={t.drawer.riskLabel} value={t.drawer.riskValue} />
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)', lineHeight: 1.5 }}>
            <em>Sample demonstration case</em> showing how Tara autonomously restores devices and tracks SLA/TAT clocks before merchants notice disruptions.
          </div>
        </div>
      </Drawer>

      {/* Simple Information Menu Drawer */}
      <Drawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="Tara Merchant Companion"
        subtitle="Version 3.0 · Built for Indian Retailers"
        width="360px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)', margin: 0 }}>
            Tara acts as an autonomous store teammate that monitors soundboxes, settlements, disputes, and inventory finance.
          </p>
          <div style={{ borderTop: '1px solid var(--color-panel-border)', paddingTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-ink)', marginBottom: '8px' }}>
              Supported Languages
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    handleLanguageSelect(l.code);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    border: '1px solid var(--color-panel-border)',
                    backgroundColor: lang === l.code ? 'var(--color-ink)' : 'var(--color-panel-card)',
                    color: lang === l.code ? '#FFFFFF' : 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  {l.scriptName} ({l.label})
                </button>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </main>
  );
};
