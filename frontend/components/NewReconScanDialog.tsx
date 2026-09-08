'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import { AlertCircle, Loader2, Network, Play } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

interface NewReconScanDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onScanCreated: () => void;
}

const NewReconScanDialog = ({ open, onOpenChange, onScanCreated }: NewReconScanDialogProps) => {
  const [target, setTarget] = useState('');
  const [rateLimit, setRateLimit] = useState('150');
  const [zeroDays, setZeroDays] = useState(false);
  const [aiSummary, setAiSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFields = () => {
    setTarget('');
    setRateLimit('150');
    setZeroDays(false);
    setAiSummary(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) {
      setError('Target domain is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/recon/scan/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          target: target.trim(),
          options: {
            rate_limit: Number(rateLimit) || 150,
            zero_days: zeroDays,
            ai_summary: aiSummary,
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      onScanCreated();
      onOpenChange(false);
      resetFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start dynamic test. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Network className="h-5 w-5 text-primary" />
            New Dynamic Test
          </DialogTitle>
          <DialogDescription>
            Run the 12-step dynamic testing pipeline against a target. Enumerate the attack surface and surface vulnerabilities.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target */}
          <div className="space-y-2">
            <Label htmlFor="recon-target" className="text-sm font-medium">
              Target Domain *
            </Label>
            <Input
              id="recon-target"
              className="h-11"
              placeholder="example.com"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the root domain to scan (e.g., example.com)
            </p>
          </div>

          {/* Rate limit */}
          <div className="space-y-2">
            <Label htmlFor="recon-rate-limit" className="text-sm font-medium">
              Rate Limit
            </Label>
            <Input
              id="recon-rate-limit"
              type="number"
              min={1}
              className="h-11"
              placeholder="150"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Requests per second cap for active scanning (default 150).
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-4 bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="recon-zero-days" className="text-sm font-medium">
                  Zero-day templates
                </Label>
                <p className="text-xs text-muted-foreground">
                  Include experimental / fuzzing nuclei templates.
                </p>
              </div>
              <Switch
                id="recon-zero-days"
                checked={zeroDays}
                onCheckedChange={setZeroDays}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="recon-ai-summary" className="text-sm font-medium">
                  AI summary
                </Label>
                <p className="text-xs text-muted-foreground">
                  Generate an AI-written executive summary of the findings.
                </p>
              </div>
              <Switch
                id="recon-ai-summary"
                checked={aiSummary}
                onCheckedChange={setAiSummary}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 p-3 rounded-md flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Scan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewReconScanDialog;
