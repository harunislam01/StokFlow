import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/40 rounded-full text-red-600 dark:text-red-400">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-red-900 dark:text-red-200">Beklenmedik Bir Hata Oluştu</h2>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Uygulama çalışırken bir sorunla karşılaştı. Lütfen sayfayı yenileyin.
                </p>
                {this.state.error && (
                  <pre className="mt-4 p-3 bg-red-100/50 dark:bg-red-950/50 text-red-800 dark:text-red-300 rounded text-xs text-left overflow-x-auto max-w-full">
                    {this.state.error.message}
                  </pre>
                )}
              </div>
              <Button 
                variant="destructive" 
                className="mt-4 w-full" 
                onClick={() => window.location.reload()}
              >
                Sayfayı Yenile
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
