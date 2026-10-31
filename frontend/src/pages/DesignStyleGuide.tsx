import React, { useState } from 'react';
import {
  Button,
  Card,
  GlassCard,
  Chip,
  StatusBadge,
  Timeline,
  EvidenceRow,
  Table,
  Input,
  OTPInput,
  Toast,
  Drawer,
  Skeleton,
  EmptyState,
  Avatar,
  ResponsiveMedia,
  type MascotState,
  type Column,
  type AssetId,
} from '../design-system';
import {
  ArrowRight,
  ShieldCheck,
  Search,
  Inbox,
} from 'lucide-react';

interface OpsCase {
  id: string;
  merchant: string;
  type: string;
  amount: string;
  tier: string;
  status: 'ok' | 'warning' | 'error' | 'pending-ops';
  statusLabel: string;
}

export const DesignStyleGuide: React.FC = () => {
  // Script / Language state
  const [currentLang, setCurrentLang] = useState<'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr'>('en');

  // Interactive component states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [toastList, setToastList] = useState<{ id: string; title: string; message: string; type: any }[]>([]);
  const [textZoomSimulated, setTextZoomSimulated] = useState(false);

  const sampleCases: OpsCase[] = [
    {
      id: 'CASE-8821',
      merchant: 'Sharma Provision Store',
      type: 'Soundbox Offline (7h)',
      amount: '₹0 (Diagnostic)',
      tier: 'Tier 1 Auto',
      status: 'ok',
      statusLabel: 'Auto-Triage Active',
    },
    {
      id: 'CASE-8822',
      merchant: 'Gupta Tea Stall',
      type: 'Settlement Deduction Diff',
      amount: '₹120.00',
      tier: 'Tier 2 Approval',
      status: 'pending-ops',
      statusLabel: 'Pending Ops Consent',
    },
    {
      id: 'CASE-8823',
      merchant: 'Apollo Medicos',
      type: 'TAT Reversal Risk (T+1)',
      amount: '₹1,500.00',
      tier: 'Tier 3 Escalate',
      status: 'warning',
      statusLabel: 'SLA Breach in 3h',
    },
    {
      id: 'CASE-8824',
      merchant: 'Annapurna Café',
      type: 'Hardware Battery Failure',
      amount: '₹0 (Replacement)',
      tier: 'Tier 2 Approval',
      status: 'error',
      statusLabel: 'Field Visit Required',
    },
  ];

  const opsColumns: Column<OpsCase>[] = [
    { key: 'id', header: 'Case ID', width: '110px' },
    { key: 'merchant', header: 'Merchant' },
    { key: 'type', header: 'Incident Type' },
    { key: 'amount', header: 'Amount' },
    {
      key: 'tier',
      header: 'Autonomy Tier',
      render: (r) => (
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-ink-soft)' }}>
          {r.tier}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} label={r.statusLabel} size="sm" />,
    },
  ];

  // Multilingual content map
  const scriptContent = {
    en: {
      name: 'English',
      headline: 'Your shop’s problems, handled before you ask',
      lede: 'Tara monitors soundbox telemetry, reconciles daily settlements, and resolves payment disputes autonomously.',
      fontClass: '',
      accentClass: 'accent-latin',
      accentText: 'Tara',
      cta: 'Get started',
    },
    hi: {
      name: 'हिन्दी (Hindi)',
      headline: 'आपकी दुकान की समस्याएं, पूछने से पहले हल',
      lede: 'तारा साउंडबॉक्स टेलीमेट्री की निगरानी करती है, दैनिक निपटान का मिलान करती है और विवादों को सुलझाती है।',
      fontClass: 'font-hindi',
      accentClass: 'accent-indic',
      accentText: 'तारा',
      cta: 'शुरू करें',
    },
    ta: {
      name: 'தமிழ் (Tamil)',
      headline: 'உங்கள் கடையின் பிரச்சனைகள், நீங்கள் கேட்பதற்கு முன்பே தீர்க்கப்படும்',
      lede: 'தாரா சவுண்ட்பாக்ஸ் டெலிமெட்ரியைக் கண்காணிக்கிறது, தினசரி தீர்வுகளை சரிசெய்கிறது மற்றும் தகராறுகளை தானாகவே தீர்க்கிறது.',
      fontClass: 'font-tamil',
      accentClass: 'accent-indic',
      accentText: 'தாரா',
      cta: 'தொடங்குங்கள்',
    },
    te: {
      name: 'తెలుగు (Telugu)',
      headline: 'మీ దుకాణం సమస్యలు, మీరు అడగకముందే పరిష్కరించబడతాయి',
      lede: 'తారా సౌండ్‌బాక్స్ టెలిమెట్రీని పర్యవేక్షిస్తుంది, రోజువారీ సెటిల్మెంట్లను పునరుద్దరిస్తుంది మరియు వివాదాలను స్వయంప్రతిపత్తితో పరిష్కరిస్తుంది.',
      fontClass: 'font-telugu',
      accentClass: 'accent-indic',
      accentText: 'తారా',
      cta: 'ప్రారంభించండి',
    },
    bn: {
      name: 'বাংলা (Bengali)',
      headline: 'আপনার দোকানের সমস্যা, আপনি চাওয়ার আগেই সমাধান',
      lede: 'তারা সাউন্ডবক্স টেলিমেট্রি পর্যবেক্ষণ করে, দৈনিক বন্দোবস্ত মেলায় এবং স্বায়ত্তশাসিতভাবে বিরোধ নিষ্পত্তি করে।',
      fontClass: 'font-bengali',
      accentClass: 'accent-indic',
      accentText: 'তারা',
      cta: 'শুরু করুন',
    },
    mr: {
      name: 'मराठी (Marathi)',
      headline: 'तुमच्या दुकानातील समस्या, विचारण्यापूर्वीच सोडवल्या',
      lede: 'तारा साउंडबॉक्स टेलीमेट्रीवर लक्ष ठेवते, दैनंदिन सेटलमेंट जुळवते आणि स्वायत्तपणे वाद सोडवते.',
      fontClass: 'font-marathi',
      accentClass: 'accent-indic',
      accentText: 'तारा',
      cta: 'सुरू करा',
    },
  };

  const activeScript = scriptContent[currentLang];

  const triggerToast = (type: any) => {
    const id = Date.now().toString();
    setToastList((prev) => [
      ...prev,
      {
        id,
        type,
        title: `${type.toUpperCase()} Notification`,
        message: 'Telemetry invariant check executed and recorded in audit log.',
      },
    ]);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-ground)',
        minHeight: '100vh',
        padding: 'clamp(0.75rem, 3vw, 2rem)',
        color: 'var(--color-ink)',
        fontSize: textZoomSimulated ? '125%' : '100%',
        transition: 'all var(--duration-normal) var(--ease-out)',
        boxSizing: 'border-box',
        width: '100%',
      }}
      className={activeScript.fontClass}
      lang={currentLang}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Style Guide Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-8)',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
            <Avatar size="lg" state={mascotState} showBadge />
            <div style={{ minWidth: 0, maxWidth: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                    fontWeight: 'var(--weight-bold)',
                    letterSpacing: '-0.02em',
                    wordBreak: 'break-word',
                  }}
                >
                  Tara Design System
                </h1>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-bold)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-coral)',
                    color: 'var(--color-ink)',
                  }}
                >
                  v3.0 Nuvo-Warm
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)' }}>
                Authoritative tokens, WCAG AA compliance (build-checked), Indian typography, & accessible components.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {/* Script Switcher */}
            {(['en', 'hi', 'ta', 'te', 'bn', 'mr'] as const).map((lang) => (
              <Chip
                key={lang}
                clickable
                active={currentLang === lang}
                onClick={() => setCurrentLang(lang)}
              >
                {lang.toUpperCase()}
              </Chip>
            ))}

            {/* Text Zoom Simulator Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTextZoomSimulated(!textZoomSimulated)}
            >
              {textZoomSimulated ? 'Reset Zoom (100%)' : 'Simulate Text Zoom (125%)'}
            </Button>
          </div>
        </header>

        {/* 1. Indian Script Typography Showcase */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <Card variant="panel" padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>
                  Script Focus: {activeScript.name} (No Italic in Indic — Weight + Warm Color Used)
                </span>
                <h2
                  style={{
                    fontSize: 'var(--text-hero)',
                    fontWeight: 'var(--weight-bold)',
                    lineHeight: 'var(--leading-tight)',
                    margin: 'var(--space-3) 0',
                    maxWidth: '850px',
                  }}
                >
                  {activeScript.headline}
                </h2>
                <p
                  style={{
                    fontSize: 'var(--text-lg)',
                    color: 'var(--color-ink-soft)',
                    lineHeight: 'var(--leading-relaxed)',
                    maxWidth: '720px',
                    margin: '0 0 var(--space-6) 0',
                  }}
                >
                  {activeScript.lede}
                </p>

                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button variant="primary" size="lg" icon={<ArrowRight size={18} />}>
                    {activeScript.cta}
                  </Button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)' }}>Accent rendering:</span>
                    <span className={activeScript.accentClass} style={{ fontSize: 'var(--text-xl)' }}>
                      {activeScript.accentText}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', width: 'auto', maxWidth: '100%' }}>
                <StatusBadge status="ok" label="WCAG AA Checked" />
                <StatusBadge status="info" label="Verified OFL 1.1 Fonts" />
                <StatusBadge status="pending-ops" label="Sample Data Protected" />
              </div>
            </div>
          </Card>
        </section>

        {/* 2. Color Palette & Built-in Contrast Gate */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
            1. Core Palette & Verified Ratios (WCAG 2.1 AA)
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', backgroundColor: '#FAF9F5', border: '1px solid var(--color-panel-border)' }}>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Warm White Panel</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)' }}>#FAF9F5</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: '#145A19', fontWeight: 'var(--weight-semibold)' }}>
                Ratio: 17.2:1 (Pass)
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', backgroundColor: '#F8E6DD', border: '1px solid rgba(21,22,21,0.08)' }}>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Ground Peach</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)' }}>#F8E6DD</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: '#145A19', fontWeight: 'var(--weight-semibold)' }}>
                Ratio: 15.0:1 (Pass)
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', backgroundColor: '#FA7F62', color: '#151615', border: '1px solid rgba(21,22,21,0.08)' }}>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Coral CTA</div>
              <div style={{ fontSize: 'var(--text-xs)' }}>#FA7F62</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
                Ink text: 7.15:1 (Pass)
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', backgroundColor: '#FE8A70', color: '#151615', border: '1px solid rgba(21,22,21,0.08)' }}>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Coral Card</div>
              <div style={{ fontSize: 'var(--text-xs)' }}>#FE8A70</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
                Ink text: 7.85:1 (Pass)
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', backgroundColor: '#2C3426', color: '#FAF9F5' }}>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Dark Card</div>
              <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8 }}>#2C3426</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: '#C8E6C9', fontWeight: 'var(--weight-semibold)' }}>
                White: 12.9:1 (Pass)
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', backgroundColor: '#EFF2E9', border: '1px solid var(--color-chip-border)' }}>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Chip Neutral</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)' }}>#EFF2E9</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: '#145A19', fontWeight: 'var(--weight-semibold)' }}>
                Ratio: 16.0:1 (Pass)
              </div>
            </div>
          </div>
        </section>

        {/* 3. Semantic Status Badges */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
            2. Semantic Status Colors (Always paired with Icon + Text)
          </h3>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusBadge status="ok" label="Soundbox Online" showPulse />
            <StatusBadge status="warning" label="Low Battery (12%)" />
            <StatusBadge status="error" label="Soundbox Offline" />
            <StatusBadge status="info" label="Verifying Telemetry" />
            <StatusBadge status="pending-ops" label="Pending Ops Approval" />
            <StatusBadge status="stale" label="Stale / Unknown (7h)" />
          </div>
        </section>

        {/* 4. Interactive Components Showcase */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
            3. Core Components (Buttons, Cards, Floating Stack, Chips)
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {/* Buttons Column */}
            <Card variant="panel" padding="md">
              <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                Button Variants
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="primary" loading>Loading</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="quiet">Quiet Action</Button>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
            </Card>

            {/* Floating Card Stack Preview */}
            <Card variant="panel" padding="md">
              <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                Cards & Sample Badge Enforcement
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Card variant="coral" isSample padding="sm">
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', opacity: 0.85 }}>Today's Settlement</div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', margin: '0.25rem 0' }}>₹14,850.00</div>
                  <Chip active>Settled at 06:00 AM</Chip>
                </Card>

                <GlassCard isSample padding="sm">
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-ink-soft)' }}>
                    Tara Autonomous Resolution
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginTop: '0.25rem' }}>
                    Soundbox Ping Recovered after Soft Reboot (Tier 1)
                  </div>
                </GlassCard>

                <Card variant="dark" isSample padding="sm">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', opacity: 0.75 }}>Security Guardrail</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>mTLS & KMS Verified</div>
                    </div>
                    <ShieldCheck size={24} style={{ color: '#FA7F62' }} />
                  </div>
                </Card>
              </div>
            </Card>

            {/* Mascot Avatar & States */}
            <Card variant="panel" padding="md">
              <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                Tara 2D Mascot Avatar States
              </h4>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                {(['idle', 'listening', 'thinking', 'working', 'needs-merchant'] as MascotState[]).map((st) => (
                  <Chip
                    key={st}
                    clickable
                    active={mascotState === st}
                    onClick={() => setMascotState(st)}
                  >
                    {st}
                  </Chip>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)', backgroundColor: 'var(--color-ground)', borderRadius: 'var(--radius-lg)', flexWrap: 'wrap' }}>
                <Avatar size="sm" state={mascotState} />
                <Avatar size="md" state={mascotState} />
                <Avatar size="lg" state={mascotState} showBadge />
                <Avatar size="xl" state={mascotState} showBadge />
              </div>
            </Card>
          </div>
        </section>

        {/* 5. Dense Ops Table & Evidence Row */}
        <section style={{ marginBottom: 'var(--space-10)', width: '100%', maxWidth: '100%', minWidth: 0 }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
            4. Operations Console Dense Table & Evidence Trace
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%', maxWidth: '100%', minWidth: 0 }}>
            <Table
              columns={opsColumns}
              data={sampleCases}
              dense
              caption="Live Ops Queue — Single Source of Truth"
              onRowClick={() => {
                setDrawerOpen(true);
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <EvidenceRow
                label="Policy Rule Checked"
                value="RBI/2019-20/67 DPSS.CO.PD No.629 (TAT Compensation)"
                sourceDoc="Circular Oct 2019"
                statusBadge={<StatusBadge status="ok" label="Compliant" size="sm" />}
                onSeeWhy={() => setDrawerOpen(true)}
              />
              <EvidenceRow
                label="Soundbox Telemetry"
                value="SB-4421 Battery 12% • Offline (last ping 7h ago)"
                hint="Derived state single source of truth"
                statusBadge={<StatusBadge status="error" label="Unhealthy" size="sm" />}
                onSeeWhy={() => setDrawerOpen(true)}
              />
            </div>
          </div>
        </section>

        {/* 6. Form Inputs & OTP Input */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
            5. Form Inputs, OTP Entry & Feedback
          </h3>
          <Card variant="panel" padding="lg">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
                gap: 'var(--space-6)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input
                  label="Registered Mobile Number"
                  placeholder="+91 98765 43210"
                  helperText="Demo test phone: +91 98765 43210 (Code: 123456)"
                  leftIcon={<Search size={16} />}
                />
                <Input
                  label="Merchant Shop Name"
                  defaultValue="Sharma Provision Store"
                  error={undefined}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center', justifyContent: 'center' }}>
                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-ink)', display: 'block', textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                    Enter 6-Digit OTP (U2 Demo Ready)
                  </label>
                  <OTPInput
                    length={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    onComplete={() => {
                      triggerToast('success');
                    }}
                  />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)', textAlign: 'center', marginTop: 'var(--space-2)' }}>
                    Current OTP: {otpValue || '------'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', justifyContent: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Trigger Live Toast</span>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button size="sm" variant="secondary" onClick={() => triggerToast('success')}>Success</Button>
                  <Button size="sm" variant="secondary" onClick={() => triggerToast('warning')}>Warning</Button>
                  <Button size="sm" variant="secondary" onClick={() => triggerToast('error')}>Error</Button>
                </div>
                <Button size="md" variant="primary" onClick={() => setDrawerOpen(true)}>
                  Open Explainability Drawer
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 7. Timeline & Skeletons */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
            6. Resolution Timeline & Loading Skeletons
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            <Card variant="panel" padding="md">
              <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                Autonomous Incident Timeline
              </h4>
              <Timeline
                items={[
                  {
                    id: '1',
                    time: '10:14 AM',
                    title: 'Soundbox Heartbeat Lost',
                    description: 'Device SB-4421 missed 3 consecutive keep-alive pings over GPRS.',
                    status: 'completed',
                    badge: <StatusBadge status="error" label="Offline" size="sm" />,
                  },
                  {
                    id: '2',
                    time: '10:15 AM',
                    title: 'Diagnostic Autonomous Triage',
                    description: 'Tara checked battery level (12%) and initiated APN soft reset command.',
                    status: 'completed',
                    badge: <StatusBadge status="info" label="Tier 1 Auto" size="sm" />,
                  },
                  {
                    id: '3',
                    time: '10:18 AM',
                    title: 'Awaiting Ops Approval for Dispatch',
                    description: 'Battery degraded; field technician replacement ticket created for consent.',
                    status: 'current',
                    badge: <StatusBadge status="pending-ops" label="Pending Ops" size="sm" />,
                  },
                ]}
              />
            </Card>

            <Card variant="panel" padding="md">
              <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                Skeletons & Empty State
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="85%" />
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Skeleton variant="circular" width="48px" height="48px" />
                  <div style={{ flex: 1 }}>
                    <Skeleton variant="text" width="90%" />
                    <Skeleton variant="text" width="50%" />
                  </div>
                </div>
              </div>

              <EmptyState
                icon={<Inbox size={24} />}
                title="No Pending Disputes"
                description="All merchant transactions are reconciled against the Core Mock ledger."
                action={<Button size="sm" variant="secondary">Refresh Ledger</Button>}
              />
            </Card>
          </div>
        </section>

        {/* 8. Asset Pipeline & Optimized Imagery (V2) */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>
                7. Asset Pipeline & Self-Hosted Responsive Imagery
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)' }}>
                AVIF & WebP multi-res (400w, 800w, 1200w), zero CLS aspect reservation, & reduced-motion video loop.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <StatusBadge status="ok" label="Self-Hosted Only" size="sm" />
              <StatusBadge status="info" label="Zero CLS" size="sm" />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {/* Hero Image + Video Loop Card */}
            <Card variant="panel" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-ink-soft)' }}>
                  IMG-1 • Welcome Hero (AVIF + 4s MP4/WebM Loop)
                </span>
                <Chip active>Hero Priority Preloaded</Chip>
              </div>

              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', maxHeight: '360px' }}>
                <ResponsiveMedia
                  assetId="IMG-1"
                  withVideo
                  priority
                  aspectRatio="2/3"
                  alt="Neighborhood kirana shop counter in golden-hour light"
                />
              </div>

              <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)' }}>
                  Measured: AVIF 800w (11 KB) • MP4 (152 KB)
                </span>
                <StatusBadge status="ok" label="4s Seamless Loop" size="sm" />
              </div>
            </Card>

            {/* Other Persona & Onboarding Assets */}
            <Card variant="panel" padding="md">
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-ink-soft)', display: 'block', marginBottom: 'var(--space-3)' }}>
                Onboarding & Persona Assets (Lazy-Loaded AVIF/WebP)
              </span>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 'var(--space-3)',
                }}
              >
                {(['IMG-2', 'IMG-3', 'IMG-4', 'IMG-5', 'IMG-6'] as AssetId[]).map((id) => (
                  <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-panel-border)' }}>
                      <ResponsiveMedia assetId={id} aspectRatio="16/9" />
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 'var(--weight-semibold)', color: 'var(--color-ink)' }}>
                      {id}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--color-ground)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-ink)' }}>
                  Zero-Code Swapping Guarantee
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)', marginTop: '0.125rem' }}>
                  Dropping new photo files into <code>assets/source/</code> rebuilds the optimized bundle with no code edits.
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>

      {/* Slide-over Explainability Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Why did Tara take this action?"
        subtitle="Full Explainability Trace • Confidence: 96% • Risk Tier 1"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--status-ok-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--status-ok-border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--status-ok-text)' }}>
              DECISION VERIFIED BY POLICY ENGINE
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--status-ok-text)', marginTop: '0.25rem' }}>
              Action is non-monetary and completely reversible. Qualified for autonomous execution under Tier 1 guidelines.
            </div>
          </div>

          <h5 style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
            Knowledge Graph Path:
          </h5>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', padding: 'var(--space-3)', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-panel-border)' }}>
            Merchant(Sharma Stores) <br />
            → Device(SB-4421) <br />
            → Telemetry(battery=12%, ping=stale_7h) <br />
            → Policy(Tier1_Diagnostic_Check) <br />
            → Action(AutoAPNReboot)
          </div>

          <h5 style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
            Audit Evidence:
          </h5>
          <EvidenceRow
            label="Invariants"
            value="Device SB-4421 single source verified"
            statusBadge={<StatusBadge status="ok" label="Consistent" size="sm" />}
          />
          <EvidenceRow
            label="Human in Loop"
            value="Tier 2 required if device replacement proposed"
            statusBadge={<StatusBadge status="pending-ops" label="Required" size="sm" />}
          />

          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button fullWidth variant="primary" onClick={() => setDrawerOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Floating Toasts Container */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          right: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          zIndex: 'var(--z-toast)',
          pointerEvents: 'none',
        }}
      >
        {toastList.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              id={t.id}
              type={t.type}
              title={t.title}
              message={t.message}
              onDismiss={(id) => setToastList((prev) => prev.filter((item) => item.id !== id))}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
