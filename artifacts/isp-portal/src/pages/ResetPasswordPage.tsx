import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Wifi, Lock, CheckCircle, AlertCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function ResetPasswordPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tokenFromUrl = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!tokenFromUrl) { setError("Invalid or missing reset token"); return; }
    if (!newPassword) { setError("Enter a new password"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: tokenFromUrl, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to reset password"); return; }
      login(data.token);
      navigate(data.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Wifi size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NetLink ISP</h1>
          <p className="text-sidebar-foreground/60 text-sm mt-1">Reset Your Password</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Set New Password</h2>
              <p className="text-sm text-muted-foreground">Enter your new password below</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isLoading ? "Resetting..." : "Reset Password & Sign In"}
            </button>

            <button type="button" onClick={() => navigate("/login")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              Back to sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
