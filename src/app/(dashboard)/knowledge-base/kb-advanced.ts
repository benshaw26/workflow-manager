// ─── Advanced Marketing Knowledge Base ────────────────────────────────────────
// Comprehensive data for hooks, frameworks, algorithms, viral triggers, and more.

export type HookFormula = {
  id: string
  name: string
  template: string
  example: string
  bestFor: string[]
  platforms: string[]
  viralScore: number // 1–10
}

export const HOOK_FORMULAS: HookFormula[] = [
  {
    id: 'bold-claim',
    name: 'The Bold Claim',
    template: 'I [achieved impressive result] in [short timeframe] with [simple/unexpected method]',
    example: 'I got 10,000 followers in 30 days posting only 3x per week. Here\'s exactly how.',
    bestFor: ['Building credibility fast', 'High-reach organic content', 'Case studies'],
    platforms: ['LinkedIn', 'TikTok', 'Instagram', 'X'],
    viralScore: 9,
  },
  {
    id: 'pattern-interrupt',
    name: 'The Pattern Interrupt',
    template: 'Stop doing [common behaviour]. Start doing [counterintuitive alternative] instead.',
    example: 'Stop posting every day. It\'s destroying your engagement. Here\'s what actually works.',
    bestFor: ['Grabbing attention in feeds', 'Contrarian thought leadership'],
    platforms: ['LinkedIn', 'TikTok', 'X', 'Instagram'],
    viralScore: 9,
  },
  {
    id: 'number-list',
    name: 'The Power Number',
    template: '[Specific number] [things/ways/secrets] that [desirable outcome] (most people don\'t know #[X])',
    example: '7 Instagram mistakes killing your reach — #5 shocked me.',
    bestFor: ['Carousels', 'Threads', 'Educational content', 'Saves & shares'],
    platforms: ['Instagram', 'LinkedIn', 'TikTok', 'Pinterest'],
    viralScore: 8,
  },
  {
    id: 'unpopular-opinion',
    name: 'The Unpopular Opinion',
    template: 'Unpopular opinion: [contrarian take on accepted wisdom in your niche]',
    example: 'Unpopular opinion: Consistency is overrated. Quality beats frequency every single time.',
    bestFor: ['Comment bait', 'Thought leadership', 'Community debate'],
    platforms: ['LinkedIn', 'X', 'TikTok'],
    viralScore: 10,
  },
  {
    id: 'mistake-lesson',
    name: 'The Mistake & Lesson',
    template: 'I made a [costly/embarrassing] mistake with [topic]. Here\'s what I learned so you don\'t have to.',
    example: 'I wasted £8,000 on Facebook ads before learning this one thing. Don\'t make my mistake.',
    bestFor: ['Relatability', 'Trust building', 'Genuine engagement'],
    platforms: ['LinkedIn', 'Instagram', 'TikTok', 'YouTube'],
    viralScore: 9,
  },
  {
    id: 'before-after',
    name: 'The Transformation',
    template: 'From [undesirable before state] to [desirable after state] in [timeframe] — without [common sacrifice]',
    example: 'From 200 to 10k followers in 60 days — without paid ads or going viral.',
    bestFor: ['Social proof', 'Course/service promotion', 'Testimonials'],
    platforms: ['Instagram', 'TikTok', 'Facebook', 'YouTube'],
    viralScore: 8,
  },
  {
    id: 'relatable-pain',
    name: 'The Relatable Pain',
    template: 'You know that feeling when [universally frustrating situation]? Yeah. Here\'s what actually fixes it.',
    example: 'You know that feeling when you post your best content and get 3 likes? Here\'s why — and how to fix it.',
    bestFor: ['Community building', 'Emotional connection', 'DM conversations'],
    platforms: ['Instagram', 'TikTok', 'Facebook'],
    viralScore: 7,
  },
  {
    id: 'curiosity-gap',
    name: 'The Curiosity Gap',
    template: 'The [thing authorities/experts] don\'t want you to know about [topic in your niche]',
    example: 'The thing marketing "gurus" won\'t tell you about going viral — it\'s embarrassingly simple.',
    bestFor: ['Scroll-stopping', 'Email subject lines', 'Video thumbnails'],
    platforms: ['YouTube', 'TikTok', 'Instagram', 'Email'],
    viralScore: 8,
  },
  {
    id: 'social-proof-number',
    name: 'The Social Proof Punch',
    template: '[Impressive metric] [people/brands] can\'t be wrong. Here\'s the [strategy/product/method] behind it.',
    example: '50,000 business owners use this exact content framework. Here\'s the full breakdown.',
    bestFor: ['Product launches', 'Course promotion', 'Authority building'],
    platforms: ['LinkedIn', 'Instagram', 'Email', 'YouTube'],
    viralScore: 7,
  },
  {
    id: 'open-loop',
    name: 'The Open Loop',
    template: 'I discovered something [adjective] about [topic]. I\'ll share it at the end — but first...',
    example: 'I discovered the real reason your ads aren\'t converting. I\'ll show you the fix — but first, you need to understand this.',
    bestFor: ['Video retention', 'Thread engagement', 'Email open rates'],
    platforms: ['YouTube', 'TikTok', 'LinkedIn', 'Email'],
    viralScore: 8,
  },
  {
    id: 'warning-hook',
    name: 'The Warning',
    template: 'Warning: if you\'re [doing common thing], you\'re [causing unwanted result] and don\'t even know it.',
    example: 'Warning: if you\'re using hashtags like most creators do, you\'re actually suppressing your reach.',
    bestFor: ['High open rate emails', 'TikTok hooks', 'Pattern interrupts'],
    platforms: ['TikTok', 'Email', 'LinkedIn', 'Instagram'],
    viralScore: 9,
  },
  {
    id: 'build-in-public',
    name: 'The Build in Public',
    template: '[Day/Week/Month] [number] of building [project]. Here\'s what\'s working, what\'s failing, and the raw numbers.',
    example: 'Month 3 of building my agency in public. £0 → £8,400 MRR. Here\'s every strategy I used.',
    bestFor: ['LinkedIn audience', 'X/Twitter', 'Long-term audience loyalty'],
    platforms: ['LinkedIn', 'X', 'TikTok'],
    viralScore: 9,
  },
  {
    id: 'pov-hook',
    name: 'The POV',
    template: 'POV: You\'re [audience identity] and you just discovered [game-changing realisation]',
    example: 'POV: You\'re a small business owner and you just realised you\'ve been doing social media backwards.',
    bestFor: ['TikTok virality', 'Relatable content', 'Younger audiences'],
    platforms: ['TikTok', 'Instagram Reels'],
    viralScore: 9,
  },
  {
    id: 'day-in-life',
    name: 'The Day in the Life',
    template: 'A day in the life of [specific job/identity] making £[amount] — the unfiltered version',
    example: 'A day in the life of a social media manager who handles 12 accounts alone. The unfiltered version.',
    bestFor: ['Authenticity', 'Aspirational content', 'Brand humanisation'],
    platforms: ['TikTok', 'Instagram', 'YouTube'],
    viralScore: 8,
  },
  {
    id: 'step-by-step',
    name: 'The Exact Step-by-Step',
    template: 'The exact [number]-step process I used to [result]. Step [number] is the most underrated.',
    example: 'The exact 5-step process I used to land 3 enterprise clients in one month. Step 4 is the most underrated.',
    bestFor: ['Saves', 'Shares', 'High-value content', 'Lead magnets'],
    platforms: ['LinkedIn', 'Instagram', 'Pinterest', 'YouTube'],
    viralScore: 8,
  },
]

