import React, { useState } from 'react';
import { BookOpen, Mail, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function Login({ adminsCount = 0, onLogin, onNavigateToRegister, addToast }) {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'manager'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState('');
  const [isRecovered, setIsRecovered] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password.', 'warning');
      return;
    }
    onLogin({ email, password });
  };

  const handleRegisterClick = () => {
    if (adminsCount >= 1) {
      addToast('Only one Administrator account is allowed. An account is already registered.', 'error');
      return;
    }
    onNavigateToRegister();
  };

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    if (!recoveryEmail) {
      addToast('Please enter your registered email address.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const data = await res.json();

      if (res.ok) {
        setRecoveredPassword(data.password);
        setIsRecovered(true);
        addToast('Account located. Password recovered successfully!', 'success');
      } else {
        addToast(data.error || 'Email address not found.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error communicating with database.', 'error');
    }
  };

  const handleCloseRecovery = () => {
    setIsForgotModalOpen(false);
    setRecoveryEmail('');
    setRecoveredPassword('');
    setIsRecovered(false);
  };

  return (
    <div className="login-wrapper min-h-screen w-full flex items-center justify-center relative p-4">
      <div className="login-background absolute inset-0 bg-radial-gradient"></div>
      
      <Card className="w-full max-w-md glass-card border-white/10 z-10 shadow-glow flex flex-col">
        <CardHeader className="text-center pb-0">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-3">
            <BookOpen className="h-6 w-6 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">BookFlow Portal</CardTitle>
          <CardDescription className="text-slate-400">Academic Book Chapter Workflow Management</CardDescription>
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 mt-6 w-full text-sm font-semibold">
            <button
              onClick={() => { setActiveTab('admin'); setEmail(''); setPassword(''); }}
              className={`flex-1 pb-3 text-center transition-colors ${activeTab === 'admin' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Admin Portal
            </button>
            <button
              onClick={() => { setActiveTab('manager'); setEmail(''); setPassword(''); }}
              className={`flex-1 pb-3 text-center transition-colors ${activeTab === 'manager' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Manager Portal
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">
                {activeTab === 'admin' ? 'Admin Email Address' : 'Manager Email Address'}
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                  placeholder={activeTab === 'admin' ? 'clara.sterling@bookflow.com' : 'manager@bookflow.com'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-indigo-400 hover:underline hover:text-indigo-300"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-slate-500" />
                <Input
                  type="password"
                  className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium mt-2">
              Log In as {activeTab === 'admin' ? 'Admin' : 'Manager'}
            </Button>
          </form>

          {/* Admin Registration option under Admin Portal tab */}
          {activeTab === 'admin' && (
            <div className="flex justify-center border-t border-white/5 mt-5 pt-4 text-xs">
              <span className="text-slate-400 mr-1.5">Need to configure the portal?</span>
              <button 
                onClick={handleRegisterClick}
                className="text-indigo-400 hover:underline font-semibold"
              >
                Create Admin Account
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forgot Password Recovery Dialog Modal */}
      <Dialog open={isForgotModalOpen} onOpenChange={(open) => { if (!open) handleCloseRecovery(); }}>
        <DialogContent className="max-w-md border-white/10 text-white glass-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Password Recovery</DialogTitle>
          </DialogHeader>

          {!isRecovered ? (
            <form onSubmit={handleRecoverPassword} className="flex flex-col gap-4 mt-2">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your registered email address below. We will retrieve your security password from the secure database records.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Registered Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    className="pl-10 bg-slate-900/50 border-white/10 text-white focus-visible:ring-indigo-500"
                    placeholder="e.g. clara.sterling@bookflow.com"
                    value={recoveryEmail}
                    onChange={e => setRecoveryEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                <Button type="button" variant="outline" onClick={handleCloseRecovery} className="border-white/10 text-slate-300 hover:bg-slate-800">
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                  Retrieve Password
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4 text-center py-4">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 text-left flex flex-col gap-3">
                <h5 className="font-bold text-emerald-400 text-sm">Recovery Successful!</h5>
                <div className="text-xs text-slate-300">
                  Registered Email: <strong className="text-white font-semibold">{recoveryEmail}</strong>
                </div>
                <div className="text-xs text-slate-300 border-t border-white/5 pt-2 flex flex-col gap-1">
                  <span>Simulated Security Recovery details:</span>
                  <div className="bg-slate-950 border border-white/5 rounded p-2 text-center text-sm font-mono text-emerald-400 font-bold select-all mt-1">
                    {recoveredPassword}
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleCloseRecovery}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                Back to Login
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
