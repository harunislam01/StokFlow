import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Package, Boxes, Warehouse, Cpu, Database, Barcode, Layers } from 'lucide-react';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useTheme } from '../context/ThemeProvider';

const loginSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı gerekli'),
  password: z.string().min(1, 'Şifre gerekli'),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login: authenticate } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', rememberMe: false },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormValues) => login(data.username, data.password, data.rememberMe),
    onSuccess: (user) => {
      authenticate(user);
      navigate('/');
    },
    onError: (error: any) => {
      setErrorMsg(error.message || 'Giriş başarısız');
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setErrorMsg('');
    loginMutation.mutate(data);
  };

  return (
    <div className={`relative flex min-h-screen items-center justify-center p-4 overflow-hidden transition-colors duration-300
      ${isDark ? 'bg-[#0b0f19]' : 'bg-[#f1f5f9]'}`}
    >
      {/* Decorative blurred background blobs for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-amber-500/15 dark:bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-blue-600/15 dark:bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[140px] pointer-events-none" />

      {/* Floating Stock/Warehouse Icons in the background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Boxes className={`absolute top-[12%] left-[8%] h-20 w-20 rotate-12 transition-all duration-300 animate-float-slow ${isDark ? 'text-amber-500/5' : 'text-slate-400/15'}`} />
        <Warehouse className={`absolute bottom-[10%] left-[10%] h-24 w-24 -rotate-12 transition-all duration-300 animate-float-slower ${isDark ? 'text-blue-500/5' : 'text-slate-400/15'}`} />
        <Cpu className={`absolute top-[18%] right-[10%] h-16 w-16 rotate-45 transition-all duration-300 animate-float-slower ${isDark ? 'text-indigo-500/5' : 'text-slate-400/15'}`} />
        <Database className={`absolute bottom-[15%] right-[6%] h-20 w-20 -rotate-6 transition-all duration-300 animate-float-slow ${isDark ? 'text-amber-500/5' : 'text-slate-400/15'}`} />
        <Barcode className={`absolute top-[48%] left-[4%] h-14 w-14 -rotate-90 transition-all duration-300 animate-float-slower ${isDark ? 'text-slate-500/5' : 'text-slate-400/15'}`} />
        <Layers className={`absolute bottom-[40%] right-[22%] h-14 w-14 rotate-12 transition-all duration-300 animate-float-slow ${isDark ? 'text-slate-500/5' : 'text-slate-400/15'}`} />
      </div>

      <Card className={`relative z-10 w-full max-w-sm rounded-xl border shadow-xl transition-all duration-150 backdrop-blur-md
        ${isDark
          ? 'bg-[#1e293b]/85 border-white/[0.08] shadow-black/30'
          : 'bg-white/85 border-slate-200/80 shadow-slate-900/[0.05]'
        }`}>
        <CardHeader className="space-y-1 items-center pb-4">
          <div className="bg-amber-500/10 p-3.5 rounded-full mb-2">
            <Package className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            StockFlow
          </CardTitle>
          <CardDescription className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Devam etmek için giriş yapın (admin / admin)
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-md text-xs font-semibold">
                {errorMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-400">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                /* text-base (16px) prevents iOS Safari auto zoom on focus */
                className={`h-12 text-base rounded-sm ${form.formState.errors.username ? 'border-red-500' : ''}`}
                {...form.register('username')}
              />
              {form.formState.errors.username && (
                <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                /* text-base (16px) prevents iOS Safari auto zoom on focus */
                className={`h-12 text-base rounded-sm ${form.formState.errors.password ? 'border-red-500' : ''}`}
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 text-amber-600 focus:ring-amber-500 focus:ring-offset-0 bg-transparent cursor-pointer"
                  {...form.register('rememberMe')}
                />
                <Label htmlFor="rememberMe" className={`text-xs font-semibold cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Beni Hatırla</Label>
              </div>
              <button
                type="button"
                onClick={() => alert('Lütfen yöneticinizle iletişime geçin.')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Şifremi Unuttum
              </button>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 rounded-md btn-tactile font-semibold"
              type="submit"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
