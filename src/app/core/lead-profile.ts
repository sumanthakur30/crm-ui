/** Qualification details stored on an existing lead `attributes.profile` map. */

export interface LeadProfileFields {
  designation: string;
  industry: string;
  location: string;
  requirements: string;
  expectedPurchaseDate: string;
  nextFollowUpDate: string;
}

const PROFILE_KEYS: Array<keyof LeadProfileFields> = [
  'designation',
  'industry',
  'location',
  'requirements',
  'expectedPurchaseDate',
  'nextFollowUpDate',
];

export function emptyLeadProfile(): LeadProfileFields {
  return {
    designation: '',
    industry: '',
    location: '',
    requirements: '',
    expectedPurchaseDate: '',
    nextFollowUpDate: '',
  };
}

export function readLeadProfile(
  attributes: Record<string, unknown> | null | undefined
): LeadProfileFields {
  const out = emptyLeadProfile();
  const raw = attributes?.['profile'];
  if (!raw || typeof raw !== 'object') {
    return out;
  }
  const profile = raw as Record<string, unknown>;
  for (const key of PROFILE_KEYS) {
    const value = profile[key];
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  return out;
}

/** Merge profile fields into attributes. Other keys, including qualification answers, stay. */
export function mergeLeadProfile(
  attributes: Record<string, unknown> | null | undefined,
  profile: LeadProfileFields
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(attributes || {}) };
  const stored: Record<string, string> = {};
  for (const key of PROFILE_KEYS) {
    const value = (profile[key] || '').trim();
    if (value) {
      stored[key] = value;
    }
  }
  if (Object.keys(stored).length) {
    next['profile'] = stored;
  } else {
    delete next['profile'];
  }
  return next;
}

export function isFollowUpOverdue(nextFollowUpDate: string, todayIso: string): boolean {
  const due = (nextFollowUpDate || '').trim();
  const today = (todayIso || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return false;
  }
  return due < today;
}
