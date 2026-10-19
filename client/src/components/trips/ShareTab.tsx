import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShareStatus, ShareCreated } from '../../types';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/format';
import {
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Globe,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface ShareTabProps {
  tripId: string;
}

export const ShareTab: React.FC<ShareTabProps> = ({ tripId }) => {
  const { showToast } = useToast();

  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const [newlyCreated, setNewlyCreated] = useState<ShareCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isConfirmRevokeOpen, setIsConfirmRevokeOpen] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.share.getStatus(tripId);
      setShareStatus(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to check share status.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [tripId]);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const res = await api.share.create(tripId);
      setNewlyCreated(res);
      setCopied(false);
      showToast('Share link created successfully!', 'success');
      await fetchStatus();
    } catch (err: any) {
      showToast(err.message || 'Failed to create share link.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await api.share.revoke(tripId);
      setNewlyCreated(null);
      setIsConfirmRevokeOpen(false);
      showToast('Share link has been disabled.', 'info');
      await fetchStatus();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke share link.', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Spinner size="lg" className="text-teal-600" />
      </div>
    );
  }

  const fullShareUrl = newlyCreated
    ? `${window.location.origin}/shared/${newlyCreated.shareToken}`
    : '';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Share Itinerary</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Share a clean, read-only itinerary with travel companions or family. Private account details are strictly omitted.
        </p>
      </div>

      {/* Newly Created One-Time Token Banner */}
      {newlyCreated && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 rounded-2xl p-6 space-y-4 animate-in fade-in">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Your Share Link is Ready (Shown Once)
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                For your security, this raw secret link cannot be viewed again after you navigate away. Copy and save it now.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/60 p-2">
            <input
              type="text"
              readOnly
              value={fullShareUrl}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 w-full focus:outline-none font-mono px-2 select-all"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleCopy(fullShareUrl)}
              icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 pt-1">
            <span>Permissions: Read-Only</span>
            <a
              href={fullShareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-teal-800 dark:text-teal-300 hover:underline"
            >
              <span>Test Public View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Current Sharing Status Card */}
      <Card className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-3 rounded-2xl ${
                shareStatus?.isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {shareStatus?.isActive ? <Globe className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    shareStatus?.isActive ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                  }`}
                />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {shareStatus?.isActive ? 'Public Link Active' : 'Trip is Private'}
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {shareStatus?.isActive
                  ? `Active since ${formatDate(shareStatus.createdAt)}`
                  : 'Only you can view and edit this trip.'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={handleGenerateLink}
            isLoading={isGenerating}
            icon={shareStatus?.isActive ? <RefreshCw className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          >
            {shareStatus?.isActive ? 'Generate New Link (Replaces Old)' : 'Enable Share Link'}
          </Button>

          {shareStatus?.isActive && (
            <Button
              variant="outline"
              onClick={() => setIsConfirmRevokeOpen(true)}
              className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              Revoke & Disable Link
            </Button>
          )}
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmRevokeOpen}
        title="Revoke Share Link"
        message="Anyone with the current link will immediately lose access. You can generate a new link later."
        confirmText="Yes, Revoke Link"
        confirmVariant="danger"
        isLoading={isRevoking}
        onConfirm={handleRevoke}
        onCancel={() => setIsConfirmRevokeOpen(false)}
      />
    </div>
  );
};
