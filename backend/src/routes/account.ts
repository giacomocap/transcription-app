// routes/account.ts
import express, { Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { isAuthenticated } from '../auth';
import { AuthenticatedRequest } from '../types/auth';

const accountRouter = express.Router();

// GET /api/accounts
// Returns a list of accounts (teams) that the authenticated user belongs to.
accountRouter.get('/', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    // Get the authenticated user’s id from your auth middleware/helper
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        // Join account_members with accounts to get account details.
        const { data, error } = await supabaseAdmin
            .from('account_members')
            .select('accounts(*)')
            .eq('user_id', userId);
        if (error) throw error;
        // Map to get an array of account objects
        const accounts = data?.map((member) => member.accounts) || [];
        res.json({ accounts });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// PUT /api/accounts/:accountId
// Updates the team settings (e.g. account name, slug, etc.) for a given account.
accountRouter.put('/:accountId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { accountId } = req.params;
    const { name, slug } = req.body;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    // Check if the user is a member of this account
    const { data: membership, error: membershipError } = await supabaseAdmin
        .from('account_members')
        .select('*')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .single();
    if (membershipError || !membership) {
        res.status(403).json({ error: 'Not authorized for this account' });
        return
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('accounts')
            .update({ name, slug })
            .eq('id', accountId);
        if (error || !data) throw error;
        res.json({ account: data[0] });
    } catch (error) {
        console.error('Error updating account settings:', error);
        res.status(500).json({ error: 'Failed to update account settings' });
    }
});

export default accountRouter;