// ─── Copywriting Frameworks ────────────────────────────────────────────────────

export type CopyFramework = {
  id: string
  name: string
  acronym: string
  steps: { letter: string; name: string; description: string; example: string }[]
  bestFor: string[]
  avgConversionLift: string
}

export const COPYWRITING_FRAMEWORKS: CopyFramework[] = [
  {
    id: 'aida',
    name: 'AIDA',
    acronym: 'Attention · Interest · Desire · Action',
    steps: [
      { letter: 'A', name: 'Attention', description: 'Stop the scroll with a bold headline, statement, or visual hook', example: '"Most businesses waste 80% of their ad budget. Are you one of them?"' },
      { letter: 'I', name: 'Interest', description: 'Build intrigue by presenting the problem or opportunity in a compelling way', example: '"The reason is simple: they\'re targeting the wrong audience with the wrong message at the wrong time."' },
      { letter: 'D', name: 'Desire', description: 'Make them want the solution by painting a vivid picture of the outcome', example: '"Imagine cutting your ad spend in half while doubling your leads. That\'s exactly what our clients achieve in 90 days."' },
      { letter: 'A', name: 'Action', description: 'Give one clear, low-friction CTA', example: '"Book a free 20-minute strategy call today — limited spots this month."' },
    ],
    bestFor: ['Ad copy', 'Sales pages', 'Email campaigns', 'Social posts'],
    avgConversionLift: '20–40% vs unstructured copy',
  },
  {
    id: 'pas',
    name: 'PAS',
    acronym: 'Problem · Agitate · Solution',
    steps: [
      { letter: 'P', name: 'Problem', description: 'State the exact pain point your audience feels', example: '"Your social media isn\'t generating any real business leads."' },
      { letter: 'A', name: 'Agitate', description: 'Twist the knife — make the problem feel urgent and costly', example: '"Every week you\'re posting without a strategy is a week your competitors are pulling ahead. Your leads aren\'t just stagnating — they\'re going to someone else."' },
      { letter: 'S', name: 'Solution', description: 'Present your offer as the clear, obvious fix', example: '"Our Marketing Plan Generator analyses your brand, competitors, and audience to give you a complete 90-day roadmap — in minutes, not weeks."' },
    ],
    bestFor: ['Social ads', 'Cold email', 'Landing page intro sections'],
    avgConversionLift: '15–35% vs problem-only copy',
  },
  {
    id: 'bab',
    name: 'BAB',
    acronym: 'Before · After · Bridge',
    steps: [
      { letter: 'B', name: 'Before', description: 'Paint the current painful reality your audience is living in', example: '"You\'re spending hours creating content that gets barely any engagement. Your follower count hasn\'t moved in months."' },
      { letter: 'A', name: 'After', description: 'Show the desired future state in vivid, specific detail', example: '"Imagine waking up to 15 new enquiries in your DMs. Your content is getting shared by people you\'ve never met. You\'re turning down clients because you\'re at capacity."' },
      { letter: 'B', name: 'Bridge', description: 'Explain exactly how your product/service gets them from before to after', example: '"That\'s what happens when you follow a strategy built around your specific brand, audience, and goals. Our system does in 10 minutes what agencies charge £3,000 for."' },
    ],
    bestFor: ['Testimonial-style content', 'Email nurture sequences', 'Video scripts'],
    avgConversionLift: '25–45% vs generic copy',
  },
  {
    id: '4ps',
    name: '4 Ps',
    acronym: 'Promise · Picture · Proof · Push',
    steps: [
      { letter: 'P', name: 'Promise', description: 'Lead with your strongest benefit or outcome', example: '"We\'ll double your social media leads in 90 days — or we work for free."' },
      { letter: 'P', name: 'Picture', description: 'Create a vivid mental image of life after the transformation', example: '"Picture your phone buzzing every morning with new client enquiries, all from content you posted once."' },
      { letter: 'P', name: 'Proof', description: 'Back up the promise with data, testimonials, or case studies', example: '"312 businesses have used this exact system. Average result: 3.2× more leads in the first 60 days."' },
      { letter: 'P', name: 'Push', description: 'Create urgency and tell them exactly what to do next', example: '"Only 8 spots left this month. Click below to claim yours before they\'re gone."' },
    ],
    bestFor: ['High-ticket offers', 'Launch emails', 'Webinar CTAs'],
    avgConversionLift: '30–60% on high-ticket offers',
  },
  {
    id: 'slap',
    name: 'SLAP',
    acronym: 'Stop · Look · Act · Purchase',
    steps: [
      { letter: 'S', name: 'Stop', description: 'Interrupt the pattern — disrupt their scrolling with contrast, colour, or a surprising statement', example: 'Bold visual, unusual angle, or a statement nobody expects in your niche.' },
      { letter: 'L', name: 'Look', description: 'Give them a reason to keep reading — a benefit, a question, or a curiosity trigger', example: '"...because the way you\'re doing hashtags is actually reducing your reach."' },
      { letter: 'A', name: 'Act', description: 'Tell them the one action you want them to take right now', example: '"Tap the link in bio to see your free platform audit."' },
      { letter: 'P', name: 'Purchase', description: 'Remove the friction from the final step with risk reversal or social proof', example: '"No card required. 2-minute setup. 100% free to start."' },
    ],
    bestFor: ['Social ads', 'Short-form video CTAs', 'Display advertising'],
    avgConversionLift: '20–30% on paid social',
  },
  {
    id: 'star',
    name: 'STAR',
    acronym: 'Situation · Task · Action · Result',
    steps: [
      { letter: 'S', name: 'Situation', description: 'Set the scene — what was the context/challenge?', example: '"A local restaurant had 800 Instagram followers and zero bookings from social."' },
      { letter: 'T', name: 'Task', description: 'What needed to be achieved?', example: '"The goal: 50 new bookings per month from social media alone within 90 days."' },
      { letter: 'A', name: 'Action', description: 'What specific steps were taken?', example: '"We built a Reels strategy around behind-the-scenes kitchen content + ran £500/mo Meta ads targeting a 5-mile radius."' },
      { letter: 'R', name: 'Result', description: 'The measurable, specific outcome', example: '"Result: 67 new bookings in month 3, £4,800 in additional monthly revenue. ROI: 9.6×."' },
    ],
    bestFor: ['Case studies', 'Testimonial posts', 'B2B content', 'LinkedIn'],
    avgConversionLift: '35–55% for B2B case study content',
  },
  {
    id: 'fab',
    name: 'FAB',
    acronym: 'Features · Advantages · Benefits',
    steps: [
      { letter: 'F', name: 'Feature', description: 'What it IS — the factual description', example: '"AI-powered 5-stage brand analysis"' },
      { letter: 'A', name: 'Advantage', description: 'What it DOES — how it\'s better than the alternative', example: '"Delivers a complete marketing strategy in minutes, not weeks"' },
      { letter: 'B', name: 'Benefit', description: 'What it MEANS for them — the emotional/practical payoff', example: '"So you can focus on running your business while your social media builds your pipeline"' },
    ],
    bestFor: ['Product descriptions', 'Sales decks', 'Feature announcements'],
    avgConversionLift: '15–25% on product pages',
  },
]

