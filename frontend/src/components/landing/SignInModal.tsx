// frontend/src/components/SignInModal.tsx
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

interface SignInModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SignInModal = ({ open, onOpenChange }: SignInModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center mb-4">
                        Unlock Full Features
                    </DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-gray-600">
                            Sign up to save your work, analyze your own files, and access advanced features.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button asChild className="w-full">
                            <Link to="/login">Create Free Account</Link>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};