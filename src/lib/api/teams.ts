import apiClient from './client';
import type { TeamInvite } from '@/types';
import type { InvitePreview, MyAccess, PermissionInfo, RoleRequest, TeamInviteView, TeamMemberView, TeamRoleView, TeamView } from '@/types/team';

export const teamsApi = {
  /** Owner, members, roles, pending invites (for those who manage the team) and my own access. */
  team: async (): Promise<TeamView> => (await apiClient.get('/business/team')).data,

  /** What I may do for my business. */
  me: async (): Promise<MyAccess> => (await apiClient.get('/business/team/me')).data,

  permissions: async (): Promise<PermissionInfo[]> => (await apiClient.get('/business/team/permissions')).data,

  createRole: async (data: RoleRequest): Promise<TeamRoleView> => (await apiClient.post('/business/team/roles', data)).data,

  updateRole: async (roleId: number, data: RoleRequest): Promise<TeamRoleView> => (await apiClient.put(`/business/team/roles/${roleId}`, data)).data,

  deleteRole: async (roleId: number): Promise<void> => {
    await apiClient.delete(`/business/team/roles/${roleId}`);
  },

  invite: async (data: { email: string; roleId: number }): Promise<TeamInviteView> => (await apiClient.post('/business/team/invite', data)).data,

  resendInvite: async (inviteUuid: string): Promise<TeamInviteView> => (await apiClient.post(`/business/team/invites/${inviteUuid}/resend`)).data,

  cancelInvite: async (inviteUuid: string): Promise<void> => {
    await apiClient.delete(`/business/team/invites/${inviteUuid}`);
  },

  changeRole: async (memberUuid: string, roleId: number): Promise<TeamMemberView> => (await apiClient.patch(`/business/team/${memberUuid}/role`, { roleId })).data,

  removeMember: async (memberUuid: string): Promise<void> => {
    await apiClient.delete(`/business/team/${memberUuid}`);
  },

  // ─── The invited person's side ───

  /** Public: what an invite link is for. */
  preview: async (token: string): Promise<InvitePreview> => (await apiClient.get('/invites/preview', { params: { token } })).data,

  acceptInvite: async (token: string): Promise<MyAccess> => (await apiClient.post('/invites/accept', { token })).data,

  myPendingInvites: async (): Promise<TeamInvite[]> => (await apiClient.get('/invites')).data,
};
