import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { LANGUAGES } from '../constants/languages';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const SettingsPage = () => {
    const { toast } = useToast();
    const { updateUserSettings, userSettings, deleteAccount } = useAuth();
    const [language, setLanguage] = useState(userSettings?.preferred_transcription_language || 'en');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        document.title = 'Settings - Claire.AI';
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateUserSettings({ preferred_transcription_language: language });
            toast({
                title: 'Settings saved',
                description: 'Your preferences have been updated successfully.'
            });
        } catch (error) {
            toast({
                title: 'Error saving settings',
                description: 'An error occurred. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAccount();
            toast({
                title: "Account deleted",
                description: "Your account and all associated data have been permanently removed."
            });
        } catch (error) {
            toast({
                title: "Deletion failed",
                description: "Unable to delete your account. Please try again or contact support.",
                variant: "destructive",
            });
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Transcription Language
                        </label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-full sm:w-[300px]">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="mr-2">Saving...</span>
                                <span className="animate-spin">⚪</span>
                            </>
                        ) : 'Save Changes'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove your data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <span className="mr-2">Deleting Account...</span>
                                    <span className="animate-spin">⚪</span>
                                </>
                            ) : "Delete Account"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