// ─── Platform Algorithm Insights ──────────────────────────────────────────────

export type AlgorithmInsight = {
  platform: string
  emoji: string
  howItWorks: string
  keySignals: string[]
  boostActions: string[]
  killActions: string[]
  distributionWindow: string
  secondChance: boolean
  secondChanceNote?: string
}

export const ALGORITHM_INSIGHTS: AlgorithmInsight[] = [
  {
    platform: 'Instagram',
    emoji: '📸',
    howItWorks: 'Instagram uses a multi-stage distribution model. It first shows content to ~10% of your followers. If engagement (especially saves + shares) is strong in the first 60–90 minutes, it expands reach to more followers, then non-followers via Explore and Reels feeds.',
    keySignals: [
      'Saves (weighted highest — 5× value of a like)',
      'Shares to Stories and DMs (2nd highest signal)',
      'Comments (especially long comments)',
      'Watch time / completion rate for Reels',
      'Engagement velocity in first 60 minutes',
      'Profile visits after viewing content',
    ],
    boostActions: [
      'Reply to every comment in the first 30 minutes (boosts comment thread velocity)',
      'Post a Story linking to the feed post immediately after publishing',
      'Ask a question in the caption to trigger comments',
      'Use trending audio on Reels (confirmed algorithm boost)',
      'Post carousels — they auto-replay and increase time-on-post',
      'Pin your best comment with a CTA ("Save this for later!")',
    ],
    killActions: [
      'Deleting and reposting (resets all engagement signals)',
      'Posting links in captions (penalised — use bio link instead)',
      'Using banned or spammy hashtags',
      'Bot engagement (detected and suppressed quickly)',
      'Posting too frequently without engagement recovery time',
    ],
    distributionWindow: '48–72 hours (Reels can resurface after weeks)',
    secondChance: true,
    secondChanceNote: 'Instagram has a "second chance" for Reels — if a post gets a spike of saves/shares after its initial window, the algorithm can re-distribute it to new audiences.',
  },
  {
    platform: 'TikTok',
    emoji: '🎵',
    howItWorks: 'TikTok\'s For You Page algorithm is the most meritocratic of all platforms. Every video gets shown to a small test group (~300–500 users). Completion rate and re-watch rate determine whether it gets pushed to larger batches (1k → 10k → 100k → millions). Follower count is nearly irrelevant — a zero-follower account can reach millions.',
    keySignals: [
      'Completion rate (% of video watched to the end) — #1 signal',
      'Re-watch rate (video looping without swiping)',
      'Shares (most powerful virality signal)',
      'Comments per view',
      'Saves (TikTok "Favourites")',
      'Follows after viewing',
    ],
    boostActions: [
      'Create a loop — end the video where it starts (forces re-watches)',
      'Use trending sounds within 24–48 hours of them trending',
      'Keep videos under 30 seconds for highest completion rates',
      'Use on-screen text that can\'t be read before the video ends',
      'Pin top-performing comments or reply via video to boost engagement',
      'Post 3–4x daily during growth phase (volume increases test group hits)',
    ],
    killActions: [
      'Using competitor platform watermarks (Reels watermarks are detected and penalised)',
      'Low-resolution video (TikTok prioritises HD)',
      'Posting copyrighted music not in TikTok\'s library',
      'Deleting videos (permanently harms account health)',
      'Long intros — users swipe within 1–2 seconds if not hooked',
    ],
    distributionWindow: '2–4 hours initial batch; no time expiry for viral content',
    secondChance: true,
    secondChanceNote: 'TikTok regularly resurfaces old videos — videos from months ago can suddenly receive millions of views if the algorithm detects renewed interest.',
  },
  {
    platform: 'LinkedIn',
    emoji: '💼',
    howItWorks: 'LinkedIn uses a quality filter + network distribution model. Content first goes to a bot check, then to a small sample of your connections. If early engagement is strong (especially comments from 1st-degree connections), it\'s boosted to 2nd and 3rd connections. LinkedIn heavily weights "dwell time" — how long someone spends reading/viewing your post.',
    keySignals: [
      'Comments (especially from connections in relevant industries)',
      'Dwell time (time spent on post without scrolling past)',
      'Reactions (especially early reactions)',
      'Shares and re-posts',
      'Profile visits after viewing',
      'How quickly your network engages',
    ],
    boostActions: [
      'Ask 3–5 connections to comment within the first 30 minutes (pods)',
      'End every post with a specific question to prompt comments',
      'Use line breaks every 1–2 sentences (increases dwell time)',
      'Include a strong "cliffhanger" before the "...see more" cutoff',
      'Post Tues–Thu 7–9am (peak professional browsing time)',
      'Comment on trending posts in your niche before publishing your own',
    ],
    killActions: [
      'Including URLs in the post body (link in first comment instead)',
      'Hashtag stuffing (3–5 specific hashtags max)',
      'Overly corporate/sales-y language (connection rate tanks)',
      'Posting weekends or Monday mornings (lowest engagement windows)',
    ],
    distributionWindow: '3–7 days (LinkedIn content lasts much longer than other platforms)',
    secondChance: false,
  },
  {
    platform: 'Facebook',
    emoji: '👥',
    howItWorks: 'Facebook\'s algorithm prioritises "meaningful interactions" — content that sparks conversations between people who know each other. Page organic reach is effectively dead (2–5%). Groups get dramatically more reach (20–40% of members). The algorithm heavily favours native video and live content.',
    keySignals: [
      'Comments between friends/family on your content',
      'Shares (especially private messages)',
      'Long comments (more than one word)',
      'Saves',
      'Reaction type (Love > Haha > Like)',
      'Video completion rate',
    ],
    boostActions: [
      'Build a Facebook Group (not just a Page) for 10× organic reach',
      'Go Live regularly — gets 6× more interactions than regular video',
      'Upload video natively rather than sharing YouTube links',
      'Ask for specific reactions ("React ❤️ if you agree, 😂 if you don\'t")',
      'Use Facebook Events for all promotions (free organic discovery)',
    ],
    killActions: [
      'Posting external links without native content (massive reach penalty)',
      'Click-bait headlines (Facebook actively demotes these)',
      'Engagement bait ("Comment YES if you want this!")',
      'Posting without a clear image or video',
    ],
    distributionWindow: '12–24 hours (much shorter than LinkedIn)',
    secondChance: false,
  },
  {
    platform: 'YouTube',
    emoji: '▶️',
    howItWorks: 'YouTube\'s algorithm is a recommendation engine optimised for "session time" — how long someone stays on YouTube after watching your video. Click-Through Rate (CTR) from thumbnails and titles determines whether your video gets suggested. Average View Duration (AVD) determines whether it keeps getting recommended.',
    keySignals: [
      'CTR (Click-Through Rate from thumbnails) — target 4–10%',
      'Average View Duration (AVD) — target 40–60% of video length',
      'Absolute watch time in minutes',
      'Likes + Comments within first 24 hours',
      'Subscriber conversion rate',
      'End screen and card click-through rates',
    ],
    boostActions: [
      'A/B test thumbnails using YouTube\'s thumbnail test feature',
      'Use chapters/timestamps (increases AVD significantly)',
      'Hook viewers in first 30 seconds before mentioning what video is about',
      'End with a strong CTA to subscribe + watch next video',
      'Post YouTube Shorts to feed algorithm without cannibalising long-form',
      'Pin a comment with key links and ask a question to boost engagement',
    ],
    killActions: [
      'Skipping SEO in title/tags/description (YouTube is the world\'s 2nd largest search engine)',
      'Generic thumbnails without faces or text overlay',
      'Long intros — 68% of viewers abandon in first 30 seconds if not hooked',
      'Inconsistent posting schedule (algorithm demotes irregular channels)',
    ],
    distributionWindow: 'No expiry — YouTube search gives videos indefinite life',
    secondChance: true,
    secondChanceNote: 'YouTube regularly resurfaces videos in search results and suggested feeds for months or years after publication. Evergreen content compounds in value.',
  },
  {
    platform: 'X (Twitter)',
    emoji: '𝕏',
    howItWorks: 'X\'s algorithm (post-Musk) heavily favours X Premium subscribers and engagement velocity. The "For You" feed uses a complex scoring system weighting past engagement history with an account, topic affinity, and reply/like/retweet rates. Real-time trending is massive — engaging with trending topics gives immediate reach boosts.',
    keySignals: [
      'Replies (especially rapid replies from engaged followers)',
      'Retweets/reposts with comments',
      'Bookmarks (equivalent to Instagram saves)',
      'Follows after viewing content',
      'Link clicks (for X Premium users)',
      'Time spent reading long-form posts',
    ],
    boostActions: [
      'Post threads rather than single tweets (2–5× more reach)',
      'Reply to posts from large accounts in your niche within minutes of posting',
      'Engage with trending hashtags relevant to your industry',
      'Pin your best-performing tweet/thread',
      'X Premium subscription boosts reply visibility significantly',
    ],
    killActions: [
      'Posting links without context (external links suppressed)',
      'Soft opinions — X rewards bold, polarising takes',
      'Not engaging in the replies of viral posts',
    ],
    distributionWindow: '2–6 hours (Twitter has always been real-time first)',
    secondChance: false,
  },
]

