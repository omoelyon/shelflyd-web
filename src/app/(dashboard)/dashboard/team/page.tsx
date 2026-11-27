'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Loader2, Mail, MoreHorizontal, Pencil, Plus, RotateCw, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import { teamsApi } from '@/lib/api/teams';
import { cn, getApiError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import type { Permission, PermissionInfo, TeamInviteView, TeamMemberView, TeamRoleView, TeamView } from '@/types/team';

const card = 'rounded-2xl bg-white shadow-card-md';

/** A team: the owner and members with their roles, pending invites, and the roles the business has made. */
export default function TeamPage() {
  const { data: team, isLoading } = useQuery({ queryKey: ['team'], queryFn: teamsApi.team });
  const [tab, setTab] = useState<'people' | 'roles'>('people');
  const [inviting, setInviting] = useState(false);
  const [editingRole, setEditingRole] = useState<TeamRoleView | 'new' | null>(null);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Team"
        subtitle="Who helps run the business, and what each role can do."
        action={
          team?.canManage ? (
            <Button onClick={() => setInviting(true)} className="bg-[#091426] text-white hover:bg-[#091426]/90">
              <UserPlus className="mr-1.5 h-4 w-4" /> Invite someone
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-1.5" role="tablist" aria-label="Team sections">
        {(['people', 'roles'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-sm font-semibold',
              tab === t ? 'bg-[#091426] text-white' : 'bg-white text-[#64748b] shadow-sm hover:text-[#091426]',
            )}
          >
            {t === 'people' ? 'People' : 'Roles'}
            {team && <span className={cn('ml-1.5 tabular-nums', tab === t ? 'text-white/70' : 'text-[#94a3b8]')}>{t === 'people' ? team.members.length + 1 : team.roles.length}</span>}
          </button>
        ))}
      </div>

      {isLoading || !team ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : tab === 'people' ? (
        <People team={team} onInvite={() => setInviting(true)} />
      ) : (
        <Roles team={team} onEdit={setEditingRole} />
      )}

      {inviting && team && <InviteDialog team={team} onClose={() => setInviting(false)} onNewRole={() => { setInviting(false); setTab('roles'); setEditingRole('new'); }} />}
      {editingRole && team && <RoleDialog team={team} role={editingRole === 'new' ? null : editingRole} onClose={() => setEditingRole(null)} />}
    </div>
  );
}

// ─── People ─────────────────────────────────────────────────────────────────

function People({ team, onInvite }: { team: TeamView; onInvite: () => void }) {
  return (
    <div className="space-y-6">
      <section className={card + ' divide-y divide-[#f1f5f9]'} aria-label="People on the team">
        <PersonRow name={team.owner.name} email={team.owner.email} me={team.owner.me} right={<RoleChip name="Owner" strong />} />
        {team.members.map((m) => (
          <MemberRow key={m.uuid} member={m} team={team} />
        ))}
        {team.members.length === 0 && (
          <div className="px-5 py-6 text-sm text-[#64748b]">
            Nobody else is on the team yet.{' '}
            {team.canManage && (
              <button type="button" onClick={onInvite} className="font-semibold text-[#0058be] hover:underline">
                Invite someone
              </button>
            )}
          </div>
        )}
      </section>

      {team.canManage && team.invites.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[#091426]">Invitations waiting</h2>
          <div className={card + ' divide-y divide-[#f1f5f9]'}>
            {team.invites.map((i) => (
              <InviteRow key={i.uuid} invite={i} />
            ))}
          </div>
        </section>
      )}

      {!team.canManage && (
        <p className="text-xs text-[#64748b]">
          You&apos;re {team.me.owner ? 'the owner' : `on the team as ${team.me.roleName}`}. To change the team or roles, ask the business owner.
        </p>
      )}
    </div>
  );
}

