import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, #E1D9CD 0%, #102E47 100%)` }}
    >
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-8" style={{ backgroundColor: '#102E47' }}>
          <div className="flex justify-center mb-4">
            <img 
              src="https://d64gsuwffb70l.cloudfront.net/685afce20bfda24fc0f1d36c_1753796540506_1ce0d419.png" 
              alt="Ammos Greek Bistro" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: '#E1D9CD' }}>
            Admin Panel
          </CardTitle>
          <p style={{ color: '#E1D9CD', opacity: 0.8 }}>Sign in to your account</p>
        </CardHeader>
        <CardContent className="p-8" style={{ backgroundColor: '#E1D9CD' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 focus:ring-2"
                style={{ 
                  borderColor: '#102E47',
                  color: '#102E47'
                }}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-2 focus:ring-2"
                style={{ 
                  borderColor: '#102E47',
                  color: '#102E47'
                }}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full text-lg py-3 font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50"
              style={{ 
                backgroundColor: '#102E47',
                color: '#E1D9CD'
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};