import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useEffect } from 'react';

export const LoginPage = () => {
  useEffect(() => {
    document.title = 'Login - Claire.AI';
  }, []);

  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/jobs" replace />;
  }

  return (
    <div className="flex  justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Claire!</h1>
          <p className="mt-2 text-gray-600">
            Your digital assistant is awaiting you. Sign in to get started.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome to Claire.AI!</CardTitle>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-4">
              <div className="space-y-2">
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>AI-Enhanced Transcription</li>
                  <li>Best in class speaker identification</li>
                  <li>Chat with your meeting and with your lectures</li>
                  <li>Receive personalized recommendations</li>
                </ul>
              </div>
              <Button
                onClick={() => login('google')}
                variant="outline"
                className="w-full flex items-center justify-center"
              >
                <img
                  className="h-5 w-5 mr-2"
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                />
                Sign in with Google
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