// ─── Viral Content Triggers ────────────────────────────────────────────────────

export type ViralTrigger = {
  trigger: string
  icon: string
  why: string
  howToUse: string[]
  examples: string[]
  viralProbability: string
}

export const VIRAL_TRIGGERS: ViralTrigger[] = [
  {
    trigger: 'Strong Identity Signal',
    icon: '🪪',
    why: 'People share content that represents who they are or who they want to be seen as. "This is so me" is the most powerful sharing motivation.',
    howToUse: [
      'Create content about a specific identity ("Signs you\'re a real [niche professional]")',
      'Use "if you [do X], this is for you" language',
      'Reference specific in-group experiences only your audience understands',
    ],
    examples: ['"You\'re not a real marketer until you\'ve..."', '"Things only creative entrepreneurs understand"'],
    viralProbability: 'Very High — especially on LinkedIn and TikTok',
  },
  {
    trigger: 'Useful Information People Want to Reference Later',
    icon: '📌',
    why: 'Saves are the most powerful distribution signal on Instagram and Pinterest. Content that functions as a "cheat sheet" or "reference" gets saved repeatedly.',
    howToUse: [
      'Create dense, high-value carousels with specific data/frameworks',
      'End with "Save this for when you need it"',
      'Design content that loses value if not saved (e.g. checklists, swipe files)',
    ],
    examples: ['"The ultimate hashtag cheat sheet for every platform"', '"15 hooks that always work (screenshot this)"'],
    viralProbability: 'High — especially on Instagram and Pinterest',
  },
  {
    trigger: 'Mild Controversy / Polarising Opinions',
    icon: '⚡',
    why: 'Disagreement drives comments. Comments drive reach. The algorithm interprets comments as "this content is generating conversation" and boosts distribution.',
    howToUse: [
      'Take a clear stance on a debated topic in your niche',
      'Challenge a common belief held by your audience',
      'Use "Hot take:" or "Unpopular opinion:" to prime the controversy signal',
    ],
    examples: ['"Engagement pods are cheating and they\'re ruining LinkedIn"', '"Posting every day is terrible advice for most businesses"'],
    viralProbability: 'Very High — but use carefully to avoid brand damage',
  },
  {
    trigger: 'Emotional Resonance',
    icon: '❤️',
    why: 'High-emotion content is shared 2–3× more than neutral content. The emotions that drive most sharing are: awe, amusement, anger, anxiety, and inspiration.',
    howToUse: [
      'Tell real, vulnerable stories with a lesson',
      'Show the human side of your brand (failures, fears, wins)',
      'Use transformation narratives (before/after emotionally, not just physically)',
    ],
    examples: ['"I nearly gave up on this business 6 months ago. Here\'s what changed."', '"The hardest lesson I learned in year 1 of running my own company."'],
    viralProbability: 'High — especially on Facebook, Instagram, TikTok',
  },
  {
    trigger: 'Surprising or Counterintuitive Data',
    icon: '📊',
    why: 'The brain is wired to flag information that contradicts our expectations. "Wait, that can\'t be right" is a powerful stopping mechanism.',
    howToUse: [
      'Lead with the surprising stat, then explain it',
      'Use "most people think X, but actually Y" structure',
      'Find counterintuitive data in your industry and publish it first',
    ],
    examples: ['"Brands that post LESS often actually grow FASTER. Here\'s the data."', '"89% of buyers check social media before making a purchase — but only 12% of businesses optimise for this."'],
    viralProbability: 'High — especially on LinkedIn, X, and YouTube',
  },
  {
    trigger: 'Perfect Timing / Trend Hijacking',
    icon: '🔥',
    why: 'Jumping on trending topics or moments gives your content built-in search volume and algorithm momentum. First-mover advantage is massive.',
    howToUse: [
      'Monitor Google Trends, TikTok Trends, and X trending topics daily',
      'Set up Google Alerts for your industry keywords',
      'Have a "reactive content" template ready to publish within 2 hours of news breaking',
    ],
    examples: ['Brands who posted Budget reaction content within 1 hour got 4–10× normal reach', 'Connecting your service to a trending topic in a creative, genuine way'],
    viralProbability: 'Very High — with fast turnaround',
  },
  {
    trigger: 'Social Currency (Makes the Sharer Look Good)',
    icon: '💎',
    why: 'People share content that makes them look smart, funny, interesting, or helpful to their network. "If I share this, what does it say about me?"',
    howToUse: [
      'Create content that makes the sharer look knowledgeable when they share it',
      'Produce exclusive-feeling data or insights (""I found something fascinating...")',
      'Design infographics and stats that are immediately impressive when shared',
    ],
    examples: ['"I asked 500 business owners what killed their marketing. The top answer surprised me."'],
    viralProbability: 'High — especially on LinkedIn and X',
  },
]

