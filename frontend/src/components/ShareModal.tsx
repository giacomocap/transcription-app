import { useEffect, useState } from 'react';
import { Share, Mail, Link, X, RefreshCw, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import { authFetch } from '@/utils/authFetch';

interface Share {
  id: string;
  type: 'email' | 'public';
  email?: string;
  token?: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

interface ShareModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal = ({ jobId, isOpen, onClose }: ShareModalProps) => {
  const [email, setEmail] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
    }
  }, [isOpen]);

  const fetchShares = async () => {
    try {
      const response = await authFetch(`/api/jobs/${jobId}/shares`);
      const data = await response.json();
      setShares(data);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch shares',
        variant: 'destructive',
      });
    }
  };

  const createShare = async () => {
    if (isPublic && shares.some(share => share.type === 'public')) {
      toast({
        title: 'Error',
        description: 'A public share already exists',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authFetch(`/api/jobs/${jobId}/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: isPublic ? 'public' : 'email',
          email: isPublic ? undefined : email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share');
      }

      await fetchShares();
      setEmail('');
      setIsPublic(false);
      toast({
        title: 'Success',
        description: isPublic
          ? 'Public link created'
          : 'Share invitation sent',
      });
    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: 'Error',
        description: 'Failed to create share',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      const response = await authFetch(
        `/api/jobs/${jobId}/shares/${shareId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to revoke share');
      }

      await fetchShares();
      toast({
        title: 'Success',
        description: 'Share revoked',
      });
    } catch (error) {
      console.error('Error revoking share:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke share',
        variant: 'destructive',
      });
    }
  };

  const resendInvitation = async (shareId: string) => {
    try {
      const response = await authFetch(
        `/api/jobs/${jobId}/shares/${shareId}/resend`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      toast({
        title: 'Success',
        description: 'Invitation resent',
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            Share Transcript
          </DialogTitle>
          <DialogDescription>
            Share this transcript via email or public link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPublic}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="public">Public Link</Label>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={createShare}
            disabled={isLoading || (!isPublic && !email)}
          >
            {isPublic ? 'Create Public Link' : 'Share via Email'}
          </Button>

          <div className="space-y-2">
            <h3 className="font-medium">Active Shares</h3>
            {shares.length > 0 ? (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {share.type === 'email' ? (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>{share.email}</span>
                          <Badge variant="secondary">
                            {share.status}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4" />
                          <span>Public Link</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/jobs/${jobId}?token=${share.token}`
                              );
                              toast({
                                title: 'Copied!',
                                description: 'Public link copied to clipboard',
                              });
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {share.type === 'email' && share.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendInvitation(share.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeShare(share.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No active shares
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
