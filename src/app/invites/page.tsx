'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Clock, Loader2, Store, XCircle } from 'lucide-react';
import { teamsApi } from '@/lib/api/teams';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardUrl } from '@/lib/storefront/url';
import { getApiError } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { InvitePreview } from '@/types/team';

/**
 * Where a team invite link lands (app.shelflyd.com/invites?token=…). Shows the business, the role and who invited
 * them before anything else; then signs them in or up with the invited email, and accepting opens the dashboard.
 */
export default function InvitesPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-[#f8f9ff] px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-[#091426]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#091426] text-white" aria-hidden="true">
          <Store className="h-4 w-4" />
        </span>
        Shelflyd
      </Link>
      <Suspense fallback={<Skeleton className="h-72 w-full max-w-md rounded-2xl" />}>
        <InviteContent />
      </Suspense>
    </div>
  );
}

function InviteContent() {
  const token = useSearchParams().get('token')?.trim() ?? '';
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => teamsApi.preview(token),
    enabled: token.length > 0,
    retry: false,
    meta: { silentError: true },
  });

  if (!token) return <MyInvites />;
  if (isLoading) return <Skeleton className="h-72 w-full max-w-md rounded-2xl" />;
  if (isError || !data) {
    return (
      <Panel>
        <Status icon={<XCircle className="h-5 w-5" />} tone="bad" title="This invite link isn't valid" text={getApiError(error, 'Ask the business to send you a new invite.')} />
      </Panel>
    );
  }
  return <InviteCard invite={data} token={token} />;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <main className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(9,20,38,0.08)] sm:p-8">{children}</main>;
}

