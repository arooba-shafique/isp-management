import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSendOtp, useLogin, useRegister, useClaimAccount, useListZones, getListZonesQueryKey } from "@workspace/api-client-react";
import { Wifi, Phone, KeyRound, User, MapPin, Lock } from "lucide-react";

const ADMIN_PHONE = "03496641464";

type Step = "phone" | "otp" | "admin-password" | "register" | "claim";

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState("");
  const [error, setError] = useState("");
  const [needsClaim, setNeedsClaim] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const sendOtp = useSendOtp();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const claimMutation = useClaimAccount();
  const { data: zones = [] } = useListZones({ query: { queryKey: getListZonesQueryKey() } });

  const isLoading = sendOtp.isPending || loginMutation.isPending || registerMutation.isPending || claimMutation.isPending;

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    if (phone.trim() === ADMIN_PHONE) {
      setStep("admin-password");
      return;
    }
    try {
      const resp = await sendOtp.mutateAsync({ data: { phone } });
      const msg = (resp as { message?: string })?.message ?? "";
      if (msg.includes("not registered")) setIsNewUser(true);
      setStep("otp");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Failed to send OTP");
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password.trim()) { setError("Please enter your password"); return; }
    try {
      const result = await loginMutation.mutateAsync({ data: { phone, otp: password } } as any);
      login(result.token);
      navigate("/admin/dashboard");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Invalid password");
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!otp.trim()) { setError("Please enter the OTP"); return; }
    try {
      const result = await loginMutation.mutateAsync({ data: { phone, otp } });
      login(result.token);
      navigate(result.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string }; message?: string };
      if (e?.status === 404) { setStep("register"); return; }
      const msg = e?.data?.error ?? e?.message ?? "";
      if (msg.toLowerCase().includes("pending-claim") || msg.toLowerCase().includes("pending claim")) {
        setNeedsClaim(true);
        setStep("claim");
        return;
      }
      setError(msg || "Invalid OTP");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const result = await registerMutation.mutateAsync({ data: { phone, otp, name, password, address, zone } });
      login(result.token);
      navigate("/dashboard");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Registration failed");
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const result = await claimMutation.mutateAsync({ data: { phone, otp, password } });
      login(result.token);
      navigate("/dashboard");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Failed to claim account");
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
          <p className="text-sidebar-foreground/60 text-sm mt-1">Customer & Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Sign In</h2>
                <p className="text-sm text-muted-foreground">Enter your phone number to continue</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                Continue
              </button>
              <p className="text-xs text-center text-muted-foreground">New users will be registered automatically</p>
            </form>
          )}

          {step === "admin-password" && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Admin Login</h2>
                <p className="text-sm text-muted-foreground">Enter your admin password</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
              <button type="button" onClick={() => { setStep("phone"); setError(""); setPassword(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Change phone number
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Enter OTP</h2>
                <p className="text-sm text-muted-foreground">We sent a code to <strong>{phone}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Verification Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text" value={otp} onChange={e => setOtp(e.target.value)}
                    placeholder="123456" maxLength={6} className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary tracking-widest text-center"
                    disabled={isLoading}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
              <button type="button" onClick={() => { setStep("phone"); setError(""); setOtp(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Change phone number
              </button>
            </form>
          )}

          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Create Account</h2>
                <p className="text-sm text-muted-foreground">Complete your profile to get started</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Muhammad Ali" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set a password" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Address <span className="text-muted-foreground font-normal">(optional)</span></label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street / Mohalla" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Zone <span className="text-muted-foreground font-normal">(optional)</span></label>
                <select value={zone} onChange={e => setZone(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white" disabled={isLoading}>
                  <option value="">Select your zone…</option>
                  {(zones as Array<{ id: number; name: string }>).map(z => (
                    <option key={z.id} value={z.name}>{z.name}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {step === "claim" && (
            <form onSubmit={handleClaim} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Activate Account</h2>
                <p className="text-sm text-muted-foreground">Your account was created by the admin. Set a password to activate access.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set a password" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Activating..." : "Activate Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