// ─── Ad Creative Principles ────────────────────────────────────────────────────

export type AdPrinciple = {
  principle: string
  icon: string
  detail: string
  tactics: string[]
  impact: string
}

export const AD_CREATIVE_PRINCIPLES: AdPrinciple[] = [
  {
    principle: 'The 1.5-Second Thumb Stop',
    icon: '👋',
    detail: 'The average scroll speed on mobile means your ad has 1.5 seconds to stop the thumb. The first frame must be so visually distinct or emotionally provocative that scrolling feels like a mistake.',
    tactics: [
      'Lead with the most dramatic/shocking part of your story, not the setup',
      'Use movement in the first frame — motion stops scrolling better than static',
      'High contrast colours (orange on dark, white on dark, etc.)',
      'A face looking directly at camera — eye contact triggers hardwired attention response',
      'Text overlay that teases the payoff ("The result shocked me...")',
    ],
    impact: 'Improving thumb-stop rate from 15% → 25% typically reduces CPM by 30–50%',
  },
  {
    principle: 'The Pattern Interrupt',
    icon: '🔀',
    detail: 'Social media users are trained to ignore ads. Creative that looks like an ad gets scrolled past. Creative that looks like organic content stops them.',
    tactics: [
      'Use UGC-style (vertical, slightly unpolished, real person talking to camera)',
      'Start with a comment or DM conversation screenshot',
      'Use platform-native elements (Instagram Stories UI, TikTok text overlay style)',
      'Show a real person\'s genuine reaction rather than scripted testimonial',
    ],
    impact: 'UGC-style ads outperform polished production ads by 4× on average CTR',
  },
  {
    principle: 'Lead with the Outcome, Not the Product',
    icon: '🎯',
    detail: 'Nobody buys a drill because they want a drill. They want a hole. Show the outcome — the transformation, the feeling, the result — before showing your product.',
    tactics: [
      'Open with the "after" state: the success, the transformation, the relief',
      'Show a real customer\'s life improved by your product/service',
      'Use specific numbers ("£4,200 in 60 days", "lost 2 stone in 12 weeks")',
      'Save the product reveal for after you\'ve created desire for the outcome',
    ],
    impact: 'Outcome-first ads achieve 2–3× higher ROAS than feature-first ads',
  },
  {
    principle: 'Social Proof Placement',
    icon: '⭐',
    detail: 'Social proof (reviews, subscriber counts, client results) should appear early in your ad — ideally in the first 5 seconds — not saved for the end. Most viewers never see the end.',
    tactics: [
      'Open with a screenshot of a 5-star review',
      'Show the number in the first frame ("Join 12,000+ businesses using...")',
      'Use real customer face + name + result (with permission)',
      'Stack 3 quick testimonials in the first 10 seconds (the "social proof reel")',
    ],
    impact: 'Early social proof reduces CPA by 15–30% compared to end-of-ad placement',
  },
  {
    principle: 'The Curiosity Gap CTA',
    icon: '🔍',
    detail: 'The standard "Learn More" CTA converts poorly. CTAs that create a curiosity gap or promise a specific next step dramatically outperform generic buttons.',
    tactics: [
      'Replace "Learn More" with "See how it works →" or "Show me the results"',
      'Use cliffhanger copy before the CTA ("Wait until you see what happens next...")',
      'Promise a specific, tangible thing from clicking ("Get your free brand audit")',
      'Use first-person CTAs ("Yes, I want this →" outperforms "Sign Up")',
    ],
    impact: 'Specific CTAs outperform generic CTAs by 90% in click-through rate',
  },
  {
    principle: 'Mobile-First Always',
    icon: '📱',
    detail: '95%+ of social media consumption happens on mobile. Creative designed for desktop and resized to mobile performs 40% worse than creative natively designed for vertical mobile screens.',
    tactics: [
      'Design in 9:16 vertical (1080×1920) as primary format',
      'Keep key elements in the centre third (safe zone)',
      'Use large, readable text — minimum 30px equivalent',
      'Ensure sound-off comprehension (85% watch without sound)',
      'Test on actual phone, not just desktop preview',
    ],
    impact: 'Mobile-first creative achieves 40% lower CPM on Meta than horizontal formats',
  },
]

