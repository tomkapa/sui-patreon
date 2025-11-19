/**
 * Tests for AccountSettings component
 *
 * Following TDD principles:
 * - Test user flows end-to-end
 * - Test form validation
 * - Test loading states
 * - Test error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettings } from '../account-settings';

// Mock hooks
vi.mock('@/hooks/useCreatorProfile', () => ({
  useCreatorProfile: vi.fn(),
}));

vi.mock('@/hooks/useTransaction', () => ({
  useTransaction: vi.fn(),
}));

vi.mock('@/lib/api/avatar-upload', () => ({
  uploadAvatar: vi.fn(),
}));

import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { useTransaction } from '@/hooks/useTransaction';
import { uploadAvatar } from '@/lib/api/avatar-upload';

describe('AccountSettings', () => {
  const mockExecute = vi.fn();
  const mockProfile = {
    name: 'Test Creator',
    bio: 'Test bio',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: '1234567890',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (useTransaction as any).mockReturnValue({
      execute: mockExecute,
      isLoading: false,
    });
  });

  describe('when no profile exists', () => {
    beforeEach(() => {
      (useCreatorProfile as any).mockReturnValue({
        profile: null,
        hasProfile: false,
        isLoading: false,
        error: null,
      });
    });

    it('should show message to create profile first', () => {
      render(<AccountSettings />);

      expect(screen.getByText(/you need to create a creator profile first/i)).toBeInTheDocument();
    });
  });

  describe('when profile is loading', () => {
    beforeEach(() => {
      (useCreatorProfile as any).mockReturnValue({
        profile: null,
        hasProfile: false,
        isLoading: true,
        error: null,
      });
    });

    it('should show loading spinner', () => {
      render(<AccountSettings />);

      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });
  });

  describe('when profile exists', () => {
    beforeEach(() => {
      (useCreatorProfile as any).mockReturnValue({
        profile: mockProfile,
        hasProfile: true,
        isLoading: false,
        error: null,
      });
    });

    it('should render form with current profile data', () => {
      render(<AccountSettings />);

      expect(screen.getByLabelText(/page name/i)).toHaveValue('Test Creator');
      expect(screen.getByLabelText(/bio/i)).toHaveValue('Test bio');
      expect(screen.getByAltText(/avatar preview/i)).toHaveAttribute('src', mockProfile.avatarUrl);
    });

    it('should have save and cancel buttons disabled initially', () => {
      render(<AccountSettings />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should enable save button when name is changed', async () => {
      const user = userEvent.setup();
      render(<AccountSettings />);

      const nameInput = screen.getByLabelText(/page name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeEnabled();
    });

    it('should show unsaved changes warning when form is dirty', async () => {
      const user = userEvent.setup();
      render(<AccountSettings />);

      const nameInput = screen.getByLabelText(/page name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
    });

    it('should validate required name field', async () => {
      const user = userEvent.setup();
      render(<AccountSettings />);

      const nameInput = screen.getByLabelText(/page name/i);
      await user.clear(nameInput);
      await user.tab(); // Blur the input

      await waitFor(() => {
        expect(screen.getByText(/page name is required/i)).toBeInTheDocument();
      });
    });

    it('should reset form when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<AccountSettings />);

      // Change name
      const nameInput = screen.getByLabelText(/page name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should revert to original value
      expect(nameInput).toHaveValue('Test Creator');
    });

    it('should handle avatar file selection', async () => {
      const user = userEvent.setup();
      render(<AccountSettings />);

      const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/avatar/i) as HTMLInputElement;

      await user.upload(fileInput, file);

      expect(fileInput.files?.[0]).toBe(file);
      expect(fileInput.files).toHaveLength(1);
    });

    it('should call update_profile with correct arguments on submit', async () => {
      const user = userEvent.setup();
      mockExecute.mockResolvedValue({ digest: 'test-digest' });

      render(<AccountSettings />);

      // Change name and bio
      const nameInput = screen.getByLabelText(/page name/i);
      const bioInput = screen.getByLabelText(/bio/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.clear(bioInput);
      await user.type(bioInput, 'Updated bio');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(Function),
          expect.objectContaining({
            successMessage: 'Profile updated successfully!',
            errorMessage: 'Failed to update profile',
          })
        );
      });
    });

    it('should upload avatar before updating profile', async () => {
      const user = userEvent.setup();
      const mockUploadedUrl = 'https://example.com/new-avatar.jpg';
      (uploadAvatar as any).mockResolvedValue(mockUploadedUrl);
      mockExecute.mockResolvedValue({ digest: 'test-digest' });

      render(<AccountSettings />);

      // Upload new avatar
      const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/avatar/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      // Change name
      const nameInput = screen.getByLabelText(/page name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(uploadAvatar).toHaveBeenCalledWith(file);
        expect(mockExecute).toHaveBeenCalled();
      });
    });

    it('should show loading state during avatar upload', async () => {
      const user = userEvent.setup();
      (uploadAvatar as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('url'), 100))
      );
      mockExecute.mockResolvedValue({ digest: 'test-digest' });

      render(<AccountSettings />);

      // Upload avatar
      const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/avatar/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      // Submit
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should show uploading state
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      expect(screen.getByText(/uploading avatar to storage/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument();
      });
    });

    it('should show loading state during transaction', async () => {
      const user = userEvent.setup();
      (useTransaction as any).mockReturnValue({
        execute: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ digest: 'test' }), 100))
        ),
        isLoading: false,
      });

      render(<AccountSettings />);

      // Change name
      const nameInput = screen.getByLabelText(/page name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Submit
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should show transaction loading state
      await waitFor(() => {
        expect(screen.getByText(/updating profile on blockchain/i)).toBeInTheDocument();
      });
    });
  });
});
