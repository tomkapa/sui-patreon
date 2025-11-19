'use client';

import { useEffect } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { formatTimestamp, formatAddress } from '@/lib/messaging/formatters';
import { Button } from '@/components/ui/button';
import { MessageSquare, RefreshCw } from 'lucide-react';

interface ChannelListProps {
  onChannelSelect: (channelId: string) => void;
}

export function ChannelList({ onChannelSelect }: ChannelListProps) {
  const { channels, isFetchingChannels, fetchChannels, isReady } = useMessaging();

  useEffect(() => {
    console.log('Channels updated:', channels);
  }, [channels]);

  // Auto-refresh channels every 5 seconds when component is mounted
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      fetchChannels();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [isReady, fetchChannels]);

  return (
    <div className="rounded-xl border bg-gradient-to-br from-card to-card/50 shadow-sm">
      <div className="flex items-center justify-between border-b p-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Your Channels</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {channels.length > 0 ? `${channels.length} active conversation${channels.length !== 1 ? 's' : ''}` : 'No conversations yet'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchChannels()}
          disabled={isFetchingChannels || !isReady}
          className="rounded-lg"
        >
          <RefreshCw className={`h-4 w-4 ${isFetchingChannels ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="p-6">
        {!isReady ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              Waiting for messaging client to initialize...
            </div>
          </div>
        ) : isFetchingChannels && channels.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading channels...
            </div>
          </div>
        ) : channels.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium mb-1">No channels yet</p>
            <p className="text-sm text-muted-foreground">
              Create one above to start messaging!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {channels.sort((a, b) => {
              const aTime = a.last_message ? Number(a.last_message.createdAtMs) : Number(a.created_at_ms);
              const bTime = b.last_message ? Number(b.last_message.createdAtMs) : Number(b.created_at_ms);
              return bTime - aTime;
            }).map((channel) => (
              <div
                key={channel.id.id}
                onClick={() => onChannelSelect(channel.id.id)}
                className="group cursor-pointer rounded-xl border bg-background/60 p-4 transition-all hover:bg-background hover:shadow-md hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Channel ID</p>
                    <p className="text-sm font-mono text-foreground/80 truncate">
                      {channel.id.id.slice(0, 16)}...{channel.id.id.slice(-4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
                      Active
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">Messages</p>
                    <p className="text-base font-semibold">{channel.messages_count}</p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">Members</p>
                    <p className="text-base font-semibold">{channel.auth.member_permissions.contents.length}</p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                    <p className="text-xs font-medium">{formatTimestamp(channel.created_at_ms)}</p>
                  </div>
                </div>

                {channel.last_message && (
                  <div className="rounded-lg bg-muted/30 p-3 border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Last Message</p>
                    <p className="text-sm line-clamp-2 mb-2">
                      {channel.last_message.text}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{formatAddress(channel.last_message.sender)}</span>
                      <span>•</span>
                      <span>{formatTimestamp(channel.last_message?.createdAtMs)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {channels.length > 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Auto-refreshes every 5 seconds
          </p>
        )}
      </div>
    </div>
  );
}

