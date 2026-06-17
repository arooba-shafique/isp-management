import { useQueryClient } from "@tanstack/react-query";
import { useListPackages, useCreateSubscription, useListSubscriptions, useSwitchPackage, getListSubscriptionsQueryKey, getListPackagesQueryKey } from "@workspace/api-client-react";
import { Wifi, Zap, Calendar, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomerPackages() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: packages = [], isLoading } = useListPackages({ query: { queryKey: getListPackagesQueryKey() } });
  const { data: subscriptions = [] } = useListSubscriptions(undefined, { query: { queryKey: getListSubscriptionsQueryKey() } });
  const subscribe = useCreateSubscription();
  const switchPkg = useSwitchPackage();
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState("");

  const activeSub = subscriptions.find((s: { status: string }) => s.status === "active");

  const activePackages = (packages as Array<{ id: number; name: string; speedMbps: number; price: number; validity: string; description?: string | null; isActive: boolean }>)
    .filter(p => p.isActive);

  async function handleSubscribe(packageId: number) {
    setSubscribing(packageId);
    setError("");
    try {
      if (activeSub) {
        await switchPkg.mutateAsync({ id: activeSub.id, data: { newPackageId: packageId } });
      } else {
        await subscribe.mutateAsync({ data: { packageId } });
      }
      await qc.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
      setSuccess(packageId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setError(err?.data?.error ?? err?.message ?? "Failed to subscribe");
    } finally {
      setSubscribing(null);
    }
  }

  const validityLabel = (v: string) => ({ monthly: "Monthly", quarterly: "Quarterly (3 mo)", yearly: "Yearly" }[v] ?? v);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Internet Packages</h1>
        <p className="text-sm text-muted-foreground">Choose a plan that fits your needs</p>
      </div>

      {activeSub && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
          <Wifi size={18} className="text-primary" />
          <div>
            <span className="text-sm font-medium">Current plan: </span>
            <span className="text-sm text-muted-foreground">{(activeSub as { package?: { name?: string } }).package?.name ?? "—"}</span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      <div className="grid gap-4">
        {activePackages.map(pkg => {
          const isCurrent = activeSub && (activeSub as { packageId: number }).packageId === pkg.id;
          return (
            <div key={pkg.id} className={`bg-white border rounded-xl p-5 shadow-sm relative ${isCurrent ? "border-primary ring-1 ring-primary/20" : ""}`}>
              {isCurrent && (
                <div className="absolute top-3 right-3">
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">Current</span>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Wifi size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{pkg.name}</h3>
                  </div>
                  {pkg.description && <p className="text-sm text-muted-foreground mt-0.5">{pkg.description}</p>}
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Zap size={14} className="text-amber-500" />
                      <span>{pkg.speedMbps} Mbps</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      <span>{validityLabel(pkg.validity)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold">Rs. {Number(pkg.price).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{validityLabel(pkg.validity).toLowerCase()}</div>
                </div>
              </div>
              <div className="mt-4">
                {success === pkg.id ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 text-sm font-medium">
                    <CheckCircle size={16} />
                    <span>Subscribed! Pending payment verification.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(pkg.id)}
                    disabled={subscribing === pkg.id || isCurrent}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${isCurrent ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                  >
                    {subscribing === pkg.id ? "Processing..." : isCurrent ? "Current Plan" : activeSub ? "Switch to this plan" : "Subscribe"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {activePackages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No packages available</div>
        )}
      </div>
    </div>
  );
}
