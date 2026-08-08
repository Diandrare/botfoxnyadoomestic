import { useState } from "react";
import {
  useListAiConversations,
  useGetAiConversation,
  useDeleteAiConversation,
  getListAiConversationsQueryKey,
  getGetAiConversationQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Trash2, Bot, User, Clock, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function ChatViewer({ conversationId }: { conversationId: number | null }) {
  const { data, isLoading } = useGetAiConversation(conversationId || 0, {
    query: {
      enabled: !!conversationId,
      queryKey: getGetAiConversationQueryKey(conversationId || 0)
    }
  });

  if (!conversationId) return null;

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className="h-16 w-[70%] rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.messages?.length) {
    return <div className="text-center py-8 text-muted-foreground">No messages in this thread.</div>;
  }

  return (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      {data.messages.map((msg) => {
        const isBot = msg.role === 'assistant' || msg.role === 'system';
        return (
          <div key={msg.id} className={cn("flex gap-3", isBot ? "flex-row" : "flex-row-reverse")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
              isBot ? "bg-primary/20 border-primary text-primary" : "bg-muted border-border text-muted-foreground"
            )}>
              {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={cn(
              "rounded-lg px-4 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap",
              isBot ? "bg-card border border-border" : "bg-primary text-primary-foreground"
            )}>
              {msg.content}
              <div className={cn("text-[10px] mt-1 text-right opacity-70", isBot ? "" : "text-primary-foreground/70")}>
                {format(new Date(msg.createdAt), "HH:mm")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AiChat() {
  const { data: conversations, isLoading } = useListAiConversations();
  const deleteConvo = useDeleteAiConversation();
  const queryClient = useQueryClient();

  const [selectedConvoId, setSelectedConvoId] = useState<number | null>(null);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this AI conversation?")) return;

    deleteConvo.mutate({ id }, {
      onSuccess: () => {
        toast.success("Conversation deleted");
        queryClient.invalidateQueries({ queryKey: getListAiConversationsQueryKey() });
        if (selectedConvoId === id) setSelectedConvoId(null);
      },
      onError: () => toast.error("Failed to delete conversation")
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 font-mono flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          AI Chat Logs
        </h1>
        <p className="text-muted-foreground">Monitor bot interactions with Discord users.</p>
      </div>

      <Card className="bg-card/40 border-border">
        <CardHeader>
          <CardTitle>Conversation History</CardTitle>
          <CardDescription>Recent threads initiated by users in authorized guilds.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="grid gap-3">
              {conversations.map((convo) => (
                <div 
                  key={convo.id}
                  onClick={() => setSelectedConvoId(convo.id)}
                  className="flex items-center justify-between p-4 rounded-lg bg-background border border-border hover:border-primary/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {convo.title || "Untitled Conversation"}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                          <User className="w-3.5 h-3.5" />
                          {convo.discordUsername ? `@${convo.discordUsername}` : 'Unknown User'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(convo.createdAt), "MMM d, HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="h-8">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(convo.id, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No Chat Logs</h3>
              <p>No AI interactions have been recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedConvoId} onOpenChange={(open) => !open && setSelectedConvoId(null)}>
        <DialogContent className="max-w-2xl border-border bg-background sm:rounded-xl">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Thread Detail
            </DialogTitle>
          </DialogHeader>
          <ChatViewer conversationId={selectedConvoId} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
