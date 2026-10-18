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
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-slate-50">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-blue-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-sky-500/10 blur-[140px] pointer-events-none" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Boxes className="absolute top-[12%] left-[8%] h-20 w-20 rotate-12 animate-float-slow text-slate-400/15" />
        <Warehouse className="absolute bottom-[10%] left-[10%] h-24 w-24 -rotate-12 animate-float-slower text-slate-400/15" />
        <Cpu className="absolute top-[18%] right-[10%] h-16 w-16 rotate-45 animate-float-slower text-slate-400/15" />
        <Database className="absolute bottom-[15%] right-[6%] h-20 w-20 -rotate-6 animate-float-slow text-slate-400/15" />
        <Barcode className="absolute top-[48%] left-[4%] h-14 w-14 -rotate-90 animate-float-slower text-slate-400/15" />
        <Layers className="absolute bottom-[40%] right-[22%] h-14 w-14 rotate-12 animate-float-slow text-slate-400/15" />
      </div>

      <Card className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/[0.05]">
        <CardHeader className="space-y-1 items-center pb-4">
          <div className="bg-blue-50 p-3.5 rounded-full mb-2">
            <Package className="h-7 w-7 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            StockFlow
          </CardTitle>
          <CardDescription className="text-slate-500">
            Devam etmek için giriş yapın (admin / admin)
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-400">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                className={`h-12 text-base rounded-xl ${form.formState.errors.username ? 'border-red-500' : ''}`}
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
                className={`h-12 text-base rounded-xl ${form.formState.errors.password ? 'border-red-500' : ''}`}
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
                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-transparent cursor-pointer"
                  {...form.register('rememberMe')}
                />
                <Label htmlFor="rememberMe" className="text-xs font-semibold cursor-pointer text-slate-600">Beni Hatırla</Label>
              </div>
              <button
                type="button"
                onClick={() => alert('Lütfen yöneticinizle iletişime geçin.')}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Şifremi Unuttum
              </button>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl btn-tactile font-semibold"
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
