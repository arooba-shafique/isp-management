import { useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useGetCustomer, useUpdateCustomer, useSuspendCustomer, useListSubscriptions, useListPayments, useListComplaints, useListPackages, useSwitchPackage, useCreateSubscription, getGetCustomerQueryKey, getListCustomersQueryKey, getListPackagesQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Edit, Ban, CheckCircle, Phone, MapPin, Calendar, Wifi, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function CustomerDetailPage() {
  const [, params] = useRoute("/admin/customers/:id");
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const id = Number((params as any)?.id ?? 0);

  const { data: customer, isLoading } = useGetCustomer(id, { query: { queryKey: getGetCustomerQueryKey(id), enabled: !!id } });
  const { data: subscriptions = [] } = useListSubscriptions({ customerId: id }, { query: { queryKey: ["subs", id] } });
  const { data: payments = [] } = useListPayments({ customerId: id }, { query: { queryKey: ["payments", id] } });
  const { data: complaints = [] } = useListComplaints({ customerId: id }, { query: { queryKey: ["complaints", id] } });
  const { data: packages = [] } = useListPackages({ query: { queryKey: getListPackagesQueryKey() } });

  const updateCustomer = useUpdateCustomer();
  const suspendCustomer = useSuspendCustomer();
  const switchPkg = useSwitchPackage();
  const createSub = useCreateSubscription();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editZone, setEditZone] = useState("");
  const [error, setError] = useState("");

  const [switchingPkg, setSwitchingPkg] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [switchSuccess, setSwitchSuccess] = useState(false);

  function startEdit() {
    if (!customer) return;
    const c = customer as { name: string; phone: string; address?: string | null; zone?: string | null };
    setEditName(c.name); setEditPhone(c.phone);
    setEditAddress(c.address ?? ""); setEditZone(c.zone ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    setError("");
    try {
      await updateCustomer.mutateAsync({ id, data: { name: editName, phone: editPhone, address: editAddress, zone: editZone } });
      await qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
      await qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      setEditing(false);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setError(err?.data?.error ?? err?.message ?? "Update failed");
    }
  }

  async function toggleSuspend() {
    if (!customer) return;
    const c = customer as { status: string };
    const newSuspended = c.status !== "suspended";
    await suspendCustomer.mutateAsync({ id, data: { suspended: newSuspended } });
    await qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
    await qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
  }

  async function handleSwitchPackage() {
    if (!selectedPkgId) { setSwitchError("Please select a package"); return; }
    setSwitchLoading(true);
    setSwitchError("");
    try {
      const activeSub = (subscriptions as Array<{ id: number; status: string }>).find(s => s.status === "active");
      if (activeSub) {
        await switchPkg.mutateAsync({ id: activeSub.id, data: { newPackageId: Number(selectedPkgId) } });
      } else {
        await createSub.mutateAsync({ data: { packageId: Number(selectedPkgId), customerId: id } } as any);
      }
      await qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
      await qc.invalidateQueries({ queryKey: ["subs", id] });
      setSwitchSuccess(true);
      setSwitchingPkg(false);
      setSelectedPkgId("");
      setTimeout(() => setSwitchSuccess(false), 3000);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setSwitchError(err?.data?.error ?? err?.message ?? "Failed to switch package");
    } finally {
      setSwitchLoading(false);
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!customer) return <div className="text-center py-12 text-muted-foreground">Customer not found</div>;

  const c = customer as { id: number; name: string; phone: string; status: string; zone?: string | null; address?: string | null; createdAt: string; activeSubscription?: { id: number; status: string; startDate?: string | null; endDate?: string | null; package?: { name?: string; speedMbps?: number; price?: number } | null } | null };
  const activePackages = (packages as Array<{ id: number; name: string; speedMbps: number; price: number; isActive: boolean }>).filter(p => p.isActive);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/customers")} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{c.name}</h1>
          <p className="text-sm text-muted-foreground">{c.phone}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={startEdit} className="flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-sm hover:bg-accent transition-colors">
            <Edit size={14} /> Edit
          </button>
          <button onClick={toggleSuspend} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${c.status === "suspended" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
            {c.status === "suspended" ? <><CheckCircle size={14} /> Reactivate</> : <><Ban size={14} /> Suspend</>}
          </button>
        </div>
      </div>

      {editing && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Edit Customer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Zone</label>
              <input type="text" value={editZone} onChange={e => setEditZone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} disabled={updateCustomer.isPending} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {updateCustomer.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={() => setEditing(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <StatusBadge status={c.status} />
          <div className="text-xs text-muted-foreground">Account Status</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <MapPin size={16} className="text-muted-foreground" />
          <div className="text-sm">{c.zone ?? "—"}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <Calendar size={16} className="text-muted-foreground" />
          <div className="text-xs text-muted-foreground">Joined {new Date(c.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Active Subscription */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-primary" />
            <h2 className="font-semibold">Active Subscription</h2>
          </div>
          <button
            onClick={() => { setSwitchingPkg(!switchingPkg); setSwitchError(""); setSelectedPkgId(""); }}
            className="flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <RefreshCw size={14} /> Switch Package
          </button>
        </div>

        {switchSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2 text-sm mb-3">
            <CheckCircle size={14} /> Package switched successfully!
          </div>
        )}

        {switchingPkg && (
          <div className="bg-muted/50 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-sm font-medium">Select new package:</p>
            <select
              value={selectedPkgId}
              onChange={e => setSelectedPkgId(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">Choose a package…</option>
              {activePackages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.speedMbps} Mbps — Rs. {Number(p.price).toLocaleString()}
                </option>
              ))}
            </select>
            {switchError && <p className="text-sm text-destructive">{switchError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSwitchPackage}
                disabled={switchLoading}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {switchLoading ? "Switching..." : "Confirm Switch"}
              </button>
              <button onClick={() => setSwitchingPkg(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {c.activeSubscription ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{c.activeSubscription.package?.name ?? "—"}</div>
                <div className="text-sm text-muted-foreground">{c.activeSubscription.package?.speedMbps} Mbps &middot; Rs. {Number(c.activeSubscription.package?.price ?? 0).toLocaleString()}</div>
              </div>
              <StatusBadge status={c.activeSubscription.status} />
            </div>
            <div className="text-sm text-muted-foreground">
              {c.activeSubscription.startDate && <span>Start: {c.activeSubscription.startDate} </span>}
              {c.activeSubscription.endDate && <span>&rarr; End: <strong>{c.activeSubscription.endDate}</strong></span>}
            </div>
          </div>
        ) : <p className="text-sm text-muted-foreground">No active subscription</p>}
      </div>

      {/* Payment History */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold">Payment History ({(payments as unknown[]).length})</div>
        {(payments as unknown[]).length === 0 ? <div className="px-5 py-6 text-sm text-muted-foreground">No payments</div> : (
          <div className="divide-y max-h-48 overflow-y-auto">
            {(payments as Array<{ id: number; amount: number; status: string; createdAt: string; proofImageUrl?: string | null }>).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">Rs. {Number(p.amount).toLocaleString()}</span>
                  <span className="text-muted-foreground ml-2">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complaints */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold">Complaints ({(complaints as unknown[]).length})</div>
        {(complaints as unknown[]).length === 0 ? <div className="px-5 py-6 text-sm text-muted-foreground">No complaints</div> : (
          <div className="divide-y max-h-48 overflow-y-auto">
            {(complaints as Array<{ id: number; subject: string; status: string; createdAt: string }>).map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{c.subject}</span>
                  <span className="text-muted-foreground ml-2">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
