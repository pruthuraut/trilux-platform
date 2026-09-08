'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import { AlertCircle, Loader2, Play, ShieldAlert, Upload, Link2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onScanCreated: () => void;
}

const NewApiScanDialog = ({ open, onOpenChange, onScanCreated }: Props) => {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [target, setTarget] = useState('');           // base URL or spec URL
  const [file, setFile] = useState<File | null>(null); // Postman / OpenAPI
  const [authToken, setAuthToken] = useState('');
  const [cookie, setCookie] = useState('');
  const [secondToken, setSecondToken] = useState('');  // low-priv identity (BOLA/BFLA)
  const [headersText, setHeadersText] = useState('');  // JSON dict
  const [authorizeLoad, setAuthorizeLoad] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setMode('url'); setTarget(''); setFile(null); setAuthToken(''); setCookie('');
    setSecondToken(''); setHeadersText(''); setAuthorizeLoad(false); setError(null);
  };

  const buildOptions = () => {
    const opts: Record<string, any> = {};
    if (authToken.trim()) opts.auth_token = authToken.trim();
    if (cookie.trim()) opts.cookie = cookie.trim();
    if (secondToken.trim()) opts.second_auth_token = secondToken.trim();
    if (authorizeLoad) opts.authorize_load_test = true;
    if (headersText.trim()) {
      try { opts.headers = JSON.parse(headersText); }
      catch { throw new Error('Custom headers must be valid JSON (e.g. {"X-Api-Key":"abc"})'); }
    }
    return opts;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && !target.trim()) { setError('Target base URL or spec URL is required.'); return; }
    if (mode === 'upload' && !file) { setError('Choose a Postman collection or OpenAPI .json to upload.'); return; }
    setIsSubmitting(true); setError(null);
    try {
      const token = getAccessTokenForAPI();
      let opts: Record<string, any>;
      try { opts = buildOptions(); } catch (ve: any) { setError(ve.message); setIsSubmitting(false); return; }

      let res: Response;
      if (mode === 'upload') {
        const fd = new FormData();
        fd.append('file', file as File);
        if (target.trim()) fd.append('target', target.trim());
        fd.append('options', JSON.stringify(opts));
        res = await fetch(`${API}/recon/api-scan/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
          body: fd,
        });
      } else {
        res = await fetch(`${API}/recon/api-scan/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ target: target.trim(), options: opts }),
        });
      }
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      onScanCreated();
      onOpenChange(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start API scan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldAlert className="h-5 w-5 text-primary" />
            API Security Scan
          </DialogTitle>
          <DialogDescription>
            Authenticated OWASP API Top 10 scan — BOLA, broken auth, BFLA, mass assignment,
            SSRF, resource consumption/ReDoS, misconfig, sensitive business flows &amp; more.
            Point at a base/spec URL or drop a Postman collection / OpenAPI spec.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Source mode */}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === 'url' ? 'default' : 'outline'} className="gap-2"
              onClick={() => setMode('url')} disabled={isSubmitting}>
              <Link2 className="h-4 w-4" /> URL / Spec
            </Button>
            <Button type="button" variant={mode === 'upload' ? 'default' : 'outline'} className="gap-2"
              onClick={() => setMode('upload')} disabled={isSubmitting}>
              <Upload className="h-4 w-4" /> Postman / OpenAPI
            </Button>
          </div>

          {mode === 'url' ? (
            <div className="space-y-2">
              <Label htmlFor="api-target" className="text-sm font-medium">Target base URL or spec URL *</Label>
              <Input id="api-target" className="h-11" placeholder="https://api.example.com  or  https://api.example.com/openapi.json"
                value={target} onChange={(e) => setTarget(e.target.value)} disabled={isSubmitting} />
              <p className="text-xs text-muted-foreground">
                A base URL triggers light API recon (spec auto-discovery + common roots); a spec
                URL (openapi.json / swagger.json) is parsed for its full endpoint inventory.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="api-file" className="text-sm font-medium">Postman collection or OpenAPI .json *</Label>
              <Input id="api-file" type="file" accept=".json,application/json"
                className="h-11 cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={isSubmitting} />
              {file && <p className="text-xs text-foreground">Selected: {file.name}</p>}
              <Label htmlFor="api-target2" className="text-sm font-medium mt-2">Base URL override (optional)</Label>
              <Input id="api-target2" className="h-11" placeholder="https://api.example.com"
                value={target} onChange={(e) => setTarget(e.target.value)} disabled={isSubmitting} />
            </div>
          )}

          {/* Auth */}
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium">Authentication (for authenticated scanning)</p>
            <div className="space-y-2">
              <Label htmlFor="api-token" className="text-xs">Primary bearer token</Label>
              <Input id="api-token" className="h-10" placeholder="eyJhbGci… (sent as Authorization: Bearer)"
                value={authToken} onChange={(e) => setAuthToken(e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-cookie" className="text-xs">Cookie (optional)</Label>
              <Input id="api-cookie" className="h-10" placeholder="session=…"
                value={cookie} onChange={(e) => setCookie(e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-token2" className="text-xs">Second (low-privilege) token — enables cross-user BOLA/BFLA</Label>
              <Input id="api-token2" className="h-10" placeholder="token of a different / lower-priv user"
                value={secondToken} onChange={(e) => setSecondToken(e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-headers" className="text-xs">Extra headers (JSON, optional)</Label>
              <Textarea id="api-headers" className="min-h-[60px] font-mono text-xs"
                placeholder='{"X-Api-Key": "abc123"}'
                value={headersText} onChange={(e) => setHeadersText(e.target.value)} disabled={isSubmitting} />
            </div>
          </div>

          {/* Bounded load test */}
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
            <div className="space-y-0.5 pr-3">
              <Label htmlFor="api-load" className="text-sm font-medium">Bounded rate-limit probe</Label>
              <p className="text-xs text-muted-foreground">
                Sends a small capped burst (≤15 requests) to check for missing rate-limiting.
                Off by default and never floods. Only enable on targets you own/authorize.
              </p>
            </div>
            <Switch id="api-load" checked={authorizeLoad} onCheckedChange={setAuthorizeLoad} disabled={isSubmitting} />
          </div>

          {error && (
            <div className="bg-red-500/10 p-3 rounded-md flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <DialogFooter className="gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>)
                : (<><Play className="h-4 w-4" /> Start API Scan</>)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewApiScanDialog;
