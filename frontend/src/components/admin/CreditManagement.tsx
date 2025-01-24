import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/utils/authFetch';

interface UserCredit {
    user_id: string;
    credits_balance: number;
    users: {
        email: string;
    };
}

export const CreditManagement = () => {
    const [users, setUsers] = useState<UserCredit[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [creditAmount, setCreditAmount] = useState<number>(0);
    const [description, setDescription] = useState<string>('');
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await authFetch('/api/admin/users/credits');
            const data = await response.json();
            setUsers(data ?? []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleCreditAdjustment = async () => {
        try {
            const response = await authFetch('/api/admin/credits/adjust', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: selectedUser,
                    amount: creditAmount,
                    description,
                }),
            });

            if (response.ok) {
                toast({
                    title: 'Credits adjusted successfully',
                    description: `Credits have been ${creditAmount > 0 ? 'added to' : 'removed from'} the user's account.`,
                });
                fetchUsers(); // Refresh the list
                setCreditAmount(0);
                setDescription('');
            } else {
                throw new Error('Failed to adjust credits');
            }
        } catch (error) {
            toast({
                title: 'Error adjusting credits',
                description: 'Failed to adjust credits. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit Management</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Credit Balance</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.user_id}>
                                    <TableCell>{user.users.email}</TableCell>
                                    <TableCell>{user.credits_balance}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedUser(user.user_id)}
                                        >
                                            Adjust Credits
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {selectedUser && (
                        <div className="space-y-4 mt-4 p-4 border rounded-lg">
                            <h3 className="font-medium">Adjust Credits</h3>
                            <div className="space-y-2">
                                <Input
                                    type="number"
                                    placeholder="Amount (positive to add, negative to remove)"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                                />
                                <Input
                                    placeholder="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                                <Button onClick={handleCreditAdjustment}>
                                    Submit Adjustment
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
