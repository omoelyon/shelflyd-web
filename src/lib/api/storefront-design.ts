import apiClient from './client';
import type { StorefrontDesign } from '@/lib/storefront/design';

export interface StorefrontDesignState {
  /** The seller's working copy (null until they first save). */
  draft: StorefrontDesign | null;
  /** What shoppers currently see (null = the Classic storefront). */
  published: StorefrontDesign | null;
  /** True when the draft differs from what is published. */
  hasUnpublishedChanges: boolean;
  publishedAt: string | null;
  /** The secret part of the private draft-preview link, or null when no link has been created. */
  previewToken: string | null;
  /** False for team members who may look at the design but not change it (the server also enforces this). */
  canEdit: boolean;
}

export const storefrontDesignApi = {
  get: async (): Promise<StorefrontDesignState> => {
    const res = await apiClient.get('/business/storefront-design');
    return res.data;
  },
  saveDraft: async (design: StorefrontDesign): Promise<StorefrontDesignState> => {
    const res = await apiClient.put('/business/storefront-design', design);
    return res.data;
  },
  publish: async (): Promise<StorefrontDesignState> => {
    const res = await apiClient.post('/business/storefront-design/publish');
    return res.data;
  },
  /** Creates the private draft-preview link (or returns the existing one). Anyone with the link can see the saved draft. */
  createPreviewLink: async (): Promise<StorefrontDesignState> => {
    const res = await apiClient.post('/business/storefront-design/preview-link');
    return res.data;
  },
  /** Replaces the link with a new one; the old link stops working. */
  rotatePreviewLink: async (): Promise<StorefrontDesignState> => {
    const res = await apiClient.post('/business/storefront-design/preview-link/rotate');
    return res.data;
  },
  revokePreviewLink: async (): Promise<StorefrontDesignState> => {
    const res = await apiClient.delete('/business/storefront-design/preview-link');
    return res.data;
  },
  /** Drops the draft and the published design: the store goes back to Classic. */
  reset: async (): Promise<StorefrontDesignState> => {
    const res = await apiClient.delete('/business/storefront-design');
    return res.data;
  },
};