function PersonRow({ name, email, me, right, sub }: { name: string | null; email: string | null; me?: boolean; right: React.ReactNode; sub?: string }) {
  const initials = (name ?? email ?? '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#091426] text-xs font-semibold text-white" aria-hidden="true">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#091426]">
          {name ?? email}
          {me && <span className="ml-1.5 text-xs font-normal text-[#64748b]">(you)</span>}
        </p>
        <p className="truncate text-xs text-[#64748b]">{sub ?? email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{right}</div>
    </div>
  );
}

function RoleChip({ name, strong }: { name: string; strong?: boolean }) {
  return (
    <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', strong ? 'bg-[#091426] text-white' : 'bg-[#eff4ff] text-[#0058be]')}>{name}</span>
  );
}

function MemberRow({ member, team }: { member: TeamMemberView; team: TeamView }) {
  const qc = useQueryClient();
  const change = useMutation({
    mutationFn: (roleId: number) => teamsApi.changeRole(member.uuid, roleId),
    onSuccess: (m) => {
      toast.success(`${member.name ?? member.email} is now ${m.roleName}.`);
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (e) => toast.error(getApiError(e, 'Could not change the role.')),
  });
  const remove = useMutation({
    mutationFn: () => teamsApi.removeMember(member.uuid),
    onSuccess: () => {
      toast.success(`${member.name ?? member.email} was removed from the team.`);
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (e) => toast.error(getApiError(e, 'Could not remove them.')),
  });
  const editable = team.canManage && !member.me;
  return (
    <PersonRow
      name={member.name}
      email={member.email}
      me={member.me}
      right={
        editable ? (
          <>
            <Select value={member.roleId != null ? String(member.roleId) : ''} onValueChange={(v) => change.mutate(Number(v))} disabled={change.isPending}>
              <SelectTrigger className="h-8 w-40 text-xs" aria-label={`Role for ${member.name ?? member.email}`}>
                <SelectValue>{member.roleName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {team.roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${member.name ?? member.email}`}
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Remove ${member.name ?? member.email} from the team? They lose access straight away.`)) remove.mutate();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <RoleChip name={member.roleName} />
        )
      }
    />
  );
}

function daysLeft(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return days <= 0 ? null : days === 1 ? 'expires tomorrow' : `expires in ${days} days`;
}

function inviteLink(token: string) {
  return `${window.location.origin}/invites?token=${token}`;
}

function InviteRow({ invite }: { invite: TeamInviteView }) {
  const qc = useQueryClient();
  const resend = useMutation({
    mutationFn: () => teamsApi.resendInvite(invite.uuid),
    onSuccess: () => {
      toast.success(`Invite sent again to ${invite.email}. The link works for another 7 days.`);
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (e) => toast.error(getApiError(e, 'Could not resend the invite.')),
  });
  const cancel = useMutation({
    mutationFn: () => teamsApi.cancelInvite(invite.uuid),
    onSuccess: () => {
      toast.success('Invite cancelled. The link no longer works.');
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (e) => toast.error(getApiError(e, 'Could not cancel the invite.')),
  });
  const left = daysLeft(invite.expiresAt);
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]" aria-hidden="true">
        <Mail className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#091426]">{invite.email}</p>
        <p className="truncate text-xs text-[#64748b]">
          {invite.roleName}
          {invite.invitedBy && ` · invited by ${invite.invitedBy}`}
          {' · '}
          {invite.expired ? <span className="font-semibold text-amber-700">expired</span> : (left ?? 'waiting')}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Options for the invite to ${invite.email}`} />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!invite.expired && (
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(inviteLink(invite.token));
                toast.success('Invite link copied. Send it to them directly if the email doesn’t arrive.');
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy invite link
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => resend.mutate()} disabled={resend.isPending}>
            <RotateCw className="mr-2 h-4 w-4" /> {invite.expired ? 'Send a new link' : 'Resend email'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => cancel.mutate()} disabled={cancel.isPending} className="text-rose-700">
            <X className="mr-2 h-4 w-4" /> Cancel invite
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Roles ──────────────────────────────────────────────────────────────────

function groupByModule(catalog: PermissionInfo[]) {
  const groups = new Map<string, PermissionInfo[]>();
  for (const p of catalog) groups.set(p.module, [...(groups.get(p.module) ?? []), p]);
  return [...groups.entries()];
}

function Roles({ team, onEdit }: { team: TeamView; onEdit: (role: TeamRoleView | 'new') => void }) {
  const qc = useQueryClient();
  const labels = useMemo(() => new Map(team.permissionCatalog.map((p) => [p.key, p.label])), [team.permissionCatalog]);
  const del = useMutation({
    mutationFn: (role: TeamRoleView) => teamsApi.deleteRole(role.id),
    onSuccess: (_, role) => {
      toast.success(`The ${role.name} role was deleted.`);
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (e) => toast.error(getApiError(e, 'Could not delete the role.')),
  });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#64748b]">Make roles that fit how your business works, and choose what each can do. The owner can always do everything.</p>
        {team.canManage && (
          <Button variant="outline" size="sm" onClick={() => onEdit('new')}>
            <Plus className="mr-1 h-4 w-4" /> New role
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {team.roles.map((r) => (
          <article key={r.id} className={card + ' flex flex-col p-4'}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-[#091426]">{r.name}</h3>
                <p className="text-xs text-[#64748b]">
                  {r.members} {r.members === 1 ? 'person' : 'people'}
                  {r.description && ` · ${r.description}`}
                </p>
              </div>
              {team.canManage && (
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${r.name}`} onClick={() => onEdit(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${r.name}`}
                    disabled={del.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete the ${r.name} role?`)) del.mutate(r);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {r.permissions.length === 0 ? (
                <li className="text-xs text-[#94a3b8]">No permissions yet</li>
              ) : (
                r.permissions.map((p) => (
                  <li key={p} className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-medium text-[#334155]">
                    {labels.get(p) ?? p}
                  </li>
                ))
              )}
            </ul>
          </article>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-[#64748b]">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Payouts, billing and buying AI credit always stay with the owner.
      </p>
    </div>
  );
}

function RoleDialog({ team, role, onClose }: { team: TeamView; role: TeamRoleView | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [perms, setPerms] = useState<Set<Permission>>(new Set(role?.permissions ?? []));
  // Someone who isn't the owner can only give out what they have themselves.
  const mine = new Set(team.me.permissions);
  const grantable = (p: Permission) => team.me.owner || mine.has(p);

  const save = useMutation({
    mutationFn: () => {
      const body = { name: name.trim(), description: description.trim() || undefined, permissions: [...perms] };
      return role ? teamsApi.updateRole(role.id, body) : teamsApi.createRole(body);
    },
    onSuccess: (r) => {
      toast.success(role ? `${r.name} updated.` : `${r.name} created. You can now invite people with it.`);
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['my-access'] });
      onClose();
    },
    onError: (e) => toast.error(getApiError(e, 'Could not save the role.')),
  });

  const toggle = (p: Permission) =>
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? `Edit ${role.name}` : 'New role'}</DialogTitle>
          <DialogDescription>Name the role and tick what people with it can do.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Role name</Label>
            <Input id="role-name" value={name} maxLength={40} placeholder="e.g. Cashier, Store manager" onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-desc">
              What it&apos;s for <span className="font-normal text-[#64748b]">(optional)</span>
            </Label>
            <Textarea id="role-desc" rows={2} maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-[#091426]">Can</legend>
            {groupByModule(team.permissionCatalog).map(([module, list]) => (
              <div key={module} className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">{module}</p>
                {list.map((p) => {
                  const allowed = grantable(p.key);
                  return (
                    <label
                      key={p.key}
                      className={cn('flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#f8f9ff]', !allowed && 'cursor-not-allowed opacity-50')}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-[#091426]"
                        checked={perms.has(p.key)}
                        disabled={!allowed}
                        onChange={() => toggle(p.key)}
                      />
                      <span>
                        <span className="block text-sm text-[#091426]">{p.label}</span>
                        <span className="block text-xs text-[#64748b]">{allowed ? p.description : 'Only the owner can give this out.'}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}
          </fieldset>
          <p className="text-xs text-[#64748b]">Payouts, billing and buying AI credit always stay with the owner.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || save.isPending} className="bg-[#091426] text-white hover:bg-[#091426]/90">
              {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {role ? 'Save role' : 'Create role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inviting ───────────────────────────────────────────────────────────────

function InviteDialog({ team, onClose, onNewRole }: { team: TeamView; onClose: () => void; onNewRole: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<number | null>(team.roles.find((r) => r.name === 'Staff')?.id ?? team.roles[0]?.id ?? null);
  const role = team.roles.find((r) => r.id === roleId);
  const labels = new Map(team.permissionCatalog.map((p) => [p.key, p.label]));
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const send = useMutation({
    mutationFn: () => teamsApi.invite({ email: email.trim(), roleId: roleId! }),
    onSuccess: (invite) => {
      navigator.clipboard?.writeText(inviteLink(invite.token)).catch(() => undefined);
      toast.success(`Invite sent to ${invite.email}. The link is also copied, in case the email doesn’t arrive.`);
      qc.invalidateQueries({ queryKey: ['team'] });
      onClose();
    },
    onError: (e) => toast.error(getApiError(e, 'Could not send the invite.')),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite someone</DialogTitle>
          <DialogDescription>They get an email with a link that works for 7 days.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (validEmail && roleId) send.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <Input id="invite-email" type="email" autoFocus autoComplete="off" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={roleId != null ? String(roleId) : ''} onValueChange={(v) => setRoleId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role">{role?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {team.roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {role && (
              <p className="text-xs leading-relaxed text-[#64748b]">
                {role.permissions.length === 0 ? 'This role has no permissions yet.' : `Can: ${role.permissions.map((p) => labels.get(p) ?? p).join(', ')}.`}
              </p>
            )}
            <button type="button" onClick={onNewRole} className="text-xs font-semibold text-[#0058be] hover:underline">
              Need a different role? Create one
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!validEmail || !roleId || send.isPending} className="bg-[#091426] text-white hover:bg-[#091426]/90">
              {send.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Send invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
