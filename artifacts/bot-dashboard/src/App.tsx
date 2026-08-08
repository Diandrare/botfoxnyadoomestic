import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/layout/Shell';

// Pages
import Dashboard from '@/pages/Dashboard';
import Moderation from '@/pages/Moderation';
import Guilds from '@/pages/Guilds';
import AiChat from '@/pages/AiChat';
import BoostNotif from '@/pages/BoostNotif';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/moderation" component={Moderation} />
        <Route path="/guilds" component={Guilds} />
        <Route path="/ai-chat" component={AiChat} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
