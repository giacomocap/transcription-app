import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES } from '../constants/languages';
import { useToast } from '@/hooks/use-toast';

export const OnboardingModal = () => {
  const { toast } = useToast();
  const { updateUserSettings, completeOnboarding } = useAuth();
  const [language, setLanguage] = useState('en');

  const handleComplete = async () => {
    try {
      await updateUserSettings({ preferred_transcription_language: language });
      toast({ title: 'Settings saved successfully', description: 'Your settings have been saved successfully.' });
    } catch (error) {
      toast({ title: 'Error saving settings', description: 'An error occurred while saving your settings. Please try again.' });
    }
    completeOnboarding();
  };

  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to Claire.AI!</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <p className="text-gray-600">
            Let's set up your account preferences to get started.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Transcription Language
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
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
          <Button onClick={handleComplete} className="w-full">
            Complete Setup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
