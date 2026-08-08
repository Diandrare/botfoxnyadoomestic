import { useListBotGuilds } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Server, HardDrive } from "lucide-react";

export default function Guilds() {
  const { data: guilds, isLoading } = useListBotGuilds();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 font-mono flex items-center gap-3">
          <Server className="w-8 h-8 text-primary" />
          Guild Registry
        </h1>
        <p className="text-muted-foreground">Servers currently authorized and connected to the bot network.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : guilds && guilds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guilds.map((guild, i) => (
            <Card key={guild.id} className="bg-card/40 border-border hover:border-primary/40 transition-colors animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {guild.iconUrl ? (
                    <img 
                      src={guild.iconUrl} 
                      alt={guild.name} 
                      className="w-12 h-12 rounded-full border border-border/50 object-cover bg-background"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border/50">
                      <HardDrive className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate" title={guild.name}>{guild.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                      <Users className="w-4 h-4" />
                      <span className="font-mono">{guild.memberCount.toLocaleString()} members</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground font-mono">
                  <span>ID:</span>
                  <span className="truncate ml-2">{guild.id}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
          <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No Guilds Found</h3>
          <p>The bot is not currently connected to any servers.</p>
        </div>
      )}
    </div>
  );
}
