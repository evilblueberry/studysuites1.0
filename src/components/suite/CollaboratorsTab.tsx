"use client";

import { useState } from "react";
import { Users, UserPlus, Crown, Edit3, Eye, X, Loader2, Send } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface Collaborator {
  userId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface Props {
  suite: any;
  currentUserId: string;
  isOwner: boolean;
}

const ROLE_ICONS = {
  OWNER: Crown,
  EDITOR: Edit3,
  VIEWER: Eye,
};

const ROLE_LABELS = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

const ROLE_COLORS = {
  OWNER: "text-amber-400 bg-amber-400/10",
  EDITOR: "text-indigo-400 bg-indigo-400/10",
  VIEWER: "text-slate-400 bg-slate-400/10",
};

export default function CollaboratorsTab({ suite, currentUserId, isOwner }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(suite.collaborators ?? []);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/suites/${suite.id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      setCollaborators((prev) => [...prev, data.data]);
      setInviteEmail("");
      setSuccess(`${inviteEmail} added as ${inviteRole.toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this collaborator?")) return;

    try {
      await fetch(`/api/suites/${suite.id}/collaborators?userId=${userId}`, {
        method: "DELETE",
      });
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
    } catch {
      setError("Failed to remove collaborator");
    }
  };

  const allMembers = [
    {
      userId: suite.owner.id,
      role: "OWNER" as const,
      user: suite.owner,
    },
    ...collaborators,
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Invite form (owner only) */}
      {isOwner && (
        <div className="glass-card p-5 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5 text-indigo-400" />
            Invite a Collaborator
          </h2>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-accent border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "EDITOR" | "VIEWER")}
                className="bg-accent border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || !inviteEmail.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Invite
            </button>
          </form>

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          {success && <p className="text-xs text-emerald-400 mt-2">{success}</p>}

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Viewer</span> — can read all content.{" "}
              <span className="font-medium text-foreground/70">Editor</span> — can add notes and upload files.
            </p>
          </div>
        </div>
      )}

      {/* Members list */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-muted-foreground" />
          Members ({allMembers.length})
        </h2>
        <div className="space-y-2">
          {allMembers.map((member) => {
            const RoleIcon = ROLE_ICONS[member.role];
            const isCurrentUser = member.userId === currentUserId;
            const canRemove = isOwner && member.role !== "OWNER";

            return (
              <div key={member.userId} className="glass-card p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  {member.user.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={member.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-indigo-400">
                      {getInitials(member.user.name)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{member.user.name}</p>
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                </div>

                {/* Role badge */}
                <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0", ROLE_COLORS[member.role])}>
                  <RoleIcon className="w-3 h-3" />
                  {ROLE_LABELS[member.role]}
                </span>

                {/* Remove button */}
                {canRemove && (
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="p-1.5 rounded-lg hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
