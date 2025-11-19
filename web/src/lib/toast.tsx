/**
 * Custom Toast Utilities
 *
 * Provides styled toast notifications that match the application theme.
 * Uses Sonner with custom styling and icons.
 */

import { toast as sonnerToast, ExternalToast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { createElement } from 'react';

interface ToastOptions extends ExternalToast {
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Success toast with custom icon and styling
 */
export function success(message: string, options?: ToastOptions) {
  return sonnerToast.success(message, {
    ...options,
    icon: createElement(CheckCircle2, {
      className: 'h-6 w-6 text-green-500'
    }),
  });
}

/**
 * Error toast with custom icon and styling
 */
export function error(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, {
    ...options,
    icon: createElement(XCircle, {
      className: 'h-6 w-6 text-red-500'
    }),
  });
}

/**
 * Info toast with custom icon and styling
 */
export function info(message: string, options?: ToastOptions) {
  return sonnerToast.info(message, {
    ...options,
    icon: createElement(Info, {
      className: 'h-6 w-6 text-blue-500'
    }),
  });
}

/**
 * Warning toast with custom icon and styling
 */
export function warning(message: string, options?: ToastOptions) {
  return sonnerToast.warning(message, {
    ...options,
    icon: createElement(AlertCircle, {
      className: 'h-6 w-6 text-yellow-500'
    }),
  });
}

/**
 * Loading toast with spinner
 */
export function loading(message: string, options?: ToastOptions) {
  return sonnerToast.loading(message, {
    ...options,
    icon: createElement(Loader2, {
      className: 'h-6 w-6 animate-spin text-primary'
    }),
  });
}

/**
 * Transaction toast - shows transaction info with explorer link
 */
export function transaction(
  message: string,
  txDigest: string,
  options?: Omit<ToastOptions, 'action'>
) {
  const explorerUrl = `https://suiscan.xyz/testnet/tx/${txDigest}`;

  return info(message, {
    ...options,
    description: `TX: ${txDigest.slice(0, 8)}...${txDigest.slice(-6)}`,
    action: {
      label: 'View',
      onClick: () => window.open(explorerUrl, '_blank'),
    },
  });
}

/**
 * Promise toast - shows loading, success, and error states automatically
 */
export function promise<T>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) {
  return sonnerToast.promise(promise, {
    loading: options.loading,
    success: options.success,
    error: options.error,
    icon: createElement(Loader2, {
      className: 'h-6 w-6 animate-spin text-primary'
    }),
  });
}

// Export the base toast for custom usage
export const toast = {
  success,
  error,
  info,
  warning,
  loading,
  transaction,
  promise,
  // Expose Sonner's dismiss and custom
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
};
