'use client';

import { Button } from '@/components/ui/button';
import { File, Upload, X } from 'lucide-react';
import { DragEvent, useCallback, useState } from 'react';

interface FileUploadSectionProps {
  previewFile: File | null;
  exclusiveFile: File | null;
  onFilesChanged: (preview: File | null, exclusive: File | null) => void;
}

// Validate file type
const isValidImageFile = (file: File): boolean => {
  return file.type.toLowerCase().startsWith('image/');
};

export function FileUploadSection({
  previewFile,
  exclusiveFile,
  onFilesChanged,
}: FileUploadSectionProps) {
  const [previewDragActive, setPreviewDragActive] = useState(false);
  const [exclusiveDragActive, setExclusiveDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (file: File | null, type: 'preview' | 'exclusive') => {
      if (!file) {
        if (type === 'preview') {
          onFilesChanged(null, exclusiveFile);
        } else {
          onFilesChanged(previewFile, null);
        }
        setError(null);
        return;
      }

      // Validate preview file must be an image
      if (type === 'preview' && !isValidImageFile(file)) {
        setError('Preview file must be an image.');
        return;
      }

      setError(null);
      if (type === 'preview') {
        onFilesChanged(file, exclusiveFile);
      } else {
        onFilesChanged(previewFile, file);
      }
    },
    [previewFile, exclusiveFile, onFilesChanged]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, type: 'preview' | 'exclusive') => {
      e.preventDefault();
      e.stopPropagation();
      if (type === 'preview') {
        setPreviewDragActive(true);
      } else {
        setExclusiveDragActive(true);
      }
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>, type: 'preview' | 'exclusive') => {
      e.preventDefault();
      e.stopPropagation();
      if (type === 'preview') {
        setPreviewDragActive(false);
      } else {
        setExclusiveDragActive(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, type: 'preview' | 'exclusive') => {
      e.preventDefault();
      e.stopPropagation();
      if (type === 'preview') {
        setPreviewDragActive(false);
      } else {
        setExclusiveDragActive(false);
      }

      const file = e.dataTransfer.files?.[0] || null;
      handleFileSelect(file, type);
    },
    [handleFileSelect]
  );

  const FileDropZone = ({
    file,
    type,
    dragActive,
  }: {
    file: File | null;
    type: 'preview' | 'exclusive';
    dragActive: boolean;
  }) => (
    <div
      className={`relative flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${dragActive
        ? 'border-primary bg-primary/10'
        : file
          ? 'border-primary/50 bg-primary/5'
          : 'border-muted-foreground/25 bg-muted/10'
        }`}
      onDragOver={(e) => handleDragOver(e, type)}
      onDragLeave={(e) => handleDragLeave(e, type)}
      onDrop={(e) => handleDrop(e, type)}
    >
      <input
        type='file'
        accept={type === 'preview' ? 'image/*' : '*/*'}
        className='absolute inset-0 cursor-pointer opacity-0'
        onChange={(e) => {
          const selectedFile = e.target.files?.[0] || null;
          handleFileSelect(selectedFile, type);
        }}
      />
      {file ? (
        <div className='flex flex-col items-center gap-2 p-4'>
          <File className='h-12 w-12 text-primary' />
          <p className='text-sm font-medium'>{file.name}</p>
          <p className='text-xs text-muted-foreground'>
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={(e) => {
              e.stopPropagation();
              handleFileSelect(null, type);
            }}
            className='mt-2'
          >
            <X className='mr-2 h-4 w-4' />
            Remove
          </Button>
        </div>
      ) : (
        <div className='flex flex-col items-center gap-2 p-4 text-center'>
          <Upload className='h-12 w-12 text-muted-foreground' />
          <p className='text-sm font-medium'>
            Drop {type === 'preview' ? 'preview' : 'exclusive'} file here
          </p>
          <p className='text-xs text-muted-foreground'>or click to browse</p>
        </div>
      )}
    </div>
  );

  return (
    <div className='space-y-4 rounded-lg border bg-card p-6'>
      <div>
        <h3 className='text-lg font-semibold'>File Uploads</h3>
        <p className='text-sm text-muted-foreground mt-1'>
          Both preview and exclusive files are required. Preview must be an image.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <label className='text-sm font-medium flex items-center gap-1'>
            Preview File <span className='text-destructive'>*</span>
          </label>
          <FileDropZone
            file={previewFile}
            type='preview'
            dragActive={previewDragActive}
          />
          <p className='text-xs text-muted-foreground'>
            Image preview for your content (required)
          </p>
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium flex items-center gap-1'>
            Exclusive File <span className='text-destructive'>*</span>
          </label>
          <FileDropZone
            file={exclusiveFile}
            type='exclusive'
            dragActive={exclusiveDragActive}
          />
          <p className='text-xs text-muted-foreground'>
            Content for your subscribers (required)
          </p>
        </div>
      </div>

      {error && (
        <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded'>
          {error}
        </p>
      )}

      <div className='rounded-md bg-muted/30 px-4 py-3'>
        <p className='text-sm text-muted-foreground'>
          Files are stored and encrypted by Walrus & Seal.{' '}
          <a
            href='https://docs.wal.app/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary underline-offset-4 hover:underline'
          >
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
}
