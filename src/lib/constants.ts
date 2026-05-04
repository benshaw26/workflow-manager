import type { Automation } from '@/types'

export const AUTOMATIONS: Automation[] = [
  {
    id: 'property-analysis',
    title: 'Property Analysis',
    tagline: 'Scan & rank properties for investment potential',
    icon: 'Building2',
    category: 'Analysis',
    color: 'cyan',
    launchUrl: 'http://localhost:5174',
    description:
      'Our AI-powered property analysis automation scans thousands of property listings in real time, evaluating them against dozens of investment criteria including location scores, rental yield potential, capital growth trends, and market timing signals.',
    benefits: [
      'Analyse 1,000+ properties per hour automatically',
      'AI-scored investment ratings from 0–100',
      'Rental yield and ROI projections included',
      'Comparable market analysis (CMA) generated instantly',
      'Shortlist emailed directly to your inbox',
    ],
    useCases: [
      'Property investors sourcing buy-to-let opportunities',
      'Estate agents building investment portfolios for clients',
      'Developers identifying undervalued land or properties',
    ],
  },
  {
    id: 'invoice-creation',
    title: 'Invoice Creation',
    tagline: 'Auto-generate professional invoices from data',
    icon: 'FileText',
    category: 'Finance',
    color: 'purple',
    description:
      'Eliminate manual invoicing forever. Our automation reads your sales data, CRM entries, or completed job records and instantly generates branded, accurate invoices — ready to send to clients within seconds.',
    benefits: [
      'Generate invoices in under 5 seconds',
      'Pull data directly from your CRM or spreadsheets',
      'Branded PDF output with your logo and details',
      'Auto-send to clients via email on completion',
      'Reduce invoicing errors by 99%',
    ],
    useCases: [
      'Freelancers and agencies billing multiple clients',
      'Trade businesses (plumbers, electricians, builders)',
      'Service companies with recurring billing cycles',
    ],
  },
  {
    id: 'content-creation',
    title: 'Content Creation',
    tagline: 'AI-written blogs, social posts, and ad copy at scale',
    icon: 'PenTool',
    category: 'Marketing',
    color: 'cyan',
    launchUrl: '/social-scheduler',
    description:
      'Scale your content output without scaling your team. Our AI content automation analyses your brand from your website or visuals, then produces platform-optimised LinkedIn, X, and Instagram posts — scheduled and ready to publish.',
    benefits: [
      'Brand personality extracted directly from your website',
      'Platform-optimised posts for LinkedIn, X, and Instagram',
      'Paste images to generate visual content captions instantly',
      'Posts scheduled and queued in your content calendar',
      'Consistent brand voice across every platform, every time',
    ],
    useCases: [
      'Marketing agencies managing multiple client brands',
      'E-commerce stores needing product descriptions at scale',
      'SaaS companies running thought leadership campaigns',
    ],
  },
  {
    id: 'ai-chatbot',
    title: 'AI Chatbot',
    tagline: '24/7 intelligent customer support agent',
    icon: 'MessageSquare',
    category: 'Support',
    color: 'purple',
    description:
      'Deploy a custom AI chatbot trained on your business knowledge base that handles customer enquiries, qualifies leads, books appointments, and escalates complex issues — all without human intervention, around the clock.',
    benefits: [
      'Responds to customer queries in under 2 seconds',
      'Trained on your specific products, FAQs, and policies',
      'Seamlessly hands off to human agents when needed',
      'Captures and qualifies leads automatically',
      'Multi-platform: website, WhatsApp, Facebook Messenger',
    ],
    useCases: [
      'E-commerce stores handling high volumes of order queries',
      'Service businesses managing appointment bookings',
      'SaaS platforms providing 24/7 technical support',
    ],
  },
  {
    id: 'email-marketing',
    title: 'Email Marketing',
    tagline: 'Personalised campaign automation at scale',
    icon: 'Mail',
    category: 'Marketing',
    color: 'cyan',
    launchUrl: '/email-campaign',
    description:
      'Build, segment, and launch highly personalised email campaigns automatically. Our AI analyses your subscriber behaviour, personalises subject lines and content for each recipient, and sends at the optimal time for maximum open rates.',
    benefits: [
      'AI-personalised subject lines per recipient',
      'Automatic list segmentation based on behaviour',
      'Send-time optimisation for each subscriber',
      'A/B testing run and optimised automatically',
      'Average open rate improvement of 35%+',
    ],
    useCases: [
      'E-commerce brands running seasonal promotions',
      'B2B companies nurturing long sales cycles',
      'Membership organisations engaging their communities',
    ],
  },
  {
    id: 'email-response',
    title: 'Email Response Automation',
    tagline: 'Smart inbox that reads, understands & replies automatically',
    icon: 'Inbox',
    category: 'Support',
    color: 'purple',
    description:
      'Transform your inbox from a bottleneck into a competitive advantage. Our AI reads incoming emails, understands the intent and context, and composes appropriate, professional responses — handling routine enquiries without you lifting a finger.',
    benefits: [
      'Responds to 80% of routine emails automatically',
      'Understands context, tone, and urgency',
      'Drafts responses for review before sending (configurable)',
      'Learns your writing style over time',
      'Flags urgent or sensitive emails for human review',
    ],
    useCases: [
      'Businesses receiving high volumes of customer enquiries',
      'Sales teams managing inbound lead responses',
      'Support departments handling repetitive ticket types',
    ],
  },
  {
    id: 'bio-creation',
    title: 'Bio Creation',
    tagline: 'AI-crafted professional bios for any platform or purpose',
    icon: 'UserCircle',
    category: 'Marketing',
    color: 'cyan',
    description:
      'Generate compelling, platform-optimised professional bios in seconds. Our AI analyses your career history, achievements, and brand voice to craft tailored bios for LinkedIn, press releases, speaker profiles, websites, and more — consistent, polished, and always on-brand.',
    benefits: [
      'Bios tailored for LinkedIn, Twitter, speaker pages, and press kits',
      'Matches your brand tone — professional, friendly, or authoritative',
      'Multiple length variants generated in one click',
      'Highlights key achievements and unique value propositions',
      'Instant updates when your role or focus changes',
    ],
    useCases: [
      'Professionals updating their LinkedIn or website about pages',
      'Agencies creating bios for multiple team members at scale',
      'Speakers and consultants needing platform-specific bios',
    ],
  },
]

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Automations', href: '/automations' },
  { label: 'Book a Demo', href: '/booking' },
]

