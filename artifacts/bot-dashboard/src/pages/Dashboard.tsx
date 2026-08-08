import { useState } from "react";
import {
  useGetBotStatus,
  useSetBotActivity,
  useGetBotRotation,
  useSetBotRotation,
  useListModerationActions,
  getGetBotStatusQueryKey,
  getGetBotRotationQueryKey,
} from "@workspace/api-client-react";
import type { RotationItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Server, Users, Clock, ShieldAlert, Zap, Terminal, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

function formatUptime(value: number | null) {
  if (!value) return "0m";
  const seconds = value > 1000000000 ? Math.floor(value / 1000) : value;
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const ACTIVITY_TYPES = [
  { value: "playing", label: "🎮 Playing" },
  { value: "watching", label: "👀 Watching" },
  { value: "listening", label: "🎵 Listening" },
  { value: "streaming", label: "🔴 Streaming" },
] as const;

export default function Dashboard() {
  const { data: status, isLoading: statusLoading } = useGetBotStatus();
  const { data: recentMods, isLoading: modsLoading } = useListModerationActions({ limit: 5 });
  const { data: rotation, isLoading: rotationLoading } = useGetBotRotation();
  const queryClient = useQueryClient();
  const setActivity = useSetBotActivity();
  const setRotation = useSetBotRotation();

  // Manual tab state
  const [activityType, setActivityType] = useState<"playing" | "watching" | "listening" | "streaming">("playing");
  const [activityName, setActivityName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");

  // Rotation tab state — synced from server when data loads
  const [rotItems, setRotItems] = useState<RotationItem[]>([]);
  const [rotEnabled, setRotEnabled] = useState(false);
  const [rotInterval, setRotInterval] = useState(5);
  const [rotInitialized, setRotInitialized] = useState(false);

  // Initialize local rotation state once data arrives
  if (rotation && !rotInitialized) {
    setRotItems(rotation.items as RotationItem[]);
    setRotEnabled(rotation.enabled);
    setRotInterval(rotation.intervalSeconds);
    setRotInitialized(true);
  }

  // New item form
  const [newType, setNewType] = useState<"playing" | "watching" | "listening" | "streaming">("playing");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleUpdateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) return;
    setActivity.mutate(
      { data: { type: activityType, name: activityName, url: activityType === "streaming" ? streamUrl || null : null } },
      {
        onSuccess: () => {
          toast.success("Activity updated");
          queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
          setActivityName("");
          setStreamUrl("");
        },
        onError: () => toast.error("Failed to update activity"),
      }
    );
  };

  const addRotItem = () => {
    if (!newName.trim()) return;
    setRotItems(prev => [
      ...prev,
      { type: newType, name: newName.trim(), url: newType === "streaming" ? (newUrl.trim() || null) : null },
    ]);
    setNewName("");
    setNewUrl("");
  };

  const removeRotItem = (i: number) => {
    setRotItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const saveRotation = () => {
    setRotation.mutate(
      { data: { enabled: rotEnabled, intervalSeconds: rotInterval, items: rotItems } },
      {
        onSuccess: () => {
          toast.success(rotEnabled ? `Rotation started — ${rotItems.length} items, every ${rotInterval}s` : "Rotation stopped");
          queryClient.invalidateQueries({ queryKey: getGetBotRotationQueryKey() });
        },
        onError: () => toast.error("Failed to save rotation"),
      }
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 font-mono">System Overview</h1>
          <p className="text-muted-foreground">Real-time metrics and global bot controls.</p>
        </div>
        {statusLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <Badge variant={status?.online ? "default" : "destructive"} className="px-3 py-1 text-sm font-mono uppercase">
            {status?.online ? (
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> ONLINE</span>
            ) : (
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> OFFLINE</span>
            )}
          </Badge>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold font-mono text-primary">{formatUptime(status?.uptime ?? null)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold font-mono text-primary">{status?.guildCount?.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold font-mono text-primary">{status?.memberCount?.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? <Skeleton className="h-8 w-full" /> : (
              <div className="text-sm font-medium">
                {status?.activityType && status?.activityName ? (
                  <span className="capitalize">{status.activityType} <span className="text-muted-foreground">{status.activityName}</span></span>
                ) : (
                  <span className="text-muted-foreground italic">Idle</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent moderation */}
        <Card className="lg:col-span-2 bg-card/30 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Recent Moderation Actions
            </CardTitle>
            <CardDescription>The 5 most recent automated or manual moderation actions.</CardDescription>
          </CardHeader>
          <CardContent>
            {modsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentMods && recentMods.length > 0 ? (
              <div className="space-y-4">
                {recentMods.map((mod, i) => (
                  <div key={mod.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
                    <div className="flex items-center gap-4">
                      <Badge variant={
                        mod.action === 'ban' ? 'destructive' :
                        mod.action === 'kick' ? 'destructive' :
                        mod.action === 'warn' ? 'secondary' : 'default'
                      } className="w-16 justify-center uppercase font-mono text-[10px]">
                        {mod.action}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          <span className="text-primary">@{mod.username}</span>
                          <span className="text-muted-foreground text-xs ml-2">in guild {mod.guildId}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-[300px] truncate">
                          Reason: {mod.reason || 'None provided'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(mod.createdAt), "MMM d, HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-md border border-dashed border-border">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent actions found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Presence Control with tabs */}
        <Card className="bg-card/30 border-border h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Presence Control
            </CardTitle>
            <CardDescription>Set a status manually or configure auto-rotation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
                <TabsTrigger value="rotate" className="flex-1 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Auto Rotate
                </TabsTrigger>
              </TabsList>

              {/* ── Manual tab ── */}
              <TabsContent value="manual">
                <form onSubmit={handleUpdateActivity} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Activity Type</Label>
                    <NativeSelect
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as any)}
                      disabled={setActivity.isPending}
                    >
                      {ACTIVITY_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="space-y-2">
                    <Label>Activity Name</Label>
                    <Input
                      placeholder="e.g. commands | /help"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                      disabled={setActivity.isPending}
                      className="font-mono text-sm"
                    />
                  </div>
                  {activityType === "streaming" && (
                    <div className="space-y-2">
                      <Label>Stream URL</Label>
                      <Input
                        placeholder="https://twitch.tv/..."
                        value={streamUrl}
                        onChange={(e) => setStreamUrl(e.target.value)}
                        disabled={setActivity.isPending}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={setActivity.isPending || !activityName.trim()}>
                    {setActivity.isPending ? "Updating..." : "Deploy Presence"}
                  </Button>
                </form>
              </TabsContent>

              {/* ── Auto Rotate tab ── */}
              <TabsContent value="rotate">
                {rotationLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Enable toggle + interval */}
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50">
                      <div>
                        <p className="text-sm font-medium">Auto Rotate</p>
                        <p className="text-xs text-muted-foreground">Cycle through statuses automatically</p>
                      </div>
                      <Switch
                        checked={rotEnabled}
                        onCheckedChange={setRotEnabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Interval (seconds)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={3600}
                          value={rotInterval}
                          onChange={(e) => setRotInterval(Math.max(1, Number(e.target.value)))}
                          className="font-mono text-sm w-24"
                        />
                        <span className="text-xs text-muted-foreground">seconds per status</span>
                      </div>
                    </div>

                    {/* Item list */}
                    <div className="space-y-2">
                      <Label>Status Items ({rotItems.length})</Label>
                      {rotItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">No items — add one below.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {rotItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/30 border border-border/40">
                              <span className="text-xs font-mono text-primary w-16 shrink-0 capitalize">{item.type}</span>
                              <span className="text-xs truncate flex-1">{item.name}</span>
                              <button
                                onClick={() => removeRotItem(i)}
                                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add item form */}
                    <div className="space-y-2 p-3 rounded-md border border-dashed border-border/60">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Item</p>
                      <NativeSelect
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                      >
                        {ACTIVITY_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </NativeSelect>
                      <Input
                        placeholder="Status text..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRotItem())}
                        className="font-mono text-sm"
                      />
                      {newType === "streaming" && (
                        <Input
                          placeholder="https://twitch.tv/..."
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          className="font-mono text-sm"
                        />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={addRotItem}
                        disabled={!newName.trim()}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                      </Button>
                    </div>

                    <Button
                      className="w-full"
                      onClick={saveRotation}
                      disabled={setRotation.isPending || (rotEnabled && rotItems.length === 0)}
                    >
                      {setRotation.isPending ? "Saving..." : rotEnabled ? "▶ Start Rotation" : "Save"}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
