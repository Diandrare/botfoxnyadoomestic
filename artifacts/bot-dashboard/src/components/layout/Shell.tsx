import { Link, useLocation } from "wouter";
import { Activity, Shield, Users, MessageSquare, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: Activity },
  { name: "Moderation", href: "/moderation", icon: Shield },
  { name: "Guilds", href: "/guilds", icon: Users },
  { name: "AI Chat", href: "/ai-chat", icon: MessageSquare },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-[100dvh] bg-background text-foreground dark">
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Terminal className="w-5 h-5 text-primary mr-2" />
          <span className="font-bold font-mono tracking-tight text-lg">BOT_CTRL</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}>
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>SYSTEM</span>
          <span className="text-green-500 font-bold">ONLINE</span>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-background/95">
        {children}
      </main>
    </div>
  );
}
