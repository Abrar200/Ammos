/**
 * Development component to create test users
 * Remove this in production
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createDefaultTestUsers } from '@/utils/createTestUser';
import { Loader2, Users } from 'lucide-react';

export const CreateTestUsersButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResults([]);

      const userResults = await createDefaultTestUsers();
      setResults(userResults);
    } catch (err: any) {
      setError(err.message || 'Failed to create test users');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Development Setup
        </CardTitle>
        <CardDescription>
          Create test user accounts for development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Users Created:</h4>
            {results.map((result, index) => (
              <div key={index} className={`text-sm p-2 rounded ${
                result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {result.success ? '✅' : '❌'} {result.email} ({result.role})
              </div>
            ))}
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
              <strong>Login Credentials:</strong><br />
              Email: admin@test.com<br />
              Password: password123
            </div>
          </div>
        )}

        <Button
          onClick={handleCreateUsers}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Test Users
        </Button>
      </CardContent>
    </Card>
  );
};