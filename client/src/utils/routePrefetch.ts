export const prefetchRoute = (path: string) => {
  const normalizedPath = path.replace('/app', '') || '/dashboard';
  
  switch (normalizedPath) {
    case '/dashboard':
      import('@/pages/DashboardPage');
      break;
    case '/generate':
      import('@/pages/GeneratePage');
      break;
    case '/history':
      import('@/pages/HistoryPage');
      break;
    case '/calendar':
      import('@/pages/CalendarPage');
      break;
    case '/viral':
      import('@/pages/ViralLibraryPage');
      break;
    case '/hooks':
      import('@/pages/HookGeneratorPage');
      break;
    case '/carousel':
      import('@/pages/CarouselPage');
      break;
    case '/video-script':
      import('@/pages/VideoScriptPage');
      break;
    case '/templates':
      import('@/pages/TemplatesPage');
      break;
    case '/repurpose':
      import('@/pages/RepurposePage');
      break;
    case '/hashtags':
      import('@/pages/HashtagsPage');
      break;
    case '/styles':
      import('@/pages/StylesPage');
      break;
    case '/images':
      import('@/pages/ImagesPage');
      break;
    case '/ab-test':
      import('@/pages/ABTestPage');
      break;
    case '/engagement':
      import('@/pages/EngagementPage');
      break;
    case '/trending':
      import('@/pages/TrendingPage');
      break;
    case '/pillars':
      import('@/pages/PillarsPage');
      break;
    case '/simulator':
      import('@/pages/SimulatorPage');
      break;
    case '/billing':
      import('@/pages/BillingPage');
      break;
    case '/settings':
      import('@/pages/SettingsPage');
      break;
    case '/admin/deleted-accounts':
      import('@/pages/DeletedAccountsPage');
      break;
  }
};
