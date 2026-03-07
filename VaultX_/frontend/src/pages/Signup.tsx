import { useState } from "react";
import { supabase } from "../services/supabase";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Chrome, 
  Github,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  User,
  Key
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const validatePassword = (pass: string) => {
    const hasMinLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    return { hasMinLength, hasUpperCase, hasLowerCase, hasNumber };
  };

  const passwordChecks = validatePassword(password);

  const handleSignup = async () => {
    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!Object.values(passwordChecks).every(Boolean)) {
      setError("Password does not meet requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the terms of service");
      return;
    }

    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Show success message and redirect after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignup();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-3xl font-bold text-foreground">Vault<span className="text-primary">X</span></span>
          </Link>
          <p className="text-muted-foreground mt-2">Create your digital vault</p>
        </div>

        {/* Signup Card */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="p-8 pb-6 border-b border-border bg-gradient-to-r from-primary/5 to-purple-500/5">
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground text-sm mt-1">Start protecting your digital legacy</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mx-8 mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-500 font-medium">Account created successfully!</p>
                <p className="text-xs text-green-500/80 mt-1">Check your email for confirmation. Redirecting to login...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="mx-8 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="p-8">
            {/* Full Name Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={isLoading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                <Key className="w-3 h-3" /> Password must contain:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${passwordChecks.hasMinLength ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <CheckCircle className={`w-3 h-3 ${passwordChecks.hasMinLength ? 'fill-green-500 text-white' : ''}`} />
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasUpperCase ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <CheckCircle className={`w-3 h-3 ${passwordChecks.hasUpperCase ? 'fill-green-500 text-white' : ''}`} />
                  <span>Uppercase</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasLowerCase ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <CheckCircle className={`w-3 h-3 ${passwordChecks.hasLowerCase ? 'fill-green-500 text-white' : ''}`} />
                  <span>Lowercase</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasNumber ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <CheckCircle className={`w-3 h-3 ${passwordChecks.hasNumber ? 'fill-green-500 text-white' : ''}`} />
                  <span>Number</span>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={isLoading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-center gap-2 mb-8">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 transition-colors"
                disabled={isLoading || success}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>

            {/* Signup Button */}
            <button
              onClick={handleSignup}
              disabled={isLoading || success}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Your Vault
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-card text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            </div>

            {/* Social Signup */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleSignup}
                disabled={isLoading || success}
                className="flex items-center justify-center gap-2 py-3 border border-border rounded-xl hover:bg-accent hover:border-primary/30 transition-all disabled:opacity-50 group"
              >
                <Chrome className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-foreground">Google</span>
              </button>
              <button
                onClick={() => console.log('GitHub signup')}
                disabled={isLoading || success}
                className="flex items-center justify-center gap-2 py-3 border border-border rounded-xl hover:bg-accent hover:border-primary/30 transition-all disabled:opacity-50 group"
              >
                <Github className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-foreground">GitHub</span>
              </button>
            </div>

            {/* Login Link */}
            <p className="text-center mt-8 text-muted-foreground">
              Already have a vault?{' '}
              <Link 
                to="/login" 
                className="text-primary hover:underline font-medium inline-flex items-center gap-1 group"
              >
                Sign in
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            End-to-end encrypted • Your data, your key only
            <Lock className="w-3 h-3" />
          </p>
        </div>

        {/* Background Branding */}
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground/30 font-mono">
          VAULTX © 2024
        </div>
      </div>
    </div>
  );
}