// ─── Content Repurposing System ────────────────────────────────────────────────

export const CONTENT_REPURPOSING: {
  sourceFormat: string
  icon: string
  derivative: string
  platform: string
  effort: 'Low' | 'Medium' | 'High'
}[] = [
  { sourceFormat: 'Long-form blog post', icon: '📝', derivative: '5-slide carousel (key stats/steps)', platform: 'Instagram / LinkedIn', effort: 'Low' },
  { sourceFormat: 'Long-form blog post', icon: '📝', derivative: 'Twitter/X thread (15–20 tweets)', platform: 'X (Twitter)', effort: 'Low' },
  { sourceFormat: 'Long-form blog post', icon: '📝', derivative: '3 short-form video scripts', platform: 'TikTok / Reels / Shorts', effort: 'Medium' },
  { sourceFormat: 'Long-form blog post', icon: '📝', derivative: 'Email newsletter', platform: 'Email list', effort: 'Low' },
  { sourceFormat: 'Long-form blog post', icon: '📝', derivative: 'Pinterest infographic (5 tips)', platform: 'Pinterest', effort: 'Medium' },
  { sourceFormat: 'Podcast episode', icon: '🎙️', derivative: '3–5 audiogram clips (90s each)', platform: 'Instagram / LinkedIn / X', effort: 'Low' },
  { sourceFormat: 'Podcast episode', icon: '🎙️', derivative: 'Full transcript → blog post', platform: 'Website / SEO', effort: 'Medium' },
  { sourceFormat: 'Podcast episode', icon: '🎙️', derivative: 'Key quotes as static posts', platform: 'All platforms', effort: 'Low' },
  { sourceFormat: 'Webinar / Live video', icon: '🎥', derivative: '10 short clips (60–90s each)', platform: 'TikTok / Reels / YouTube Shorts', effort: 'Medium' },
  { sourceFormat: 'Webinar / Live video', icon: '🎥', derivative: 'Recap blog post with key learnings', platform: 'Website / LinkedIn Article', effort: 'Low' },
  { sourceFormat: 'Webinar / Live video', icon: '🎥', derivative: 'Quote cards from best moments', platform: 'Instagram / LinkedIn', effort: 'Low' },
  { sourceFormat: 'Short-form video (TikTok/Reel)', icon: '🎬', derivative: 'Same video cross-posted to all 4 platforms', platform: 'TikTok + Reels + Shorts + LinkedIn', effort: 'Low' },
  { sourceFormat: 'Short-form video (TikTok/Reel)', icon: '🎬', derivative: 'Transcribed caption → LinkedIn post', platform: 'LinkedIn', effort: 'Low' },
  { sourceFormat: 'Customer testimonial', icon: '⭐', derivative: 'Case study blog post with data', platform: 'Website / LinkedIn', effort: 'Medium' },
  { sourceFormat: 'Customer testimonial', icon: '⭐', derivative: 'Social proof carousel (5 testimonials)', platform: 'Instagram / LinkedIn', effort: 'Low' },
  { sourceFormat: 'Customer testimonial', icon: '⭐', derivative: 'Video testimonial → 3 short clips', platform: 'All platforms', effort: 'Low' },
  { sourceFormat: 'FAQ or customer question', icon: '❓', derivative: 'Short video answer (30–60s)', platform: 'TikTok / Reels / Shorts', effort: 'Low' },
  { sourceFormat: 'FAQ or customer question', icon: '❓', derivative: 'Long-form blog post answering deeply', platform: 'Website / SEO', effort: 'High' },
  { sourceFormat: 'Data / research / stats', icon: '📊', derivative: 'Infographic carousel', platform: 'Instagram / Pinterest / LinkedIn', effort: 'Medium' },
  { sourceFormat: 'Data / research / stats', icon: '📊', derivative: 'Data-led thread', platform: 'X (Twitter) / LinkedIn', effort: 'Low' },
]

