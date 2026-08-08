import { useState } from "react";
import {
  useListModerationActions,
  useGetModerationStats,
  useDeleteModerationAction,
  getListModerationActionsQueryKey,
  getGetModerationStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Trash2, Ban, UserMinus, AlertTriangle, MicOff, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Moderation() {
  const [filterAction, setFilterAction] = useState("");
  const [filterGuild, setFilterGuild] = useState("");
  
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useGetModerationStats();
  
  const { data: actions, isLoading: actionsLoading } = useListModerationActions({
    ...(filterAction && { action: filterAction }),
    ...(filterGuild && { guildId: filterGuild })
  });

  const deleteAction = useDeleteModerationAction();

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this log entry?")) return;
    
    deleteAction.mutate({ id }, {
      onSuccess: () => {
        toast.success("Log entry deleted");
        queryClient.invalidateQueries({ queryKey: getListModerationActionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetModerationStatsQueryKey() });
      },
      onError: () => toast.error("Failed to delete log entry")
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 font-mono flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Moderation Logs
        </h1>
        <p className="text-muted-foreground">Comprehensive audit trail of all automated and manual enforcements.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Bans", count: stats?.bans, icon: Ban, color: "text-red-500" },
          { title: "Kicks", count: stats?.kicks, icon: UserMinus, color: "text-orange-500" },
          { title: "Warns", count: stats?.warns, icon: AlertTriangle, color: "text-yellow-500" },
          { title: "Mutes", count: stats?.mutes, icon: MicOff, color: "text-blue-500" }
        ].map((stat, i) => (
          <Card key={stat.title} className="bg-card/50 backdrop-blur border-border overflow-hidden relative">
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${stat.color}`}>
              <stat.icon className="w-16 h-16" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-3xl font-bold font-mono">{stat.count?.toLocaleString() || 0}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/30 border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle className="text-lg">Audit Log</CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter by Guild ID..." 
                  className="pl-9 bg-background font-mono text-xs"
                  value={filterGuild}
                  onChange={(e) => setFilterGuild(e.target.value)}
                />
              </div>
              <NativeSelect 
                className="w-full md:w-32 bg-background font-mono text-xs uppercase"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="">ALL ACTIONS</option>
                <option value="ban">BAN</option>
                <option value="kick">KICK</option>
                <option value="warn">WARN</option>
                <option value="mute">MUTE</option>
              </NativeSelect>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {actionsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-mono text-xs w-[100px]">TYPE</TableHead>
                    <TableHead className="font-mono text-xs">USER</TableHead>
                    <TableHead className="font-mono text-xs">MODERATOR</TableHead>
                    <TableHead className="font-mono text-xs">REASON</TableHead>
                    <TableHead className="font-mono text-xs">GUILD ID</TableHead>
                    <TableHead className="font-mono text-xs">DATE</TableHead>
                    <TableHead className="text-right w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No moderation actions found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    actions?.map((action) => (
                      <TableRow key={action.id} className="group hover:bg-muted/20">
                        <TableCell>
                          <Badge variant={
                            action.action === 'ban' ? 'destructive' : 
                            action.action === 'kick' ? 'destructive' : 
                            action.action === 'warn' ? 'secondary' : 'default'
                          } className="w-16 justify-center uppercase font-mono text-[10px]">
                            {action.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          @{action.username}
                          <div className="text-[10px] text-muted-foreground font-mono">{action.userId}</div>
                        </TableCell>
                        <TableCell>
                          @{action.moderatorName}
                          <div className="text-[10px] text-muted-foreground font-mono">{action.moderatorId}</div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm" title={action.reason || "None"}>
                          {action.reason || <span className="text-muted-foreground italic">No reason provided</span>}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {action.guildId}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(action.createdAt), "MMM d, yyyy")}
                          <div className="text-xs">{format(new Date(action.createdAt), "HH:mm:ss")}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(action.id)}
                            disabled={deleteAction.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
