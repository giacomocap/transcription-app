import { supabaseAdmin } from '../utils/supabase';

interface TransactionData {
    user_id: string;
    job_id: string;
    amount: number;
    type: 'transcription' | 'transcription_with_diarization' | 'refund';
    status: 'pending' | 'completed' | 'refunded';
    description: string;
}

export class CreditTransactionService {
    private static instance: CreditTransactionService;

    private constructor() {}

    public static getInstance(): CreditTransactionService {
        if (!CreditTransactionService.instance) {
            CreditTransactionService.instance = new CreditTransactionService();
        }
        return CreditTransactionService.instance;
    }

    async createTransaction(data: TransactionData) {
        const { data: transaction } = await supabaseAdmin
            .from('credit_transactions')
            .insert(data)
            .select()
            .single();
        
        return transaction;
    }

    async createTranscriptionTransaction(userId: string, jobId: string, requiredCredits: number, fileName: string, durationInMinutes: number, diarizationEnabled: boolean) {
        return this.createTransaction({
            user_id: userId,
            job_id: jobId,
            amount: -requiredCredits,
            type: diarizationEnabled ? 'transcription_with_diarization' : 'transcription',
            status: 'pending',
            description: `Transcription of ${fileName} (${durationInMinutes} minutes)`
        });
    }

    async completeTransaction(jobId: string) {
        await supabaseAdmin.from('credit_transactions')
            .update({ status: 'completed' })
            .eq('job_id', jobId);

        await supabaseAdmin.from('jobs')
            .update({ credits_charged: true })
            .eq('id', jobId);
    }

    async refundTransaction(jobId: string, userId: string) {
        const { data: transaction } = await supabaseAdmin
            .from('credit_transactions')
            .select('amount')
            .eq('job_id', jobId)
            .single();

        if (transaction) {
            await supabaseAdmin.from('credit_transactions')
                .update({ status: 'refunded' })
                .eq('job_id', jobId);

            await this.createTransaction({
                user_id: userId,
                job_id: jobId,
                amount: Math.abs(transaction.amount),
                type: 'refund',
                status: 'completed',
                description: `Refund for failed job ${jobId}`
            });
        }
    }
}

// Create and export singleton instance
export const creditTransactionService = CreditTransactionService.getInstance();
