import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useEffect } from 'react';
import { Loading } from '@/components/Loading';

export const LoginPage = () => {
  useEffect(() => {
    document.title = 'Login - Claire.AI';
  }, []);

  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <Loading />
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
              <Button
                onClick={() => login('github')}
                variant="outline"
                className="w-full flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Sign in with GitHub
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
