import apiClient from './client';
import type { Subscription, SubscriptionCheckout } from '@/types';

export const subscriptionApi = {
  /** Owner: plan state, key dates, saved card and charge history */
  get: async (): Promise<Subscription> => {
    const res = await apiClient.get('/business/subscription');
    return res.data;
  },

  /** Owner: start a Paystack checkout for one month of the plan */
  pay: async (): Promise<SubscriptionCheckout> => {
    const res = await apiClient.post('/business/subscription/pay');
    return res.data;
  },

  /** Owner: start the small card-verification charge that saves a card for automatic renewal */
  addCard: async (): Promise<SubscriptionCheckout> => {
    const res = await apiClient.post('/business/subscription/card');
    return res.data;
  },

  /** Confirms a returned Paystack payment. Safe to call more than once. */
  verify: async (reference: string): Promise<Subscription> => {
    const res = await apiClient.post('/business/subscription/verify', { reference });
    return res.data;
  },

  setAutoRenew: async (enabled: boolean): Promise<Subscription> => {
    const res = await apiClient.put('/business/subscription/auto-renew', { enabled });
    return res.data;
  },

  removeCard: async (): Promise<Subscription> => {
    const res = await apiClient.delete('/business/subscription/card');
    return res.data;
  },
};
