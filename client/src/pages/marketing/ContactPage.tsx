import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Mail,
  Clock,
  MapPin,
  Send,
  Twitter,
  Linkedin,
  HelpCircle,
  FileText,
  Activity,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Contact Page                                                        */
/* ------------------------------------------------------------------ */
export function ContactPage() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.name && formState.email && formState.message) {
      setStatus('success');
      setFormState({ name: '', email: '', subject: 'general', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const subjectOptions = [
    { value: 'general', label: t('marketing.contact.subjectGeneral', 'General Inquiry') },
    { value: 'sales', label: t('marketing.contact.subjectSales', 'Sales') },
    { value: 'support', label: t('marketing.contact.subjectSupport', 'Support') },
    { value: 'partnership', label: t('marketing.contact.subjectPartnership', 'Partnership') },
    { value: 'press', label: t('marketing.contact.subjectPress', 'Press') },
  ];

  const quickLinks = [
    {
      icon: HelpCircle,
      label: t('marketing.contact.quickFaq', 'FAQ'),
      to: '/faq',
      external: false,
    },
    {
      icon: FileText,
      label: t('marketing.contact.quickDocs', 'Documentation'),
      to: '#',
      external: false,
      comingSoon: true,
    },
    {
      icon: Activity,
      label: t('marketing.contact.quickStatus', 'Status Page'),
      to: '#',
      external: false,
      comingSoon: true,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-void)]" />
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 grid-pattern" />

        <div className="orb w-72 h-72 top-[10%] left-[5%] bg-[var(--color-accent-blue)]/20" />
        <div
          className="orb w-96 h-96 top-[50%] right-[10%] bg-[var(--color-accent-violet)]/15"
          style={{ animationDelay: '5s' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
            <MessageSquare size={14} className="text-[var(--color-accent-blue)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
              {t('marketing.contact.heroBadge', 'Get in Touch')}
            </span>
          </div>

          <h1 className="heading-lg mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-white block">{t('marketing.contact.heroTitle1', 'Get in')}</span>
            <span className="gradient-text-brand block">
              {t('marketing.contact.heroTitle2', 'Touch')}
            </span>
          </h1>

          <p
            className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            {t(
              'marketing.contact.heroSubtitle',
              "Have a question, partnership opportunity, or just want to say hi? We'd love to hear from you.",
            )}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 dot-pattern" />
        <div
          className="orb w-56 h-56 bottom-[20%] left-[10%] bg-[var(--color-accent-magenta)]/10"
          style={{ animationDelay: '7s' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left: Contact Form (60%) */}
            <div className="lg:col-span-3 animate-fade-in-up">
              <div className="glass-card p-8 sm:p-10 rounded-2xl">
                <h2 className="heading-md text-white mb-2">
                  {t('marketing.contact.formTitle', 'Send us a Message')}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                  {t(
                    'marketing.contact.formSubtitle',
                    "Fill out the form below and we'll get back to you as soon as possible.",
                  )}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                      >
                        {t('marketing.contact.nameLabel', 'Name')}
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder={t('marketing.contact.namePlaceholder', 'Your name')}
                        className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                      >
                        {t('marketing.contact.emailLabel', 'Email')}
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        placeholder={t('marketing.contact.emailPlaceholder', 'you@example.com')}
                        className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                    >
                      {t('marketing.contact.subjectLabel', 'Subject')}
                    </label>
                    <select
                      id="contact-subject"
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl glass text-sm text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all appearance-none cursor-pointer"
                    >
                      {subjectOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-[var(--color-surface)] text-white"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                    >
                      {t('marketing.contact.messageLabel', 'Message')}
                    </label>
                    <textarea
                      id="contact-message"
                      rows={6}
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      placeholder={t(
                        'marketing.contact.messagePlaceholder',
                        "Tell us what's on your mind...",
                      )}
                      className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all resize-none"
                      required
                    />
                  </div>

                  {/* Status messages */}
                  {status === 'success' && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      <p className="text-sm text-emerald-400">
                        {t(
                          'marketing.contact.successMessage',
                          "Message sent successfully! We'll get back to you within 24 hours.",
                        )}
                      </p>
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle size={16} className="text-red-400 shrink-0" />
                      <p className="text-sm text-red-400">
                        {t('marketing.contact.errorMessage', 'Please fill in all required fields.')}
                      </p>
                    </div>
                  )}

                  <button type="submit" className="btn-primary-glow w-full sm:w-auto">
                    {t('marketing.contact.sendButton', 'Send Message')}
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Info Cards (40%) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact info */}
              <div
                className="glass-card p-6 rounded-2xl animate-fade-in-up"
                style={{ animationDelay: '0.1s' }}
              >
                <h3 className="heading-sm text-white mb-5">
                  {t('marketing.contact.infoTitle', 'Contact Information')}
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/20 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-[var(--color-accent-blue)]" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">
                        {t('marketing.contact.emailTitle', 'Email')}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        hello@postcommander.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-violet)]/10 border border-[var(--color-accent-violet)]/20 flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-[var(--color-accent-violet)]" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">
                        {t('marketing.contact.responseTitle', 'Response Time')}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('marketing.contact.responseTime', 'Less than 24 hours')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-magenta)]/10 border border-[var(--color-accent-magenta)]/20 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-[var(--color-accent-magenta)]" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">
                        {t('marketing.contact.locationTitle', 'Office')}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('marketing.contact.location', 'Paris, France')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social */}
                <div className="mt-6 pt-5 border-t border-white/[0.06]">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                    {t('marketing.contact.socialTitle', 'Follow Us')}
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href="#"
                      className="p-2.5 rounded-lg glass hover:bg-white/[0.06] transition-all"
                      aria-label="Twitter"
                    >
                      <Twitter
                        size={16}
                        className="text-[var(--color-text-secondary)] hover:text-white"
                      />
                    </a>
                    <a
                      href="#"
                      className="p-2.5 rounded-lg glass hover:bg-white/[0.06] transition-all"
                      aria-label="LinkedIn"
                    >
                      <Linkedin
                        size={16}
                        className="text-[var(--color-text-secondary)] hover:text-white"
                      />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div
                className="glass-card p-6 rounded-2xl animate-fade-in-up"
                style={{ animationDelay: '0.2s' }}
              >
                <h3 className="heading-sm text-white mb-5">
                  {t('marketing.contact.quickLinksTitle', 'Quick Links')}
                </h3>
                <div className="space-y-3">
                  {quickLinks.map((link, i) => (
                    <Link
                      key={i}
                      to={link.to}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all group"
                    >
                      <link.icon
                        size={16}
                        className="text-[var(--color-text-muted)] group-hover:text-white transition-colors"
                      />
                      <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-white transition-colors flex-1">
                        {link.label}
                      </span>
                      {link.comingSoon && (
                        <span className="text-[10px] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full bg-white/[0.04]">
                          {t('marketing.contact.comingSoon', 'Soon')}
                        </span>
                      )}
                      <ArrowRight
                        size={14}
                        className="text-[var(--color-text-muted)] group-hover:text-white transition-colors"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
