'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api/teams';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteTeammateSchema, type InviteTeammateFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import StatusBadge from '@/components/ui/status-badge';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { UserPlus, Users, X, Mail } from 'lucide-react';

export default function DashboardTeamPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const qc = useQueryClient();

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: teamsApi.listMembers,
  });

  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ['team-invites'],
    queryFn: teamsApi.listInvites,
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<InviteTeammateFormValues>({
    resolver: zodResolver(inviteTeammateSchema),
    defaultValues: { role: 'MEMBER' },
  });

  const inviteMutation = useMutation({
    mutationFn: teamsApi.invite,
    onSuccess: () => {
      toast.success('Invite sent!');
      qc.invalidateQueries({ queryKey: ['team-invites'] });
      setInviteDialogOpen(false);
      reset();
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to send invite.')),
  });

  const removeMemberMutation = useMutation({
    mutationFn: teamsApi.removeMember,
    onSuccess: () => {
      toast.success('Member removed.');
      qc.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to remove member.')),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: teamsApi.cancelInvite,
    onSuccess: () => {
      toast.success('Invite cancelled.');
      qc.invalidateQueries({ queryKey: ['team-invites'] });
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to cancel invite.')),
  });

  const pendingInvites = invites?.filter((i) => i.status === 'PENDING') ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        subtitle="Manage your team members and invites."
        action={
          <Button
            onClick={() => setInviteDialogOpen(true)}
            className="bg-[#091426] text-white hover:bg-[#091426]/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        }
      />

      {/* ── Active members ── */}
      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f1f5f9]">
          <Users className="h-4 w-4 text-[#64748b]" />
          <p className="font-semibold text-sm text-[#091426] font-heading">
            Active Members ({members?.length ?? 0})
          </p>
        </div>
        <div className="p-4">
          {membersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : !members?.length ? (
            <EmptyState
              icon={Users}
              title="No team members yet"
              subtitle="Invite colleagues to help manage your store."
              action={{ label: 'Invite Someone', onClick: () => setInviteDialogOpen(true) }}
            />
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.uuid}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0058be] font-semibold text-sm shrink-0">
                      {member.userId}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#091426]">User #{member.userId}</p>
                      <StatusBadge status={member.role} type="role" raw />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeMemberMutation.mutate(member.uuid)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Pending invites ── */}
      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f1f5f9]">
          <Mail className="h-4 w-4 text-[#64748b]" />
          <p className="font-semibold text-sm text-[#091426] font-heading">
            Pending Invites ({pendingInvites.length})
          </p>
        </div>
        <div className="p-4">
          {invitesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : !pendingInvites.length ? (
            <EmptyState
              icon={Mail}
              title="No pending invites"
              subtitle="Sent invitations will appear here until accepted."
            />
          ) : (
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.uuid}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#091426]">{invite.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={invite.status} type="invite" />
                      <StatusBadge status={invite.role} type="role" raw />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => cancelInviteMutation.mutate(invite.uuid)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Invite dialog ── */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit((d) => inviteMutation.mutate(d))}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">Email Address</Label>
              <Input placeholder="colleague@example.com" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#091426] text-white hover:bg-[#091426]/90"
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
