'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import { AlertCircle, Boxes, Github, Loader2, Play, Upload } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Project {
  id: number;
  project_name: string;
  project_description?: string;
  project_url?: string;
}

interface NewSCAScanDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onScanCreated: () => void;
}

const NewSCAScanDialog = ({ open, onOpenChange, onScanCreated }: NewSCAScanDialogProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [sourceMode, setSourceMode] = useState<'github' | 'upload'>('github');
  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const res = await fetch(`${API}/api/project/`, {
          headers: {
            Authorization: `Bearer ${getAccessTokenForAPI()}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load projects.');
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [open]);

  const resetFields = () => {
    setProjectId('');
    setSourceMode('github');
    setSourceUrl('');
    setFile(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select a project.');
      return;
    }
    if (sourceMode === 'github' && !sourceUrl.trim()) {
      setError('Repository URL is required.');
      return;
    }
    if (sourceMode === 'upload' && !file) {
      setError('Please choose a .zip of your repository.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // GitHub uses JSON; upload uses multipart form-data (with the file).
      const token = getAccessTokenForAPI();
      let res: Response;
      if (sourceMode === 'upload') {
        const fd = new FormData();
        fd.append('project', projectId);
        fd.append('source_file', file as File);
        res = await fetch(`${API}/api/sca-analysis/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: fd,
        });
      } else {
        res = await fetch(`${API}/api/sca-analysis/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            project: parseInt(projectId, 10),
            source_url: sourceUrl.trim(),
          }),
        });
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      onScanCreated();
      onOpenChange(false);
      resetFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start SCA scan. Please try again.');
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
            <Boxes className="h-5 w-5 text-primary" />
            New SCA Scan
          </DialogTitle>
          <DialogDescription>
            Scan a repository&apos;s dependency manifests (requirements.txt, package.json,
            pyproject.toml, pom.xml, Dockerfile) for known CVEs via OSV/NVD, plus a light
            static code pass. Point at a GitHub URL or upload a .zip of a local repo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="sca-project" className="text-sm font-medium">
              Project *
            </Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={isSubmitting || isLoadingProjects}>
              <SelectTrigger id="sca-project" className="h-11">
                <SelectValue placeholder={isLoadingProjects ? 'Loading projects...' : 'Select a project'} />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 && !isLoadingProjects ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">No projects found</div>
                ) : (
                  projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.project_name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {p.project_description || p.project_url}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Source mode toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Source *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={sourceMode === 'github' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setSourceMode('github')}
                disabled={isSubmitting}
              >
                <Github className="h-4 w-4" />
                GitHub URL
              </Button>
              <Button
                type="button"
                variant={sourceMode === 'upload' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setSourceMode('upload')}
                disabled={isSubmitting}
              >
                <Upload className="h-4 w-4" />
                Upload Repo
              </Button>
            </div>
          </div>

          {/* GitHub URL */}
          {sourceMode === 'github' && (
            <div className="space-y-2">
              <Label htmlFor="sca-url" className="text-sm font-medium">
                Repository URL *
              </Label>
              <Input
                id="sca-url"
                className="h-11"
                placeholder="https://github.com/username/repository"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Public GitHub repo URL. We clone it (shallow) and scan its dependency manifests.
              </p>
            </div>
          )}

          {/* Upload local repo (.zip) */}
          {sourceMode === 'upload' && (
            <div className="space-y-2">
              <Label htmlFor="sca-file" className="text-sm font-medium">
                Repository Archive (.zip) *
              </Label>
              <Input
                id="sca-file"
                type="file"
                accept=".zip"
                className="h-11 cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Zip your local repo folder and upload it. We extract and scan its dependency
                manifests (requirements.txt, package.json, pyproject.toml, pom.xml, Dockerfile).
                {file ? <span className="block mt-1 text-foreground">Selected: {file.name}</span> : null}
              </p>
            </div>
          )}

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

export default NewSCAScanDialog;