// ─── Influencer Tier Guide ─────────────────────────────────────────────────────

export const INFLUENCER_TIERS = [
  {
    tier: 'Nano',
    range: '1K – 10K followers',
    emoji: '🌱',
    avgEngagement: '7–10%',
    avgCostPerPost: '£0–£150',
    trustLevel: 'Highest',
    bestFor: ['Hyperlocal campaigns', 'Authentic reviews', 'Starting influencer strategy on small budget'],
    tipToWork: 'Offer product gifting + commission. Most nano creators are eager and over-deliver.',
  },
  {
    tier: 'Micro',
    range: '10K – 100K followers',
    emoji: '🌿',
    avgEngagement: '3–7%',
    avgCostPerPost: '£150–£1,500',
    trustLevel: 'Very High',
    bestFor: ['Niche audience targeting', 'High engagement campaigns', 'UGC content creation'],
    tipToWork: 'Best ROI tier overall. Engaged, trust-based audiences. Negotiate content bundles (3 posts + 5 Stories).',
  },
  {
    tier: 'Macro',
    range: '100K – 1M followers',
    emoji: '🌳',
    avgEngagement: '1–3%',
    avgCostPerPost: '£1,500–£15,000',
    trustLevel: 'Moderate',
    bestFor: ['Mass awareness campaigns', 'New product launches', 'Brand credibility signalling'],
    tipToWork: 'Focus on creator-brand alignment, not just follower count. Request content usage rights for ads.',
  },
  {
    tier: 'Mega / Celebrity',
    range: '1M+ followers',
    emoji: '🏆',
    avgEngagement: '0.5–1.5%',
    avgCostPerPost: '£15,000–£500,000+',
    trustLevel: 'Low (aspirational rather than trusted)',
    bestFor: ['Brand awareness at scale', 'PR moments', 'High-profile launch events'],
    tipToWork: 'Only for established brands with large budgets. Engagement is low — pay for reach, not conversion.',
  },
]

// ─── Email Marketing Benchmarks ────────────────────────────────────────────────

