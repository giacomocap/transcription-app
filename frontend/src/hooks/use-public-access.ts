import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const usePublicAccess = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const token = searchParams.get('token');
    const isJobDetailPage = location.pathname.startsWith('/jobs/') && location.pathname.split('/').length === 3;
    const isPublicLink = !!(token && isJobDetailPage);

    return {
        isPublicAccess: isPublicLink && !isAuthenticated
    };
};
