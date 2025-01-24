import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { authFetch } from '@/utils/authFetch';

interface CreditTransaction {
    id: string;
    amount: number;
    type: string;
    status: string;
    description: string;
    created_at: string;
}

export const CreditHistory = () => {
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        fetchCreditData();
    }, []);

    const fetchCreditData = async () => {
        try {
            const [balanceResponse, historyResponse] = await Promise.all([
                authFetch('/api/credits/balance'),
                authFetch('/api/credits/history')
            ]);

            const balanceData = await balanceResponse.json();
            const historyData = await historyResponse.json();

            setBalance(balanceData.balance);
            setTransactions(historyData);
        } catch (error) {
            console.error('Error fetching credit data:', error);
        }
    };

    const getTransactionColor = (amount: number) => {
        return amount > 0 ? 'text-green-600' : 'text-red-600';
    };

    const formatTransactionType = (type: string) => {
        return type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Current Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{balance} credits</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Credit History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>
                                        {new Date(transaction.created_at).toLocaleString('en-US', {
                                            month: 'short',
                                            day: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </TableCell>
                                    <TableCell>{formatTransactionType(transaction.type)}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className={getTransactionColor(transaction.amount)}>
                                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                    </TableCell>
                                    <TableCell className="capitalize">{transaction.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
