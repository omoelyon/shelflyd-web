import apiClient from './client';
import type { Brief, BriefSetting, InsightCompare, InsightOverview, InsightRange } from '@/types/insights';

export interface InsightOverviewParams {
  range: InsightRange;
  /** The last day of the period, YYYY-MM-DD in Lagos time. */
  date?: string;
  /** Only meaningful for a single day: against the same weekday last week, or the day before. */
  compare?: InsightCompare;
}

export const insightsApi = {
  getOverview: async (params: InsightOverviewParams): Promise<InsightOverview> => {
    const res = await apiClient.get('/business/insights/overview', { params });
    return res.data;
  },

  getBrief: async (): Promise<Brief> => {
    const res = await apiClient.get('/business/insights/brief');
    return res.data;
  },

  getBriefSetting: async (): Promise<BriefSetting> => {
    const res = await apiClient.get('/business/settings/daily-brief');
    return res.data;
  },

  setBriefSetting: async (enabled: boolean): Promise<BriefSetting> => {
    const res = await apiClient.patch('/business/settings/daily-brief', { enabled });
    return res.data;
  },
};
