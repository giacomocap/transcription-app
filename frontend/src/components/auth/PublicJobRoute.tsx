import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PublicJobRouteProps {
    children: React.ReactNode;
}

export const PublicJobRoute: React.FC<PublicJobRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const [searchParams] = useSearchParams();
    const [isValidating, setIsValidating] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const location = useLocation();
    const token = searchParams.get('token');

    useEffect(() => {
        const validateAccess = async () => {
            // If no token, wait for auth check
            if (!token) {
                setIsValidating(false);
                return;
            }

            try {
                const jobId = location.pathname.split('/').pop();
                const response = await fetch(`/api/jobs/${jobId}/validate-token?token=${token}`);
                setIsValidToken(response.ok);
            } catch (error) {
                console.error('Error validating token:', error);
                setIsValidToken(false);
            } finally {
                setIsValidating(false);
            }
        };

        // Only validate token if user is not authenticated
        if (!isAuthenticated) {
            validateAccess();
        } else {
            setIsValidating(false);
        }
    }, [token, location.pathname, isAuthenticated]);

    // Show loading while checking auth or validating token
    if ((isLoading && !token) || isValidating) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Allow access if user is authenticated or has valid token
    if (isAuthenticated || (token && isValidToken)) {
        return <>{children}</>;
    }

    // Otherwise redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
};
