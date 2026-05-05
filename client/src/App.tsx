import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

/* ---------- Lazy-loaded pages for code splitting ---------- */

// Auth pages
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));

// App pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const GeneratePage = lazy(() => import('@/pages/GeneratePage').then(m => ({ default: m.GeneratePage })));
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ViralLibraryPage = lazy(() => import('@/pages/ViralLibraryPage').then(m => ({ default: m.ViralLibraryPage })));
const HookGeneratorPage = lazy(() => import('@/pages/HookGeneratorPage').then(m => ({ default: m.HookGeneratorPage })));
const CarouselPage = lazy(() => import('@/pages/CarouselPage').then(m => ({ default: m.CarouselPage })));
const VideoScriptPage = lazy(() => import('@/pages/VideoScriptPage').then(m => ({ default: m.VideoScriptPage })));
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage').then(m => ({ default: m.TemplatesPage })));
const RepurposePage = lazy(() => import('@/pages/RepurposePage').then(m => ({ default: m.RepurposePage })));
const HashtagsPage = lazy(() => import('@/pages/HashtagsPage').then(m => ({ default: m.HashtagsPage })));
const StylesPage = lazy(() => import('@/pages/StylesPage').then(m => ({ default: m.StylesPage })));
const ImagesPage = lazy(() => import('@/pages/ImagesPage').then(m => ({ default: m.ImagesPage })));
const ABTestPage = lazy(() => import('@/pages/ABTestPage').then(m => ({ default: m.ABTestPage })));
const EngagementPage = lazy(() => import('@/pages/EngagementPage').then(m => ({ default: m.EngagementPage })));
const TrendingPage = lazy(() => import('@/pages/TrendingPage').then(m => ({ default: m.TrendingPage })));
const PillarsPage = lazy(() => import('@/pages/PillarsPage').then(m => ({ default: m.PillarsPage })));
const SimulatorPage = lazy(() => import('@/pages/SimulatorPage').then(m => ({ default: m.SimulatorPage })));
const BillingPage = lazy(() => import('@/pages/BillingPage').then(m => ({ default: m.BillingPage })));
const DeletedAccountsPage = lazy(() => import('@/pages/DeletedAccountsPage').then(m => ({ default: m.DeletedAccountsPage })));

// Marketing pages
const LandingPage = lazy(() => import('@/pages/marketing/LandingPage').then(m => ({ default: m.LandingPage })));
const PricingPage = lazy(() => import('@/pages/marketing/PricingPage').then(m => ({ default: m.PricingPage })));
const FeaturesPage = lazy(() => import('@/pages/marketing/FeaturesPage').then(m => ({ default: m.FeaturesPage })));
const FAQPage = lazy(() => import('@/pages/marketing/FAQPage').then(m => ({ default: m.FAQPage })));
const AboutPage = lazy(() => import('@/pages/marketing/AboutPage').then(m => ({ default: m.AboutPage })));
const UseCasesPage = lazy(() => import('@/pages/marketing/UseCasesPage').then(m => ({ default: m.UseCasesPage })));
const BlogPage = lazy(() => import('@/pages/marketing/BlogPage').then(m => ({ default: m.BlogPage })));
const ContactPage = lazy(() => import('@/pages/marketing/ContactPage').then(m => ({ default: m.ContactPage })));
const ChangelogPage = lazy(() => import('@/pages/marketing/ChangelogPage').then(m => ({ default: m.ChangelogPage })));
const TermsPage = lazy(() => import('@/pages/marketing/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/pages/marketing/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const DemoPage = lazy(() => import('@/pages/marketing/DemoPage').then(m => ({ default: m.DemoPage })));
const ComparePage = lazy(() => import('@/pages/marketing/ComparePage').then(m => ({ default: m.ComparePage })));
const IntegrationsPage = lazy(() => import('@/pages/marketing/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const TestimonialsPage = lazy(() => import('@/pages/marketing/TestimonialsPage').then(m => ({ default: m.TestimonialsPage })));
const PartnersPage = lazy(() => import('@/pages/marketing/PartnersPage').then(m => ({ default: m.PartnersPage })));
const EnterprisePage = lazy(() => import('@/pages/marketing/EnterprisePage').then(m => ({ default: m.EnterprisePage })));

/* ---------- Loading fallback ---------- */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[var(--color-accent-violet)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--color-text-muted)] font-display">Loading...</span>
      </div>
    </div>
  );
}

/* ---------- Protected Route ---------- */
function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

import { WorkspaceProvider } from '@/contexts/WorkspaceContext';

/* ---------- App Layout Wrapper ---------- */
function AppLayout() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </AppShell>
    </WorkspaceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Marketing / Public routes */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/use-cases" element={<UseCasesPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/enterprise" element={<EnterprisePage />} />
          </Route>

          {/* App routes */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="generate" element={<GeneratePage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="viral" element={<ViralLibraryPage />} />
              <Route path="hooks" element={<HookGeneratorPage />} />
              <Route path="carousel" element={<CarouselPage />} />
              <Route path="video-script" element={<VideoScriptPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="repurpose" element={<RepurposePage />} />
              <Route path="hashtags" element={<HashtagsPage />} />
              <Route path="styles" element={<StylesPage />} />
              <Route path="images" element={<ImagesPage />} />
              <Route path="ab-test" element={<ABTestPage />} />
              <Route path="engagement" element={<EngagementPage />} />
              <Route path="trending" element={<TrendingPage />} />
              <Route path="pillars" element={<PillarsPage />} />
              <Route path="simulator" element={<SimulatorPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="admin/deleted-accounts"
                element={
                  <AdminRoute>
                    <DeletedAccountsPage />
                  </AdminRoute>
                }
              />
            </Route>
          </Route>

          {/* Redirect old routes to /app/ prefix */}
          <Route path="/generate" element={<Navigate to="/app/generate" replace />} />
          <Route path="/history" element={<Navigate to="/app/history" replace />} />
          <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          <Route path="/viral" element={<Navigate to="/app/viral" replace />} />
          <Route path="/hooks" element={<Navigate to="/app/hooks" replace />} />
          <Route path="/carousel" element={<Navigate to="/app/carousel" replace />} />
          <Route path="/video-script" element={<Navigate to="/app/video-script" replace />} />
          <Route path="/templates" element={<Navigate to="/app/templates" replace />} />
          <Route path="/repurpose" element={<Navigate to="/app/repurpose" replace />} />
          <Route path="/hashtags" element={<Navigate to="/app/hashtags" replace />} />
          <Route path="/styles" element={<Navigate to="/app/styles" replace />} />
          <Route path="/images" element={<Navigate to="/app/images" replace />} />
          <Route path="/ab-test" element={<Navigate to="/app/ab-test" replace />} />
          <Route path="/engagement" element={<Navigate to="/app/engagement" replace />} />
          <Route path="/trending" element={<Navigate to="/app/trending" replace />} />
          <Route path="/pillars" element={<Navigate to="/app/pillars" replace />} />
          <Route path="/simulator" element={<Navigate to="/app/simulator" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
