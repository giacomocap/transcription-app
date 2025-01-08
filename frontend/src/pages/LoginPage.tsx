import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const LoginPage = () => {
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
    <div className="flex items-center justify-center  bg-gray-50 px-4 sm:px-6 lg:px-8">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          {/* <CardDescription>Enter your email and password below</CardDescription> */}
        </CardHeader>
        {/* <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="Email" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Password" />
              </div>
            </div>
          </form>
        </CardContent> */}
        <CardFooter className="flex flex-col">
          {/* <Button className="w-full">Sign In</Button> */}
          <Button
            onClick={login}
            variant="outline"
            className="mt-2 w-full flex items-center justify-center"
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
  );
};
