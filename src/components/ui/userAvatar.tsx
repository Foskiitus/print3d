// ─── Avatar ───────────────────────────────────────────────────────────────────

import { Crown } from "lucide-react";

export default function UserAvatar({
  name,
  avatarUrl,
  isPro,
}: {
  name: string;
  avatarUrl: string | null;
  isPro: boolean;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-full object-cover border-2 border-border"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary/15 border-2 border-border flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{initials}</span>
        </div>
      )}
      {/* Badge PRO dourado */}
      {isPro && (
        <div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#F59E0B" }}
          title="Plano Pro"
        >
          <Crown size={9} className="text-white" />
        </div>
      )}
    </div>
  );
}
