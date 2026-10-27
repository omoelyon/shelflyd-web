import apiClient from './client';
import type { Bank, PayoutAccount, SavePayoutAccountRequest } from '@/types';

export const payoutApi = {
  /** Owner: banks a payout account can be held at */
  listBanks: async (): Promise<Bank[]> => {
    const res = await apiClient.get('/business/payout/banks');
    return res.data;
  },

  /** Owner: look up the account holder's name so it can be confirmed before saving */
  resolveAccount: async (bankCode: string, accountNumber: string): Promise<{ accountName: string }> => {
    const res = await apiClient.get('/business/payout/resolve', { params: { bankCode, accountNumber } });
    return res.data;
  },

  getAccount: async (): Promise<PayoutAccount> => {
    const res = await apiClient.get('/business/payout-account');
    return res.data;
  },

  saveAccount: async (data: SavePayoutAccountRequest): Promise<PayoutAccount> => {
    const res = await apiClient.put('/business/payout-account', data);
    return res.data;
  },
};
