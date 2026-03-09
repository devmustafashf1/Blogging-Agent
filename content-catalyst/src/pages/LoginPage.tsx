import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import authHeroBg from "@/assets/auth-hero-bg.jpg";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const url = isSignUp
    ? "http://localhost:5000/api/auth/signup"
    : "http://localhost:5000/api/auth/login";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isSignUp ? { name, email, password } : { email, password }
      ),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Something went wrong");
      return;
    }

    // ✅ When creating account
    if (isSignUp) {
      alert(data.message || "Account created successfully");

      // switch to login mode
      setIsSignUp(false);
      setPassword("");
      return;
    }

    // ✅ When logging in
    if (data.user) {
      login(data.user);
      navigate("/");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};

  return (
    <div className="flex min-h-screen animate-in fade-in duration-500">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-24 bg-card">
        <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-left-4 duration-500">
          {/* Logo */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">AI Content Pro</span>
            </div>
            <h1 className="text-3xl font-black text-foreground leading-tight tracking-tight transition-all duration-300">
              {isSignUp ? "Create account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isSignUp ? "Start your AI content journey today." : "Please enter your details to sign in."}
            </p>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => { login(); navigate("/"); }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg bg-card hover:bg-secondary hover:border-primary/30 hover:shadow-sm transition-all duration-200 font-semibold text-foreground"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              onClick={() => { login(); navigate("/"); }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-primary/20 rounded-lg bg-primary/5 hover:bg-primary/10 hover:shadow-sm transition-all duration-200 font-semibold text-primary"
            >
              <Sparkles className="w-5 h-5" />
              Sign in with Magic Link
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="block w-full rounded-lg border border-border bg-card text-foreground focus:border-primary focus:ring-1 focus:ring-ring py-3 px-4 placeholder:text-muted-foreground text-sm transition-shadow duration-200 hover:shadow-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full rounded-lg border border-border bg-card text-foreground focus:border-primary focus:ring-1 focus:ring-ring py-3 px-4 placeholder:text-muted-foreground text-sm transition-shadow duration-200 hover:shadow-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-border bg-card text-foreground focus:border-primary focus:ring-1 focus:ring-ring py-3 px-4 placeholder:text-muted-foreground text-sm transition-shadow duration-200 hover:shadow-sm"
              />
            </div>
            <Button type="submit" className="w-full py-3 text-sm font-bold hover:shadow-md transition-all duration-200">
              {isSignUp ? "Create Account" : "Sign in to Dashboard"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-primary hover:opacity-80 transition-opacity">
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side: Hero */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ backgroundColor: "hsl(var(--auth-dark))" }}>
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent mix-blend-multiply z-10" />
          <img src={authHeroBg} alt="" className="w-full h-full object-cover opacity-60" />
        </div>
        <div className="relative z-20 flex flex-col justify-end p-16 max-w-2xl animate-in slide-in-from-right-4 duration-700" style={{ color: "hsl(var(--auth-hero-text))" }}>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Trusted by 10,000+ creators
            </div>
            <h2 className="text-5xl font-black leading-[1.1] tracking-tight">
              Transform your workflow with <span className="text-primary">Advanced AI</span>.
            </h2>
            <p className="text-xl font-light" style={{ color: "hsl(var(--auth-hero-muted))" }}>
              Join the platform that helps creators, marketers, and developers ship high-quality content 10x faster.
            </p>
            <div className="pt-8 flex gap-8">
              {[
                { value: "99%", label: "Uptime SLA" },
                { value: "24/7", label: "Expert Support" },
                { value: "Secure", label: "ISO Certified" },
              ].map((stat, i) => (
                <div key={stat.label} className="flex gap-8 items-center">
                  {i > 0 && <div className="w-px h-10 bg-white/20" />}
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm" style={{ color: "hsl(var(--auth-hero-muted))" }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute top-20 right-20 z-20 hidden xl:block w-72 h-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="h-2 w-24 bg-white/20 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="h-3 w-full bg-white/10 rounded-full" />
            <div className="h-3 w-4/5 bg-white/10 rounded-full" />
            <div className="flex gap-2 pt-2">
              <div className="h-12 w-full bg-primary/20 rounded-lg" />
              <div className="h-12 w-full bg-white/5 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