export const DASHBOARD_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Automations', href: '/automations', icon: 'Zap' },
  { label: 'Book a Demo', href: '/booking', icon: 'Calendar' },
]

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
]

export const TESTIMONIALS = [
  {
    name: 'James Harrison',
    role: 'Property Investment Director',
    company: 'Apex Capital Properties',
    text: 'BMS Services transformed how we source investment properties. Their AI analysis tool shortlists 50 opportunities overnight that would have taken my team weeks to review manually. ROI on the subscription paid back in the first month.',
    rating: 5,
  },
  {
    name: 'Sarah Chen',
    role: 'Head of Operations',
    company: 'CloudLogic Ltd',
    text: "The email response automation alone saved us 25 hours a week. Our response times went from 6 hours to under 3 minutes. Customer satisfaction scores are at an all-time high. I honestly can't imagine running the business without it now.",
    rating: 5,
  },
  {
    name: 'Marcus Williams',
    role: 'Founder & CEO',
    company: 'Elevate Digital Agency',
    text: 'We now produce 10x the content for our clients at the same cost. The AI chatbot we deployed for our biggest client handles 400+ conversations a day with zero complaints. BMS Services is genuinely elite.',
    rating: 5,
  },
]

export const STATS = [
  { value: 500, suffix: '+', label: 'Automation Runs Daily' },
  { value: 10000, suffix: '+', label: 'Items Analysed' },
  { value: 98, suffix: '%', label: 'Success Rate' },
  { value: 50, suffix: '+', label: 'Clients Served' },
]

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Discovery Call',
    description: 'We dig into your goals, challenges, audience, and what success looks like for you — completely free.',
  },
  {
    step: 2,
    title: 'Strategy & Proposal',
    description: 'I put together a tailored plan — clear scope, timeline, and transparent pricing. No surprises, ever.',
  },
  {
    step: 3,
    title: 'Build & Refine',
    description: 'I build, you review. Regular check-ins keep you in control and the project on track from day one.',
  },
  {
    step: 4,
    title: 'Launch & Grow',
    description: "We go live. I don't disappear — ongoing support and optimisation is always available when you need it.",
  },
]
