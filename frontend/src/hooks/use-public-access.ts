import { useSearchParams, useLocation } from 'react-router-dom';

export const usePublicAccess = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const token = searchParams.get('token');
    const isJobDetailPage = location.pathname.startsWith('/jobs/') && location.pathname.split('/').length === 3;

    return {
        isPublicAccess: !!(token && isJobDetailPage)
    };
};
