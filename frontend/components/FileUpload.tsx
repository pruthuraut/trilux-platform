'use client'
import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedFileTypes?: string[] | null;
  onFilesAdded?: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  maxFiles = 10,
  maxSizeInMB = 10,
  acceptedFileTypes = null,
  onFilesAdded = () => { }
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File) => {
    if (file.size > maxSizeInMB * 1024 * 1024) {
      throw new Error(`File ${file.name} is too large. Maximum size is ${maxSizeInMB}MB`);
    }
    if (acceptedFileTypes && !acceptedFileTypes.includes(file.type)) {
      throw new Error(`File ${file.name} is not an accepted file type`);
    }
    return true;
  }, [maxSizeInMB, acceptedFileTypes]);

  const handleFiles = useCallback((files: FileList) => {
    try {
      setError(null);
      const newFiles = Array.from(files);
      if (uploadedFiles.length + newFiles.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`);
      }
      newFiles.forEach(validateFile);
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      onFilesAdded(updatedFiles);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [uploadedFiles, maxFiles, validateFile, onFilesAdded]);

  {/*drag: modified */ }
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dataTransfer = e.dataTransfer;
    if (dataTransfer && dataTransfer.files) {
      handleFiles(dataTransfer.files);
    }
  }, [handleFiles]);

  {/*drag: modified End*/ }


  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((indexToRemove: number) => {
    setUploadedFiles(files => {
      const newFiles = files.filter((_, index) => index !== indexToRemove);
      onFilesAdded(newFiles);
      return newFiles;
    });
  }, [onFilesAdded]);

  return (
    <div className="w-full space-y-4">
      <style jsx global>{`
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .icon-border {
          position: relative;
        }

        .icon-border::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          border: 2px dashed hsl(var(--primary) / 0.5);
          animation: rotate 10s linear infinite;
        }

        @keyframes slide-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .file-item-enter {
          animation: slide-in 0.4s ease-out forwards;
        }
      `}</style>

      <div
        className={`relative flex flex-col items-center justify-center w-full h-72 
    rounded-xl border-2 transition-all duration-500 ease-out
    ${dragActive
            ? 'border-primary bg-primary/10 scale-[1.02] shadow-xl shadow-primary/20'
            : 'border-border hover:border-primary/50 bg-background'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className={`absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent 
          rounded-xl transition-opacity duration-500 ${dragActive ? 'opacity-100' : 'opacity-0'}`} />

        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          onChange={handleFileInput}
          multiple
          accept={acceptedFileTypes?.join(',')}
        />

        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer z-10"
        >
          <div className={`flex flex-col items-center justify-center p-6 transition-all duration-500 
            ${dragActive ? 'scale-110' : ''}`}>
            <div className="icon-border relative mb-6">
              <div className={`p-6 rounded-full bg-primary/10 transition-all duration-500
                ${dragActive ? 'bg-primary/20 scale-110' : ''}`}>
                <Upload
                  className={`w-12 h-12 transition-all duration-500
                    ${dragActive ? 'text-primary stroke-[1.5]' : 'text-primary/70'}`}
                />
              </div>
            </div>
            <div className="inline-block px-6 py-2">
              <p className="text-lg font-semibold text-foreground">
                <span className="text-primary hover:underline">Click to upload</span> or drag and drop
              </p>
            </div>
            {acceptedFileTypes && (
              <p className="text-sm text-muted-foreground mt-4">
                Accepted files: {acceptedFileTypes.join(', ')}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Max file size: {maxSizeInMB}MB (up to {maxFiles} files)
            </p>
          </div>
        </label>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="file-item-enter flex items-center justify-between p-4 
                bg-muted rounded-lg border border-border hover:border-primary/30
                hover:shadow-md transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-2 hover:bg-destructive/10 rounded-full transition-all duration-300
                  hover:scale-110 group"
              >
                <X className="w-5 h-5 text-muted-foreground group-hover:text-destructive 
                  transition-colors duration-300" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