function Status({ icon, tone, title, text }: { icon: React.ReactNode; tone: 'good' | 'bad' | 'wait'; title: string; text: string }) {
  const color = tone === 'good' ? 'bg-emerald-50 text-emerald-700' : tone === 'bad' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700';
  return (
    <div className="space-y-3 text-center">
      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${color}`} aria-hidden="true">
        {icon}
      </div>
      <h1 className="text-lg font-bold text-[#091426]">{title}</h1>
      <p className="text-sm text-[#64748b]">{text}</p>
    </div>
  );
}

function InviteCard({ invite, token }: { invite: InvitePreview; token: string }) {
  const { user, isAuthenticated, hasHydrated, authChecked, logout } = useAuthStore();
  // join=1 marks a visit that means "join now" (the email's button, or coming back from signing in): once signed in
  // with the invited email, the invite is accepted without another click.
  const here = `/invites?token=${encodeURIComponent(token)}&join=1`;
  const joinNow = useSearchParams().get('join') === '1';
  const withEmail = (path: string) => `${path}?email=${encodeURIComponent(invite.email)}&from=${encodeURIComponent(here)}`;
  const checking = !hasHydrated || (!authChecked && !isAuthenticated);
  const signedInAs = isAuthenticated ? user?.email ?? null : null;
  const rightPerson = !!signedInAs && signedInAs.toLowerCase() === invite.email.toLowerCase();

  const accept = useMutation({
    mutationFn: () => teamsApi.acceptInvite(token),
    onSuccess: (access) => {
      toast.success(`Welcome to ${invite.businessName}. You're on the team as ${access.roleName}.`);
      // Full page load: the dashboard reads the new team membership fresh.
      window.location.assign(dashboardUrl('/dashboard'));
    },
    onError: (e) => toast.error(getApiError(e, 'Could not accept the invite.')),
  });

  // Join straight away when they came to join and are signed in as the invited person (once per visit).
  const autoJoined = useRef(false);
  useEffect(() => {
    if (joinNow && rightPerson && invite.status === 'PENDING' && !autoJoined.current) {
      autoJoined.current = true;
      accept.mutate();
    }
  }, [joinNow, rightPerson, invite.status, accept]);

  const switchAccount = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    logout();
    window.location.assign(withEmail('/auth/login'));
  };

  if (invite.status === 'ACCEPTED') {
    return (
      <Panel>
        <Status icon={<Check className="h-5 w-5" />} tone="good" title="This invite has been accepted" text={`If it was you, ${invite.businessName} is in your dashboard.`} />
        <Link href={dashboardUrl('/dashboard')} className={buttonVariants({ className: 'mt-6 w-full bg-[#091426] text-white hover:bg-[#091426]/90' })}>
          Open the dashboard
        </Link>
      </Panel>
    );
  }
  if (invite.status === 'CANCELLED' || invite.status === 'EXPIRED') {
    const expired = invite.status === 'EXPIRED';
    return (
      <Panel>
        <Status
          icon={expired ? <Clock className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          tone={expired ? 'wait' : 'bad'}
          title={expired ? 'This invite has expired' : 'This invite was cancelled'}
          text={`Ask ${invite.invitedBy ?? invite.businessName} to send you a new one.`}
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex flex-col items-center text-center">
        {invite.businessLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={invite.businessLogo} alt="" className="h-14 w-14 rounded-xl object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#091426] text-xl font-bold text-white" aria-hidden="true">
            {invite.businessName.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="mt-4 text-sm text-[#64748b]">{invite.invitedBy ? `${invite.invitedBy} invited you to join` : 'You’re invited to join'}</p>
        <h1 className="text-xl font-bold text-[#091426]">{invite.businessName}</h1>
        <p className="mt-1 text-sm text-[#334155]">
          as <span className="font-semibold">{invite.roleName}</span>
        </p>
      </div>

      {invite.canDo.length > 0 && (
        <div className="mt-6 rounded-xl bg-[#f8f9ff] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">You&apos;ll be able to</p>
          <ul className="mt-2 space-y-1.5">
            {invite.canDo.map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm text-[#091426]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {checking ? (
          <Skeleton className="h-10 w-full rounded-lg" />
        ) : rightPerson ? (
          <Button className="h-11 w-full bg-[#091426] text-white hover:bg-[#091426]/90" disabled={accept.isPending} onClick={() => accept.mutate()}>
            {accept.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {accept.isPending ? 'Joining…' : `Join ${invite.businessName}`}
          </Button>
        ) : signedInAs ? (
          <>
            <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              You&apos;re signed in as {signedInAs}, but this invite is for <span className="font-semibold">{invite.email}</span>.
            </p>
            <Button variant="outline" className="h-11 w-full" onClick={switchAccount}>
              Sign in as {invite.email}
            </Button>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-[#64748b]">
              {invite.hasAccount ? 'Sign in with ' : 'Create your Shelflyd account with '}
              <span className="font-semibold text-[#091426]">{invite.email}</span>
              {invite.hasAccount ? ' to join. You’ll go straight to the dashboard.' : ' to join. It takes about a minute.'}
            </p>
            {invite.hasAccount ? (
              <Link href={withEmail('/auth/login')} className={buttonVariants({ className: 'h-11 w-full bg-[#091426] text-white hover:bg-[#091426]/90' })}>
                Sign in to join
              </Link>
            ) : (
              <>
                <Link href={withEmail('/auth/register')} className={buttonVariants({ className: 'h-11 w-full bg-[#091426] text-white hover:bg-[#091426]/90' })}>
                  Create my account
                </Link>
                <Link href={withEmail('/auth/login')} className={buttonVariants({ variant: 'outline', className: 'h-11 w-full' })}>
                  I already have an account
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}

/** Opened without a link: their own pending invites, if signed in. */
function MyInvites() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['my-invites'],
    queryFn: teamsApi.myPendingInvites,
    enabled: hasHydrated && isAuthenticated,
  });
  if (!isAuthenticated) {
    return (
      <Panel>
        <Status icon={<Clock className="h-5 w-5" />} tone="wait" title="Open the link in your invite email" text="Team invites come with their own link. Ask the business to resend it if you can’t find it." />
      </Panel>
    );
  }
  return (
    <Panel>
      <h1 className="text-lg font-bold text-[#091426]">Your team invites</h1>
      {isLoading ? (
        <Skeleton className="mt-4 h-14 rounded-xl" />
      ) : !data?.length ? (
        <p className="mt-2 text-sm text-[#64748b]">No invites waiting for you.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {data.map((i) => (
            <li key={i.uuid}>
              <Link href={`/invites?token=${encodeURIComponent(i.token)}`} className="block rounded-xl border border-[#eef2f7] px-4 py-3 text-sm font-semibold text-[#091426] hover:bg-[#f8f9ff]">
                Open invite →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
