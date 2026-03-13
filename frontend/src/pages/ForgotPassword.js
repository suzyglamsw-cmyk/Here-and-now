import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API } from "@/App";
import { toast } from "sonner";
import axios from "axios";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { Logo, LogoIcon } from "../components/Logo";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("request"); // "request" | "reset"

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
      // In dev mode, the token is returned for testing
      if (response.data.reset_token) {
        setResetToken(response.data.reset_token);
      }
      toast.success("Check your email for reset instructions");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      await axios.post(`${API}/auth/reset-password`, {
        token: resetToken,
        new_password: newPassword
      });
      toast.success("Password updated! You can now log in.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Back button */}
      <div className="p-4">
        <Button
          data-testid="back-btn"
          variant="ghost"
          onClick={() => navigate("/login")}
          className="text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-10">
            <div className="flex items-center gap-3">
              <LogoIcon className="w-10 h-10" />
              <Logo size="default" />
            </div>
          </div>

          <div className="glass rounded-2xl p-8" data-testid="forgot-password-page">
            {!sent ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-7 h-7 text-indigo-400" />
                </div>
                <h1 className="text-2xl font-bold text-white text-center mb-2">Forgot password?</h1>
                <p className="text-slate-400 text-center mb-8">
                  Enter your email and we'll send you reset instructions.
                </p>

                <form onSubmit={handleRequestReset} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      Email
                    </Label>
                    <Input
                      data-testid="email-input"
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-white/5 border-transparent focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500"
                    />
                  </div>

                  <Button
                    data-testid="submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </>
            ) : step === "request" ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white text-center mb-2">Check your email</h1>
                <p className="text-slate-400 text-center mb-6">
                  If this email exists, you'll receive a reset link shortly.
                </p>

                {/* Dev mode: show reset token for testing */}
                {resetToken && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                    <p className="text-amber-400 text-sm font-medium mb-2">Dev Mode: Reset Token</p>
                    <code className="text-xs text-slate-300 break-all">{resetToken}</code>
                    <Button
                      data-testid="use-token-btn"
                      onClick={() => setStep("reset")}
                      className="w-full mt-4 h-10 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                    >
                      Reset Password Now
                    </Button>
                  </div>
                )}

                <Button
                  data-testid="back-to-login-btn"
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="w-full h-12 text-slate-400 hover:text-white hover:bg-white/10"
                >
                  Back to Login
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white text-center mb-2">Set New Password</h1>
                <p className="text-slate-400 text-center mb-8">
                  Enter your new password below.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-slate-300">
                      Reset Token
                    </Label>
                    <Input
                      data-testid="token-input"
                      id="token"
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                      className="h-12 bg-white/5 border-transparent focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-slate-300">
                      New Password
                    </Label>
                    <Input
                      data-testid="new-password-input"
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 bg-white/5 border-transparent focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500">At least 6 characters</p>
                  </div>

                  <Button
                    data-testid="reset-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </>
            )}

            <p className="text-center text-slate-400 mt-6">
              Remember your password?{" "}
              <Link
                to="/login"
                data-testid="login-link"
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
