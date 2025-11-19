/**
 * Integration test for useCreatorProfile hook
 *
 * This test verifies that the profile detection logic works correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCreatorProfile } from '../useCreatorProfile';

// Mock the Sui client and dapp-kit hooks
vi.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: vi.fn(),
  useSuiClient: vi.fn(),
}));

vi.mock('@/lib/sui/constants', () => ({
  PROFILE_REGISTRY: '0xtest_registry_id',
}));

describe('useCreatorProfile', () => {
  const mockClient = {
    getObject: vi.fn(),
    getDynamicFieldObject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const { useCurrentAccount, useSuiClient } = require('@mysten/dapp-kit');
    useSuiClient.mockReturnValue(mockClient);
  });

  it('should return null profile when user is not connected', async () => {
    const { useCurrentAccount } = require('@mysten/dapp-kit');
    useCurrentAccount.mockReturnValue(null);

    const { result } = renderHook(() => useCreatorProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.hasProfile).toBe(false);
  });

  it('should return null profile when user has no creator profile on blockchain', async () => {
    const { useCurrentAccount } = require('@mysten/dapp-kit');
    useCurrentAccount.mockReturnValue({
      address: '0x123abc',
    });

    // Mock registry object
    mockClient.getObject.mockResolvedValue({
      data: {
        content: {
          dataType: 'moveObject',
          fields: {
            profiles: {
              fields: {
                id: {
                  id: '0xtable_id',
                },
              },
            },
          },
        },
      },
    });

    // Mock dynamic field query - simulate profile not found
    mockClient.getDynamicFieldObject.mockRejectedValue(
      new Error('Dynamic field not found')
    );

    const { result } = renderHook(() => useCreatorProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.hasProfile).toBe(false);
    expect(mockClient.getDynamicFieldObject).toHaveBeenCalledWith({
      parentId: '0xtable_id',
      name: {
        type: 'address',
        value: '0x123abc',
      },
    });
  });

  it('should return profile data when user has a creator profile', async () => {
    const { useCurrentAccount } = require('@mysten/dapp-kit');
    useCurrentAccount.mockReturnValue({
      address: '0x123abc',
    });

    // Mock registry object
    mockClient.getObject.mockResolvedValue({
      data: {
        content: {
          dataType: 'moveObject',
          fields: {
            profiles: {
              fields: {
                id: {
                  id: '0xtable_id',
                },
              },
            },
          },
        },
      },
    });

    // Mock dynamic field query - profile exists
    mockClient.getDynamicFieldObject.mockResolvedValue({
      data: {
        content: {
          dataType: 'moveObject',
          fields: {
            value: {
              fields: {
                name: 'Alice Creator',
                bio: 'Digital artist and content creator',
                avatar_url: 'https://example.com/avatar.jpg',
                created_at: '1234567890000',
              },
            },
          },
        },
      },
    });

    const { result } = renderHook(() => useCreatorProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toEqual({
      name: 'Alice Creator',
      bio: 'Digital artist and content creator',
      avatarUrl: 'https://example.com/avatar.jpg',
      createdAt: '1234567890000',
    });
    expect(result.current.hasProfile).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const { useCurrentAccount } = require('@mysten/dapp-kit');
    useCurrentAccount.mockReturnValue({
      address: '0x123abc',
    });

    // Mock registry object query failure
    mockClient.getObject.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreatorProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.hasProfile).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should refetch when user address changes', async () => {
    const { useCurrentAccount } = require('@mysten/dapp-kit');

    // Start with first user
    useCurrentAccount.mockReturnValue({
      address: '0x111',
    });

    mockClient.getObject.mockResolvedValue({
      data: {
        content: {
          dataType: 'moveObject',
          fields: {
            profiles: {
              fields: {
                id: {
                  id: '0xtable_id',
                },
              },
            },
          },
        },
      },
    });

    mockClient.getDynamicFieldObject.mockRejectedValue(
      new Error('Profile not found')
    );

    const { result, rerender } = renderHook(() => useCreatorProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasProfile).toBe(false);

    // Change to second user with profile
    useCurrentAccount.mockReturnValue({
      address: '0x222',
    });

    mockClient.getDynamicFieldObject.mockResolvedValue({
      data: {
        content: {
          dataType: 'moveObject',
          fields: {
            value: {
              fields: {
                name: 'Bob Creator',
                bio: 'Video creator',
                avatar_url: 'https://example.com/bob.jpg',
                created_at: '9876543210000',
              },
            },
          },
        },
      },
    });

    rerender();

    await waitFor(() => {
      expect(result.current.hasProfile).toBe(true);
    });

    expect(result.current.profile?.name).toBe('Bob Creator');
  });
});
