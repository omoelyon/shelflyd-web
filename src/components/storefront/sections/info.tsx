'use client';

import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { InfoSection } from '@/lib/storefront/design';

/** Where to find the business and when it's open, as a compact strip. Only the fields the seller filled in show. */
export default function Info({ section }: { section: InfoSection }) {
  const address = section.props.address.trim();
  const hours = section.props.hours.trim();
  const phone = section.props.phone.trim();
  const email = section.props.email.trim();
  if (!address && !hours && !phone && !email) return null;

  const row = 'flex items-start gap-3 text-sm';
  const icon = 'mt-0.5 h-4 w-4 shrink-0 text-primary';
  return (
    <section aria-label="Contact and opening hours" className="max-w-7xl mx-auto px-4 pt-10">
      <div className="grid gap-5 rounded-2xl border border-[#e2e8f0] bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        {address && (
          <div className={row}>
            <MapPin className={icon} aria-hidden="true" />
            <div>
              <p className="font-medium">Find us</p>
              <p className="whitespace-pre-line text-muted-foreground">{address}</p>
            </div>
          </div>
        )}
        {hours && (
          <div className={row}>
            <Clock className={icon} aria-hidden="true" />
            <div>
              <p className="font-medium">Opening hours</p>
              <p className="whitespace-pre-line text-muted-foreground">{hours}</p>
            </div>
          </div>
        )}
        {phone && (
          <div className={row}>
            <Phone className={icon} aria-hidden="true" />
            <div>
              <p className="font-medium">Call</p>
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-muted-foreground transition-colors duration-200 hover:text-foreground hover:underline">
                {phone}
              </a>
            </div>
          </div>
        )}
        {email && (
          <div className={row}>
            <Mail className={icon} aria-hidden="true" />
            <div>
              <p className="font-medium">Email</p>
              <a href={`mailto:${email}`} className="break-all text-muted-foreground transition-colors duration-200 hover:text-foreground hover:underline">
                {email}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
