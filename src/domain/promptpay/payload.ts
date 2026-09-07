import { crc16CcittFalse } from './crc';
import type { PromptPayIdentifierType } from './types';

const PROMPTPAY_AID = 'A000000677010111';

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
}

export function normalizePromptPayIdentifier(
  identifierType: PromptPayIdentifierType,
  raw: string,
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (identifierType === 'mobile') {
    if (!/^[+\d\s()-]+$/.test(trimmed)) return null;
    const compact = trimmed.replace(/[\s()-]/g, '');
    const local = compact.startsWith('+66')
      ? `0${compact.slice(3)}`
      : compact.startsWith('66') && compact.length === 11
        ? `0${compact.slice(2)}`
        : compact;
    return /^0[689]\d{8}$/.test(local) ? local : null;
  }

  if (!/^[\d\s-]+$/.test(trimmed)) return null;
  const compact = trimmed.replace(/[\s-]/g, '');
  return /^\d{13}$/.test(compact) ? compact : null;
}

function encodeProxy(identifierType: PromptPayIdentifierType, normalized: string): string {
  if (identifierType === 'mobile') {
    return tlv('01', `0066${normalized.slice(1)}`);
  }
  return tlv('02', normalized);
}

export function formatPromptPayAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const formatted = amount.toFixed(2);
  if (!/^\d+\.\d{2}$/.test(formatted) || formatted.length > 13 || Number(formatted) <= 0) return null;
  return formatted;
}

export function buildPromptPayPayload(
  identifierType: PromptPayIdentifierType,
  normalizedIdentifier: string,
  amount?: number,
): string {
  const merchantInfo = tlv('00', PROMPTPAY_AID) + encodeProxy(identifierType, normalizedIdentifier);
  const formattedAmount = amount === undefined ? undefined : formatPromptPayAmount(amount);
  if (formattedAmount === null) {
    throw new RangeError('PromptPay amount must be a positive decimal that fits the Thai QR amount field.');
  }
  const amountField = formattedAmount === undefined ? '' : tlv('54', formattedAmount);
  const payloadWithoutCrc = [
    tlv('00', '01'),
    tlv('01', amount === undefined ? '11' : '12'),
    tlv('29', merchantInfo),
    tlv('53', '764'),
    amountField,
    tlv('58', 'TH'),
    '6304',
  ].join('');

  return `${payloadWithoutCrc}${crc16CcittFalse(payloadWithoutCrc)}`;
}
