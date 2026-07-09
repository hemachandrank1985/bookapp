import React, { useState } from 'react';
import { BookOpen, Mail, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function Login({ onLogin, onNavigateToRegister, addToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password.', 'warning');
      return;
    }
    onLogin({ email, password });
  };

  return (
    <div className="login-wrapper min-h-screen w-full flex items-center justify-center relative p-4">
      <div className="login-background absolute inset-0 bg-radial-gradient"></div>
      
      <Card className="w-full max-w-md glass-card border-white/10 z-10 shadow-glow">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-3">
            <BookOpen className="h-6 w-6 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">BookFlow Portal</CardTitle>
          <CardDescription className="text-slate-400">Academic Book Chapter Workflow Management</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                  placeholder="clara.sterling@bookflow.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-slate-500" />
                <Input
                  type="password"
                  className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium mt-2">
              Access Portal
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2 border-t border-white/5">
          <Button 
            variant="outline" 
            onClick={onNavigateToRegister}
            className="w-full border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Register new Admin Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
