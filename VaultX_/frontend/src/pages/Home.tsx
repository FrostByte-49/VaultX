// Home.tsx
import {
  Shield,
  Lock,
  Users,
  Clock,
  ArrowRight,
  CheckCircle,
  Server,
  Database,
  Github,
  Twitter,
  Linkedin,
  Globe,
  ChevronRight,
  Star,
  Award,
  Building,
  FileText,
  Image as ImageIcon,
  Music,
  Eye,
  Fingerprint,
  Wallet,
  Coins,
  UserCheck,
  Timer,
  ShieldCheck,
  Activity,
  Gift,
  Key,
  HardDrive,
  Zap,
  Mail,
  Users as UsersIcon,
  Award as AwardIcon,
  CircleCheckBig,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// SVG Icon Component
const PlayIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export default function HomePage() {
  const navigate = useNavigate();

  // Stats Data
  const stats = [
    {
      label: 'Assets Protected',
      value: '$2.4B+',
      icon: Shield,
      change: '+47%',
      changeType: 'positive',
    },
    { label: 'Active Vaults', value: '127K+', icon: Users, change: '+89%', changeType: 'positive' },
    {
      label: 'Succession Events',
      value: '1,892',
      icon: Clock,
      change: '100%',
      changeType: 'positive',
    },
    { label: 'Countries', value: '43+', icon: Globe, change: 'Expanding', changeType: 'neutral' },
  ];

  // Features Data
  const features = [
    {
      title: 'Military-Grade Encryption',
      description:
        'AES-256 encryption protects all your digital assets. Even we cannot access your data without your master key.',
      icon: Lock,
      gradient: 'from-blue-600 to-cyan-500',
      lightGradient: 'from-blue-500 to-cyan-400',
      stats: '256-Bit Encryption',
      detail: 'Architecture',
    },
    {
      title: 'Dead-Man Switch Protocol',
      description:
        'Set inactivity periods and automated verification flows. Your assets are released only after multiple failed check-ins.',
      icon: Timer,
      gradient: 'from-purple-600 to-pink-500',
      lightGradient: 'from-purple-500 to-pink-400',
      stats: 'Multi-Step Verification',
      detail: 'Grace Period',
    },
    {
      title: 'Role-Based Nominee Access',
      description:
        'Granular permissions for each nominee. Control exactly what each person can access and when.',
      icon: Users,
      gradient: 'from-amber-500 to-orange-500',
      lightGradient: 'from-amber-400 to-orange-400',
      stats: 'Custom Permissions',
      detail: 'Time-Locked Access',
    },
    {
      title: 'Cryptocurrency Support',
      description:
        'Secure storage for wallet private keys, seed phrases, and exchange credentials. Compatible with 50+ chains.',
      icon: Coins,
      gradient: 'from-emerald-500 to-teal-500',
      lightGradient: 'from-emerald-400 to-teal-400',
      stats: '50+ Blockchains',
      detail: 'Hardware Wallet',
    },
    {
      title: 'Digital Asset Vault',
      description:
        'Store passwords, documents, photos, and subscription credentials. Everything organized and searchable.',
      icon: Database,
      gradient: 'from-red-500 to-rose-500',
      lightGradient: 'from-red-400 to-rose-400',
      stats: 'Unlimited Storage',
      detail: 'File Preview Support',
    },
    {
      title: 'Audit Trail',
      description:
        'Complete logs of all access requests and asset releases. Full transparency for estate execution.',
      icon: Activity,
      gradient: 'from-indigo-500 to-blue-500',
      lightGradient: 'from-indigo-400 to-blue-400',
      stats: 'Immutable Logs',
      detail: 'Real-Time Alerts',
    },
  ];

  // How It Works Steps
  const steps = [
    {
      title: 'Create Your Vault',
      description:
        'Sign up and create your encrypted vault. Your master key is generated locally and never leaves your device.',
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Add Digital Assets',
      description:
        'Store passwords, crypto wallets, documents, and subscription credentials. All encrypted with AES-256.',
      icon: Database,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Assign Nominees',
      description:
        'Add trusted individuals and set granular permissions. Control exactly what each person can access.',
      icon: UserCheck,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Configure Dead-Man Switch',
      description:
        'Set inactivity periods and verification methods. Multiple checks prevent premature release.',
      icon: Timer,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Peace of Mind',
      description:
        'Go about your life knowing your digital legacy is secure. Your nominees will receive access when the time comes.',
      icon: ShieldCheck,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  // Asset Categories
  const categories = [
    { name: 'Passwords', icon: Key, count: 'Unlimited' },
    { name: 'Crypto Wallets', icon: Wallet, count: '50+ Chains' },
    { name: 'Documents', icon: FileText, count: 'All Formats' },
    { name: 'Photos', icon: ImageIcon, count: 'High-Res' },
    { name: 'Music/Media', icon: Music, count: 'Streaming' },
    { name: 'Subscriptions', icon: Gift, count: 'Recurring' },
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Crypto Investor',
      content:
        "As someone with significant crypto assets, VaultX gives me peace of mind that my family won't lose access if something happens to me.",
      avatar: 'SC',
      rating: 5,
    },
    {
      name: 'Michael Rodriguez',
      role: 'Digital Creator',
      content:
        'My entire business is online. VaultX ensures my wife can take over my accounts and continue generating income.',
      avatar: 'MR',
      rating: 5,
    },
    {
      name: 'Dr. James Wilson',
      role: 'Estate Attorney',
      content:
        'Finally, a solution for digital assets. I now recommend VaultX to all my clients with online presence.',
      avatar: 'JW',
      rating: 5,
    },
  ];

  // Pricing Plans
  const plans = [
    {
      name: 'Essential',
      price: '$9',
      period: 'month',
      description: 'Perfect for individuals starting their digital legacy',
      features: [
        'Encrypted vault storage',
        'Up to 5 nominees',
        'Basic dead-man switch',
        '100MB storage',
        'Email support',
        'Basic audit logs',
      ],
      cta: 'Start Free Trial',
      popular: false,
      icon: Shield,
    },
    {
      name: 'Professional',
      price: '$19',
      period: 'month',
      description: 'For serious asset holders with diverse portfolios',
      features: [
        'Everything in Essential',
        'Up to 15 nominees',
        'Advanced dead-man switch',
        '10GB storage',
        'Priority support',
        'Crypto wallet support',
        'Full audit trails',
        'API access',
      ],
      cta: 'Start Free Trial',
      popular: true,
      icon: AwardIcon,
    },
    {
      name: 'Family',
      price: '$29',
      period: 'month',
      description: "Protect your entire family's digital future",
      features: [
        'Everything in Professional',
        'Up to 30 nominees',
        'Multiple vaults',
        '100GB storage',
        '24/7 phone support',
        'Legal document templates',
        'Family dashboard',
        'Emergency contact',
      ],
      cta: 'Start Free Trial',
      popular: false,
      icon: UsersIcon,
    },
  ];

  // FAQ Data
  const faqs = [
    {
      question: 'How does the dead-man switch work?',
      answer:
        "You set an inactivity period (e.g., 6 months). If you don't log in during that time, we begin a verification process. We send multiple alerts via email and SMS. After a grace period with no response, we initiate the release protocol to your nominees.",
    },
    {
      question: 'Can VaultX access my data?',
      answer:
        'No. All encryption happens on your device. Your master key is never sent to our servers. We store only encrypted data, making it impossible for us or anyone else to access without your key.',
    },
    {
      question: 'What happens if I regain access after the switch triggers?',
      answer:
        'The release process includes a grace period (7-30 days) where you can cancel the release by simply logging in. Multiple verification steps prevent accidental activation.',
    },
    {
      question: 'How do nominees prove their identity?',
      answer:
        'Nominees receive a secure invitation link. They must verify their identity through email, SMS, and optionally 2FA before accessing any assets.',
    },
    {
      question: 'What types of assets can I store?',
      answer:
        'You can store passwords, crypto wallet keys, documents, photos, subscription credentials, and any other digital assets. All files are encrypted before upload.',
    },
    {
      question: 'Is VaultX legally binding?',
      answer:
        'While VaultX provides secure transfer mechanisms, we recommend consulting with an estate attorney to ensure your digital inheritance plan complies with local laws.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">

      <main className="relative">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
          {/* Background Gradients */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/10 dark:border-primary/5 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-purple-500/10 dark:border-purple-500/5 rounded-full" />
          </div>

          <div className="relative max-w-7xl mx-auto py-32 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/80 backdrop-blur-sm border border-border rounded-full mb-8 animate-fadeIn">
              <Fingerprint className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                The Digital Inheritance Protocol
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 animate-fadeIn">
              <span className="text-foreground">Your Digital Life</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-900 to-pink-600 bg-clip-text text-transparent">
                Doesn't Die With You
              </span>
            </h1>

            {/* Subheadline */} 
            <p className="text-xl md:text-2xl text-muted-foreground/90 dark:text-muted-foreground max-w-4xl mx-auto mb-12 animate-fadeIn capitalize">
              Secure, automated transfer of your digital assets to trusted nominees... <br /> Passwords,
              crypto, documents protected by military-grade encryption...
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fadeIn">
              <button
                onClick={() => navigate('/signup')}
                className="group px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 text-lg"
              >
                Create Your Vault
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/demo')}
                className="px-8 py-4 border-2 border-border bg-card/80 backdrop-blur-sm text-foreground font-semibold rounded-xl hover:bg-accent transition-all hover:scale-105 flex items-center justify-center gap-2 text-lg"
              >
                <Eye className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fadeIn">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="p-6 bg-card/60 backdrop-blur-sm border border-border rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                    <div
                      className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                        stat.changeType === 'positive'
                          ? 'bg-green-500/10 text-green-500 dark:text-green-400'
                          : 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                      }`}
                    >
                      {stat.change}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-32 bg-muted/50 dark:bg-muted/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Built Like A
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {' '}
                  Digital Fortress
                </span>
              </h2>
              <p className="text-xl text-muted-foreground capitalize">
                Every feature is designed with one goal: <br /> ensuring your digital legacy reaches the
                right hands, securely.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative p-8 bg-card border border-border rounded-2xl hover:shadow-xl transition-all hover:-translate-y-2"
                  >
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} dark:opacity-0 opacity-5 rounded-2xl transition-opacity group-hover:opacity-10 dark:group-hover:opacity-5`} />

                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`} >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-primary/80 text-primary dark:text-primary-foreground/90 rounded-full text-sm font-medium">
                        {feature.stats}
                      </span>
                      <span className="px-3 py-1 bg-muted/90 text-muted-foreground rounded-full text-sm">
                        {feature.detail}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Asset Categories */}
            <div className="mt-20 p-10 bg-card border border-border rounded-3xl">
              <h3 className="text-2xl font-bold mb-10 text-center text-foreground">
                Everything You Can Store
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {categories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <div key={index} className="text-center group cursor-default">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-medium text-foreground mb-1">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{category.count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl  font-bold mb-6 text-foreground">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Steps
                </span>{' '}
                To Digital Peace Of Mind
              </h2>
              <p className="text-xl text-muted-foreground capitalize">
                Setting up your digital inheritance takes minutes. We handle the complex security so
                you don't have to
              </p>
            </div>

            <div className="relative max-w-7xl mx-auto">
              {/* Steps Grid */}
              <div className="grid md:grid-cols-5 gap-6">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="relative text-center">
                      {/* Step Number */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold flex items-center justify-center">
                        {index + 1}
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-20 h-20 mx-auto ${step.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className={`w-10 h-10 ${step.color}`} />
                      </div>

                      {/* Content */}
                      <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                      {/* <p className="text-sm text-muted-foreground">{step.description}</p> */}

                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                        <ChevronRight className="hidden md:block w-6 h-6 text-muted-foreground absolute -right-3 top-10" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demo Preview */}
            <div className="mt-32 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8 md:p-12 overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h3 className="text-3xl font-bold mb-4 text-foreground">See It In Action</h3>
                    <p className="text-muted-foreground mb-8 text-lg leading-relaxed capitalize">
                      Watch how easy it is to secure your digital legacy. From vault creation to
                      nominee assignment, all in under 5 minutes.
                    </p>
                    <button
                      onClick={() => navigate('/demo')}
                      className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all hover:scale-105 hover:shadow-lg flex items-center gap-3 w-fit"
                    >
                      Watch Demo Video
                      <PlayIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur-2xl opacity-20" />
                    <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/10 border border-border rounded-2xl p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                      </div>
                      <div className="space-y-4">
                        <div className="h-10 bg-muted rounded-lg animate-pulse" />
                        <div
                          className="h-10 bg-muted rounded-lg animate-pulse"
                          style={{ width: '80%' }}
                        />
                        <div
                          className="h-10 bg-muted rounded-lg animate-pulse"
                          style={{ width: '60%' }}
                        />
                        <div
                          className="h-10 bg-muted rounded-lg animate-pulse"
                          style={{ width: '70%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Showcase  */}
        <section className="py-24 md:py-32 bg-muted/50 dark:bg-muted/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Zero-Knowledge
                  </span>{' '}
                  Architecture
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed capitalize">
                  Your data is encrypted on your device before it ever reaches our servers. We never
                  see your passwords, private keys, or master password.
                </p>
                <ul className="space-y-4 capitalize">
                  {[
                    'AES-256-GCM encryption for all data',
                    'Master key derived locally via PBKDF2',
                    'Zero plaintext storage on servers',
                    'Multi-factor authentication support',
                    'Hardware security module ready',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-foreground">
                      <CircleCheckBig className="w-6 h-6 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-3xl blur-3xl opacity-20" />
                <div className="relative bg-card border border-border rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Lock className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-lg">Encryption Layer</h4>
                      <p className="text-sm text-muted-foreground">Your Data, Your Key Only</p>
                    </div>
                  </div>
                  <div className="space-y-4 font-mono text-sm">
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <code className="text-primary">encryptedData: AES-256-GCM(</code>
                    </div>
                    <div className="p-4 bg-muted rounded-lg border border-border ml-6">
                      <code className="text-purple-500 dark:text-purple-400">
                        masterKey: PBKDF2(password + salt)
                      </code>
                    </div>
                    <div className="p-4 bg-muted rounded-lg border border-border ml-12">
                      <code className="text-green-500 dark:text-green-400">
                        → Never leaves your device
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Trusted By
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {' '}
                  Thousands
                </span>
              </h2>
              <p className="text-xl text-muted-foreground capitalize">
                From crypto investors to estate planners, <br /> VaultX is the chosen solution for digital
                legacy protection
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="p-8 bg-card border border-border rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-lg">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">"{testimonial.content}"</p>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="mt-20 flex flex-wrap justify-center gap-12 items-center opacity-60">
              <Building className="w-10 h-10 text-muted-foreground" />
              <Award className="w-10 h-10 text-muted-foreground" />
              <Shield className="w-10 h-10 text-muted-foreground" />
              <Globe className="w-10 h-10 text-muted-foreground" />
              <Server className="w-10 h-10 text-muted-foreground" />
              <HardDrive className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 md:py-32 bg-muted/50 dark:bg-muted/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Simple,
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {' '}
                  Transparent
                </span>{' '}
                Pricing
              </h2>
              <p className="text-xl text-muted-foreground capitalize">
                Start with a 14-day free trial. No credit card required.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={index}
                    className={`relative p-8 rounded-2xl transition-all hover:-translate-y-2 ${
                      plan.popular
                        ? 'bg-gradient-to-br from-primary/10 via-card to-purple-500/10 border-2 border-primary shadow-xl scale-105 lg:scale-110 z-10'
                        : 'bg-card border border-border hover:shadow-xl'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-full font-medium shadow-lg flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Most Popular
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <p className="text-muted-foreground text-sm capitalize">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground capitalize">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => navigate('/signup')}
                      className={`w-full py-3 rounded-xl font-medium transition-all hover:scale-105 ${
                        plan.popular
                          ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg'
                          : 'border-2 border-border bg-card text-foreground hover:bg-accent'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 md:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Frequently Asked
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {' '}
                  Questions
                </span>
              </h2>
              <p className="text-xl text-muted-foreground capitalize">
                Everything you need to know about digital inheritance
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all"
                >
                  <details className="group">
                    <summary className="p-6 cursor-pointer list-none flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <h3 className="text-lg font-medium text-foreground pr-8">{faq.question}</h3>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-6 pb-6 pt-2 border-t border-border">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Your Digital Legacy
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Deserves Protection
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed capitalize">
              Join thousands who've secured their digital assets for future generations. Start your
              14-day free trial today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/signup')}
                className="group px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 text-lg"
              >
                Create Your Vault
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 border-2 border-border bg-card/80 backdrop-blur-sm text-foreground font-semibold rounded-xl hover:bg-accent transition-all hover:scale-105 flex items-center justify-center gap-2 text-lg"
              >
                <Mail className="w-5 h-5" />
                Contact Sales
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                No Credit Card Required
              </span>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Cancel Anytime
              </span>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                256-Bit Encryption
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
              {/* Brand Column */}
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    Vault<span className="text-primary">X</span>
                  </span>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Secure your digital legacy. Protect what matters most for future generations.
                </p>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="font-bold mb-4 text-foreground">Product</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#features"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#security"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Security
                    </a>
                  </li>
                  <li>
                    <a
                      href="/demo"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Demo
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources Links */}
              <div>
                <h4 className="font-bold mb-4 text-foreground">Resources</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="/blog"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="/guides"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Guides
                    </a>
                  </li>
                  <li>
                    <a
                      href="/help"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a
                      href="/api"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      API
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className="font-bold mb-4 text-foreground">Company</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="/about"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="/careers"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Careers
                    </a>
                  </li>
                  <li>
                    <a
                      href="/press"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Press
                    </a>
                  </li>
                  <li>
                    <a
                      href="/contact"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h4 className="font-bold mb-4 text-foreground">Legal</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="/privacy"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href="/cookies"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-border">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} VaultX. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <a href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                  <a href="/cookies" className="hover:text-foreground transition-colors">
                    Cookie Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
