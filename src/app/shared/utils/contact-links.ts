import type { PartyContactChannel } from '../../domain/models/party';

export interface ContactLinks {
  readonly callHref?: string;
  readonly mailHref?: string;
  readonly whatsappHref?: string;
  readonly websiteHref?: string;
}

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{6,}\d)/;

/** Link diretti per i campi strutturati (es. organizzatore di FairSeries): nessun parsing necessario. */
export function contactLinksFromStructured(email?: string, phone?: string): ContactLinks {
  return {
    mailHref: email?.trim() ? `mailto:${email.trim()}` : undefined,
    callHref: phone?.trim() ? `tel:${normalizePhone(phone)}` : undefined,
    whatsappHref: phone?.trim() ? `https://wa.me/${normalizePhone(phone).replace(/^\+/, '')}` : undefined,
  };
}

/** Link diretto per un canale di contatto Party esplicitamente scelto (es. FairTask.contactChannel): nessuna ambiguita tra i recapiti disponibili. */
export function contactLinksForChannel(channel: PartyContactChannel, value?: string): ContactLinks {
  const trimmed = value?.trim();
  if (!trimmed) return {};
  switch (channel) {
    case 'email': return { mailHref: `mailto:${trimmed}` };
    case 'phone': return { callHref: `tel:${normalizePhone(trimmed)}` };
    case 'whatsapp': return { whatsappHref: `https://wa.me/${normalizePhone(trimmed).replace(/^\+/, '')}` };
    case 'website': return { websiteHref: trimmed.startsWith('http') ? trimmed : `https://${trimmed}` };
    default: return {};
  }
}

/** Euristica best-effort per testo libero (es. FairTask.contactInfo): nessuna garanzia di riconoscimento. */
export function contactLinksFromFreeText(text?: string): ContactLinks {
  if (!text?.trim()) return {};
  const email = text.match(EMAIL_PATTERN)?.[0];
  const phone = text.match(PHONE_PATTERN)?.[0];
  return {
    mailHref: email ? `mailto:${email}` : undefined,
    callHref: phone ? `tel:${normalizePhone(phone)}` : undefined,
    whatsappHref: phone ? `https://wa.me/${normalizePhone(phone).replace(/^\+/, '')}` : undefined,
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s().-]/g, '');
}
