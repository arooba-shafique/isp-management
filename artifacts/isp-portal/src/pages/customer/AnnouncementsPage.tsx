import { useAuth } from "@/contexts/AuthContext";
import { useListAnnouncements } from "@workspace/api-client-react";
import { Megaphone, Bell } from "lucide-react";

type Announcement = { id: number; title: string; message: string; targetZone?: string | null; recipientCount?: number | null; createdAt: string };

export default function CustomerAnnouncementsPage() {
  const { user } = useAuth();
  const { data: announcements = [], isLoading } = useListAnnouncements({ query: { queryKey: ["announcements"] } });

  const myZone = user?.zone ?? null;

  const filtered = (announcements as Announcement[])
    .filter(a => !a.targetZone || a.targetZone === myZone)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Announcements</h1>
        <p className="text-sm text-muted-foreground">
          {myZone ? `Updates for your zone: ${myZone}` : "Updates from NetLink ISP"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center">
          <Bell size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Megaphone size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{a.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    {a.targetZone && <span>Zone: {a.targetZone}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
