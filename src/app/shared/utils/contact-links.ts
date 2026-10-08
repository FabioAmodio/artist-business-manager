import type { Party, PartyContactChannel } from '../../domain/models/party';
import { buildMapsSearchUrl } from './maps-links';

export interface ContactLinks {
  readonly callHref?: string;
  readonly mailHref?: string;
  readonly whatsappHref?: string;
  readonly websiteHref?: string;
}

export const PARTY_CHANNEL_LABELS: Record<PartyContactChannel, string> = {
  email: 'Email', phone: 'Telefono', whatsapp: 'WhatsApp', website: 'Sito web', address: 'Indirizzo',
  facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', twitter: 'X (Twitter)',
  telegram: 'Telegram', linkedin: 'LinkedIn', youtube: 'YouTube', threads: 'Threads', pinterest: 'Pinterest',
};

const SOCIAL_ICONS: Partial<Record<PartyContactChannel, string>> = {
  facebook: '📘', instagram: '📸', tiktok: '🎵', twitter: '✖️', telegram: '✈️',
  linkedin: '💼', youtube: '▶️', threads: '🧵', pinterest: '📌',
};

/** Template url per canale social a partire dal solo handle (senza @); se il valore salvato e' gia' un URL completo si usa quello cosi' com'e' (es. pagina Facebook con ID numerico). */
const SOCIAL_URL_TEMPLATES: Partial<Record<PartyContactChannel, (handle: string) => string>> = {
  facebook: (handle) => `https://facebook.com/${handle}`,
  instagram: (handle) => `https://instagram.com/${handle}`,
  tiktok: (handle) => `https://tiktok.com/@${handle}`,
  twitter: (handle) => `https://x.com/${handle}`,
  telegram: (handle) => `https://t.me/${handle}`,
  linkedin: (handle) => `https://linkedin.com/in/${handle}`,
  youtube: (handle) => `https://youtube.com/@${handle}`,
  threads: (handle) => `https://www.threads.net/@${handle}`,
  pinterest: (handle) => `https://pinterest.com/${handle}`,
};

function normalizeWebsiteUrl(value: string): string {
  return value.startsWith('http') ? value : `https://${value}`;
}

function buildSocialProfileUrl(channel: PartyContactChannel, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, '');
  const template = SOCIAL_URL_TEMPLATES[channel];
  return template ? template(handle) : normalizeWebsiteUrl(value);
}

export interface PartyContactOption {
  readonly channel: PartyContactChannel;
  /** Id del PartyContactMethod quando non e' il campo principale del Party per quel canale (consente piu' recapiti dello stesso canale). */
  readonly methodId?: string;
  readonly value: string;
  readonly label: string;
}

/** Tutti i recapiti configurati di un Party (email/telefono principali + contacts[] per whatsapp/sito/social), deduplicati su canale+valore: base per l'azione "Contatta" e per i selettori canale esistenti (checklist fiera). */
export function partyContactOptions(party: Party): PartyContactOption[] {
  const options: PartyContactOption[] = [];
  if (party.email) options.push({ channel: 'email', value: party.email, label: PARTY_CHANNEL_LABELS.email });
  if (party.phone) {
    options.push({ channel: 'phone', value: party.phone, label: PARTY_CHANNEL_LABELS.phone });
    options.push({ channel: 'whatsapp', value: party.phone, label: PARTY_CHANNEL_LABELS.whatsapp });
  }
  for (const method of party.contacts ?? []) {
    if (options.some((option) => option.channel === method.channel && option.value === method.value)) continue;
    options.push({ channel: method.channel, methodId: method.id, value: method.value, label: method.label ? `${PARTY_CHANNEL_LABELS[method.channel]} (${method.label})` : PARTY_CHANNEL_LABELS[method.channel] });
  }
  return options;
}

export function isPreferredContactOption(party: Party, option: Pick<PartyContactOption, 'channel' | 'methodId'>): boolean {
  if (!party.preferredContactChannel || party.preferredContactChannel !== option.channel) return false;
  return (party.preferredContactMethodId ?? '') === (option.methodId ?? '');
}

export interface ContactSheetAction {
  readonly key: string;
  readonly icon: string;
  readonly label: string;
  readonly href: string;
  /** true = apre in nuova scheda (wa.me, sito web, social); false/assente = navigazione diretta (tel:, mailto:, sms:). */
  readonly external?: boolean;
  readonly preferred: boolean;
}

/** Azioni pronte per l'azione rapida "Contatta" (sulla falsa riga dei Contatti iPhone): Chiama+Messaggio per ogni telefono, WhatsApp/Email dedicati, un'azione "apri profilo/sito" per sito web e ogni social, con il recapito preferito evidenziato. */
export function buildContactSheetActions(party: Party): ContactSheetAction[] {
  const actions: ContactSheetAction[] = [];
  for (const option of partyContactOptions(party)) {
    const preferred = isPreferredContactOption(party, option);
    const suffix = option.label.includes('(') ? ` ${option.label.slice(option.label.indexOf('('))}` : '';
    const label = `${PARTY_CHANNEL_LABELS[option.channel]} ${option.value}${suffix}`;
    if (option.channel === 'phone') {
      const phone = normalizePhone(option.value);
      actions.push({ key: `call:${option.methodId ?? 'main'}`, icon: '📞', label: `Chiama ${option.value}${suffix}`, href: `tel:${phone}`, preferred });
      actions.push({ key: `sms:${option.methodId ?? 'main'}`, icon: '💬', label: `Messaggio ${option.value}${suffix}`, href: `sms:${phone}`, preferred });
    } else if (option.channel === 'whatsapp') {
      actions.push({ key: `whatsapp:${option.methodId ?? 'main'}`, icon: '🟢', label, href: `https://wa.me/${normalizePhone(option.value).replace(/^\+/, '')}`, external: true, preferred });
    } else if (option.channel === 'email') {
      actions.push({ key: `email:${option.methodId ?? 'main'}`, icon: '✉️', label, href: `mailto:${option.value}`, preferred });
    } else if (option.channel === 'address') {
      actions.push({ key: `address:${option.methodId ?? 'main'}`, icon: '📍', label, href: buildMapsSearchUrl(option.value), external: true, preferred });
    } else if (option.channel === 'website') {
      actions.push({ key: `website:${option.methodId ?? 'main'}`, icon: '🌐', label, href: normalizeWebsiteUrl(option.value), external: true, preferred });
    } else {
      actions.push({ key: `${option.channel}:${option.methodId ?? 'main'}`, icon: SOCIAL_ICONS[option.channel] ?? '🌐', label, href: buildSocialProfileUrl(option.channel, option.value), external: true, preferred });
    }
  }
  return actions;
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

/** Link diretto per un canale di contatto Party esplicitamente scelto (es. FairTask.contactChannel): nessuna ambiguita tra i recapiti disponibili. I social riusano websiteHref (azione generica "apri link"). */
export function contactLinksForChannel(channel: PartyContactChannel, value?: string): ContactLinks {
  const trimmed = value?.trim();
  if (!trimmed) return {};
  switch (channel) {
    case 'email': return { mailHref: `mailto:${trimmed}` };
    case 'phone': return { callHref: `tel:${normalizePhone(trimmed)}` };
    case 'whatsapp': return { whatsappHref: `https://wa.me/${normalizePhone(trimmed).replace(/^\+/, '')}` };
    case 'website': return { websiteHref: normalizeWebsiteUrl(trimmed) };
    case 'address': return { websiteHref: buildMapsSearchUrl(trimmed) };
    default: return { websiteHref: buildSocialProfileUrl(channel, trimmed) };
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