export const EMAIL_BENCHMARKS = [
  { industry: 'E-commerce',            avgOpenRate: '18–22%', avgCTR: '2–3%',  avgConversion: '1–3%',  bestSendDay: 'Tue/Thu', topTip: 'Abandoned cart sequences recover 10–15% of lost sales on average.' },
  { industry: 'SaaS / Tech',           avgOpenRate: '22–28%', avgCTR: '3–5%',  avgConversion: '2–8%',  bestSendDay: 'Tue/Wed', topTip: 'Onboarding sequences that trigger on feature-use events convert 3× better than time-based.' },
  { industry: 'Professional Services', avgOpenRate: '25–35%', avgCTR: '4–6%',  avgConversion: '5–15%', bestSendDay: 'Wed/Thu', topTip: 'Educational content ("how we helped client X") beats promotional emails 5× in B2B.' },
  { industry: 'Hospitality',           avgOpenRate: '20–30%', avgCTR: '3–5%',  avgConversion: '8–20%', bestSendDay: 'Thu/Fri', topTip: 'Re-engagement sequences targeting past guests with personalised offers achieve 40% open rates.' },
  { industry: 'Fitness / Wellness',    avgOpenRate: '22–32%', avgCTR: '3–6%',  avgConversion: '3–10%', bestSendDay: 'Mon/Tue', topTip: 'Milestone emails ("You\'ve been a member for 6 months!") generate the highest engagement of any sequence.' },
  { industry: 'Real Estate',           avgOpenRate: '28–38%', avgCTR: '5–8%',  avgConversion: '1–5%',  bestSendDay: 'Wed/Thu', topTip: 'Hyper-local market update emails maintain lists better than any other content type.' },
  { industry: 'Beauty / Lifestyle',    avgOpenRate: '20–28%', avgCTR: '3–5%',  avgConversion: '2–6%',  bestSendDay: 'Thu/Fri', topTip: 'Birthday/anniversary emails with a personalised discount achieve 3× avg transaction value.' },
  { industry: 'Non-profit',            avgOpenRate: '25–35%', avgCTR: '3–5%',  avgConversion: '0.5–2%',bestSendDay: 'Tue/Wed', topTip: 'Impact stories and beneficiary updates drive 60% more donations than pure fundraising asks.' },
]

// ─── Hashtag Strategy ─────────────────────────────────────────────────────────

export const HASHTAG_STRATEGY = {
  instagram: {
    idealCount: '5–10 (algorithm penalises 30+ tag spam)',
    mix: '30% niche (under 100k posts) · 40% medium (100k–1M posts) · 30% broad (over 1M posts)',
    placement: 'In caption or first comment — both work equally',
    avoid: 'Banned hashtags, generic (#love, #instagood), competitor brand names',
    tip: 'Research hashtags by checking the "Top Posts" tab — if top posts have millions of likes, you\'ll never rank there.',
  },
  tiktok: {
    idealCount: '3–6 tags',
    mix: '1 niche · 1–2 topic-specific · 1 #ForYou or trending sound tag',
    placement: 'In caption only',
    avoid: 'Using only #fyp and #viral (too competitive, no niche signal)',
    tip: 'TikTok hashtags signal topic to the algorithm more than they drive discovery — use them to tell TikTok WHO to show your video to.',
  },
  linkedin: {
    idealCount: '3–5 hashtags',
    mix: '1 broad industry · 2 specific topic · 1 niche or personal brand tag',
    placement: 'End of post only — not inline',
    avoid: 'More than 5 (LinkedIn suppresses hashtag-heavy posts)',
    tip: 'Follow hashtags relevant to your content before posting — commenting on trending posts under your hashtags boosts your visibility there.',
  },
  twitter: {
    idealCount: '1–2 hashtags (more reduces engagement)',
    mix: 'Trending hashtag relevant to content OR niche community hashtag',
    placement: 'Integrated naturally into tweet text',
    avoid: 'Hashtag stuffing (proven to reduce reach on X)',
    tip: 'On X, trending hashtags matter far more than niche ones. Check trending before posting.',
  },
  pinterest: {
    idealCount: '8–15 hashtags',
    mix: 'Mix of keyword-rich descriptive tags and trending category tags',
    placement: 'In pin description — also functions as SEO',
    avoid: 'Vague or unrelated hashtags',
    tip: 'Pinterest hashtags have a 1-week freshness window — use them on all new pins, as older pins rely on keyword SEO instead.',
  },
}

// ─── Brand Storytelling Frameworks ────────────────────────────────────────────

export const BRAND_STORYTELLING = [
  {
    name: 'The Hero\'s Journey (Adapted for Brands)',
    structure: ['Ordinary World (who you were/where you started)', 'The Call (the problem you faced or saw in the market)', 'The Trials (what you tried that didn\'t work)', 'The Discovery (the breakthrough insight)', 'The Transformation (what changed)', 'Returning with the Gift (sharing it with your audience/customers)'],
    example: 'A SaaS founder story: struggling with manual spreadsheets → failed with existing tools → built own solution → launched product → sharing with other businesses who face the same problem.',
    bestFor: ['Founder stories', 'Brand origin content', 'Long-form YouTube videos', 'Podcast appearances'],
  },
  {
    name: 'The Customer as Hero',
    structure: ['The customer\'s struggle (before state)', 'The barrier they faced (what stopped them solving it alone)', 'Meeting the guide (your brand)', 'The plan (how your product/service works)', 'The call to action', 'Avoiding failure (what they risk without acting)', 'The transformation (after state)'],
    example: 'A fitness studio: "Sarah was exhausted, tried every diet, kept falling off track (struggle). She needed accountability but couldn\'t afford a PT (barrier). She joined [Brand] (guide). Our 30-day programme (plan). Book a trial today (CTA). Don\'t spend another year feeling the same (failure avoidance). Sarah lost 2 stone and ran her first 5K (transformation)."',
    bestFor: ['Case studies', 'Ad creative', 'Sales pages', 'Testimonial videos'],
  },
  {
    name: 'The "Why We Exist" Story',
    structure: ['The problem in the world that angered/saddened/inspired the founder', 'Why existing solutions were inadequate', 'The moment of decision to build something different', 'The values that drive every decision', 'The future world we\'re working toward'],
    example: '"We watched good businesses die because they couldn\'t afford agency fees. We believed every business deserves world-class marketing, not just funded startups. So we built this."',
    bestFor: ['About page', 'Pitch decks', 'Investor content', 'Brand videos'],
  },
]
