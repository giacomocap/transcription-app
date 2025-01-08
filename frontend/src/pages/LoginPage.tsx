import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

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
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                </div>
                <div>
                    <button
                        onClick={login}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <img
                            className="h-5 w-5 mr-2"
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google logo"
                        />
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
};