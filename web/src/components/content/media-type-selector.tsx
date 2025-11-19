'use client';

import { Button } from '@/components/ui/button';
import { MediaType } from '@/types';
import { Image as ImageIcon, Music, Paperclip, Video, X } from 'lucide-react';
import { useState } from 'react';
import { MediaUploadModal } from './media-upload-modal';

interface MediaTypeSelectorProps {
  selectedType?: MediaType;
  onTypeSelect: (type: MediaType | undefined) => void;
  onFilesChanged?: (preview: File | null, exclusive: File | null) => void;
  selectedFiles?: { preview: File | null; exclusive: File | null };
}

const mediaTypes: Array<{
  type: MediaType;
  icon: typeof Video;
  label: string;
}> = [
  { type: 'video', icon: Video, label: 'Video' },
  { type: 'audio', icon: Music, label: 'Audio' },
  { type: 'image', icon: ImageIcon, label: 'Image' },
  { type: 'attachment', icon: Paperclip, label: 'Attachment' },
];

export function MediaTypeSelector({
  selectedType,
  onTypeSelect,
  onFilesChanged,
  selectedFiles,
}: MediaTypeSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<MediaType | null>(null);
  const [localSelectedFiles, setLocalSelectedFiles] = useState<{
    preview: File | null;
    exclusive: File | null;
  }>(selectedFiles || { preview: null, exclusive: null });

  const hasSelectedFiles =
    localSelectedFiles.preview !== null ||
    localSelectedFiles.exclusive !== null;

  const handleTypeClick = (type: MediaType) => {
    // If files are already selected, don't allow changing type
    if (hasSelectedFiles && selectedType !== type) {
      return;
    }

    setModalType(type);
    setModalOpen(true);
  };

  const handleFilesChanged = (preview: File | null, exclusive: File | null) => {
    if (preview && exclusive) {
      setLocalSelectedFiles({ preview, exclusive });
      onFilesChanged?.(preview, exclusive);
      if (modalType) {
        onTypeSelect(modalType);
      }
    }
  };

  const handleClear = () => {
    setLocalSelectedFiles({ preview: null, exclusive: null });
    onTypeSelect(undefined);
    onFilesChanged?.(null, null);
  };

  return (
    <>
      <div className='flex flex-wrap items-center gap-2'>
        {mediaTypes.map(({ type, icon: Icon, label }) => {
          const isSelected = selectedType === type;
          const isDisabled = hasSelectedFiles && !isSelected;
          const hasFilesForThisType = isSelected && hasSelectedFiles;

          return (
            <Button
              key={type}
              type='button'
              variant={isSelected ? 'default' : 'outline'}
              size='sm'
              onClick={() => handleTypeClick(type)}
              disabled={isDisabled}
              className='relative gap-2'
            >
              <Icon className='h-4 w-4' />
              {label}
              {hasFilesForThisType && (
                <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                  ✓
                </span>
              )}
            </Button>
          );
        })}
        {hasSelectedFiles && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleClear}
            className='gap-2 text-muted-foreground hover:text-destructive'
          >
            <X className='h-4 w-4' />
            Clear
          </Button>
        )}
      </div>

      {modalType && (
        <MediaUploadModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          mediaType={modalType}
          onFilesChanged={handleFilesChanged}
          initialFiles={
            selectedType === modalType && hasSelectedFiles
              ? localSelectedFiles
              : undefined
          }
        />
      )}
    </>
  );
}
