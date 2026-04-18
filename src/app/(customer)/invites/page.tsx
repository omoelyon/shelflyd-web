'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api/teams';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { acceptInviteSchema, type AcceptInviteFormValues } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Mail, Users, CheckCircle } from 'lucide-react';

export default function InvitesPage() {
  const qc = useQueryClient();

  const { data: pendingInvites, isLoading: invLoading } = useQuery({
    queryKey: ['my-invites'],
    queryFn: teamsApi.myPendingInvites,
  });

  const { data: myTeams, isLoading: teamsLoading } = useQuery({
    queryKey: ['my-teams'],
    queryFn: teamsApi.myTeams,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const acceptMutation = useMutation({
    mutationFn: teamsApi.acceptInvite,
    onSuccess: () => {
      toast.success('Invite accepted! You are now a team member.');
      qc.invalidateQueries({ queryKey: ['my-invites'] });
      qc.invalidateQueries({ queryKey: ['my-teams'] });
      reset();
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to accept invite. Check the token.')),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">Invites & Teams</h1>

      {/* Accept with token */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Accept an Invite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => acceptMutation.mutate(d))} className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label className="sr-only">Invite Token</Label>
              <Input placeholder="Paste your invite token..." {...register('token')} />
              {errors.token && <p className="text-xs text-destructive">{errors.token.message}</p>}
            </div>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:opacity-90"
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending invites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Pending Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : pendingInvites?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending invites.</p>
          ) : (
            <div className="space-y-2">
              {pendingInvites?.map((invite) => (
                <div key={invite.uuid} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">Business #{invite.businessId}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs">{invite.role}</Badge>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">PENDING</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground"
                    onClick={() => acceptMutation.mutate({ token: invite.token })}
                    disabled={acceptMutation.isPending}
                  >
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My teams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : myTeams?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">You are not a member of any team.</p>
          ) : (
            <div className="space-y-2">
              {myTeams?.map((member) => (
                <div key={member.uuid} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">Business #{member.businessId}</p>
                    <Badge
                      variant="secondary"
                      className={member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 text-xs' : 'bg-gray-100 text-gray-700 text-xs'}
                    >
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
