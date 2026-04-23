"use client";

import { useState } from "react";
import { Users, UserPlus, UserCheck, X, Send, Loader2 } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface PendingRequest {
  id: string;
  sender: Friend;
}

interface Props {
  friends: Friend[];
  pendingRequests: PendingRequest[];
}

export default function ProfileFriends({ friends: initialFriends, pendingRequests: initialRequests }: Props) {
  const [friends, setFriends] = useState(initialFriends);
  const [requests, setRequests] = useState(initialRequests);
  const [addEmail, setAddEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send request");
      setMessage({ type: "success", text: `Friend request sent to ${addEmail}!` });
      setAddEmail("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, action: "accept" | "decline", sender: Friend) => {
    try {
      await fetch("/api/friends/request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (action === "accept") {
        setFriends((prev) => [...prev, sender]);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to respond to request" });
    }
  };

  return (
    <div className="glass-card p-5">
      <h2 className="font-semibold mb-5 flex items-center gap-2">
        <Users className="w-4.5 h-4.5 text-muted-foreground" />
        Friends
      </h2>

      {/* Add friend form */}
      <form onSubmit={sendRequest} className="flex gap-2 mb-5">
        <input
          type="email"
          placeholder="Add a friend by email..."
          value={addEmail}
          onChange={(e) => setAddEmail(e.target.value)}
          className="flex-1 bg-accent border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={loading || !addEmail.trim()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Add
        </button>
      </form>

      {message && (
        <p className={cn("text-xs mb-4 px-3 py-2 rounded-lg", message.type === "error" ? "text-red-400 bg-red-400/10" : "text-emerald-400 bg-emerald-400/10")}>
          {message.text}
        </p>
      )}

      {/* Pending requests */}
      {requests.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Pending Requests ({requests.length})
          </p>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-accent rounded-xl">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-400">
                  {getInitials(req.sender.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.sender.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{req.sender.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => respondToRequest(req.id, "accept", req.sender)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg font-medium transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => respondToRequest(req.id, "decline", req.sender)}
                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friend list */}
      {friends.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No friends yet. Add a classmate to study together!
        </div>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-indigo-400">{getInitials(friend.name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{friend.name}</p>
                <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
              </div>
              <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
