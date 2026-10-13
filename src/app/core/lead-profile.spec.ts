import { isFollowUpOverdue, mergeLeadProfile, readLeadProfile } from './lead-profile';

describe('lead profile attributes', () => {
  it('keeps qualification answers when the profile is saved', () => {
    const merged = mergeLeadProfile(
      {
        qualification: { schemaCode: 'BANT', answers: { budget: 'yes' } },
      },
      {
        designation: ' Owner ',
        industry: 'Wholesale',
        location: 'Noida',
        requirements: 'GST billing',
        expectedPurchaseDate: '2026-11-01',
        nextFollowUpDate: '2026-10-20',
      }
    );

    expect(merged['qualification']).toEqual({ schemaCode: 'BANT', answers: { budget: 'yes' } });
    expect(readLeadProfile(merged).designation).toBe(' Owner ');
    expect(readLeadProfile(merged).industry).toBe('Wholesale');
  });

  it('drops a blank profile so an empty edit does not leave an empty object', () => {
    const merged = mergeLeadProfile(
      { profile: { designation: 'Buyer' }, qualification: { schemaCode: 'BANT' } },
      {
        designation: '  ',
        industry: '',
        location: '',
        requirements: '',
        expectedPurchaseDate: '',
        nextFollowUpDate: '',
      }
    );
    expect(merged['profile']).toBeUndefined();
    expect(merged['qualification']).toEqual({ schemaCode: 'BANT' });
  });

  it('marks only a past ISO follow-up date as overdue', () => {
    expect(isFollowUpOverdue('2026-10-12', '2026-10-13')).toBeTrue();
    expect(isFollowUpOverdue('2026-10-13', '2026-10-13')).toBeFalse();
    expect(isFollowUpOverdue('', '2026-10-13')).toBeFalse();
    expect(isFollowUpOverdue('tomorrow', '2026-10-13')).toBeFalse();
  });
});
