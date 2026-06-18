import apiClient from './client';
import type {
  TeamMember,
  TeamInvite,
  InviteTeammateRequest,
  AcceptInviteRequest,
} from '@/types';

export const teamsApi = {
  listMembers: async (): Promise<TeamMember[]> => {
    const res = await apiClient.get('/business/team');
    return res.data;
  },

  invite: async (data: InviteTeammateRequest): Promise<TeamInvite> => {
    const res = await apiClient.post('/business/team/invite', data);
    return res.data;
  },

  removeMember: async (memberUuid: string): Promise<void> => {
    await apiClient.delete(`/business/team/${memberUuid}`);
  },

  listInvites: async (): Promise<TeamInvite[]> => {
    const res = await apiClient.get('/business/team/invites');
    return res.data;
  },

  cancelInvite: async (inviteUuid: string): Promise<TeamInvite> => {
    const res = await apiClient.delete(`/business/team/invites/${inviteUuid}`);
    return res.data;
  },

  acceptInvite: async (data: AcceptInviteRequest): Promise<TeamMember> => {
    const res = await apiClient.post('/invites/accept', data);
    return res.data;
  },

  myPendingInvites: async (): Promise<TeamInvite[]> => {
    const res = await apiClient.get('/invites');
    return res.data;
  },

  myTeams: async (): Promise<TeamMember[]> => {
    const res = await apiClient.get('/invites/my-teams');
    return res.data;
  },
};
