'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api/teams';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteTeammateSchema, type InviteTeammateFormValues } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your team members and invites.
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:opacity-90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Active members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Members ({members?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : members?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No team members yet.</p>
          ) : (
            <div className="space-y-2">
              {members?.map((member) => (
                <div key={member.uuid} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {member.userId}
                    </div>
                    <div>
                      <p className="text-sm font-medium">User #{member.userId}</p>
                      <Badge
                        variant="secondary"
                        className={member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 text-xs' : 'bg-gray-100 text-gray-700 text-xs'}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeMemberMutation.mutate(member.uuid)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Pending Invites ({pendingInvites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : pendingInvites.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No pending invites.</p>
          ) : (
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.uuid} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                        PENDING
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {invite.role}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => cancelInviteMutation.mutate(invite.uuid)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((d) => inviteMutation.mutate(d))}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1">
              <Label>Email Address</Label>
              <Input placeholder="colleague@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
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
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:opacity-90"
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
