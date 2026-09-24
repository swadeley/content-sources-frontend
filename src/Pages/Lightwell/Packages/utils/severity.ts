export type AdvisorySeverity = 'Critical' | 'Important' | 'Moderate' | 'Low' | 'None';

export const ADVISORY_SEVERITIES: AdvisorySeverity[] = [
  'Critical',
  'Important',
  'Moderate',
  'Low',
  'None',
];

export const normalizeAdvisorySeverity = (severityScore: number): AdvisorySeverity => {
  if (severityScore === 0) {
    return 'None';
  }

  if (severityScore >= 9.0) {
    return 'Critical';
  }

  if (severityScore >= 7.0) {
    return 'Important';
  }

  return severityScore >= 4.0 ? 'Moderate' : 'Low';
};
