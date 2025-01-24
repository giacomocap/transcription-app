import { useEffect } from 'react';
import StatsView from '../components/StatsView';
import { CreditManagement } from '../components/admin/CreditManagement';
import { CreditUsageReport } from '../components/admin/CreditUsageReport';

export const AdminPage = () => {
    useEffect(() => {
        document.title = 'Admin Settings - Claire.AI';
    }, []);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
            <div className="grid grid-cols-1 gap-6">
                <StatsView />
                <CreditUsageReport />
                <CreditManagement />
            </div>
        </div>
    );
};
