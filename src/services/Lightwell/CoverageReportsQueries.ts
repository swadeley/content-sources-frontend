import { useMutation, useQuery } from '@tanstack/react-query';

import { createCoverageReport, getCoverageReport } from './CoverageReportsApi';

export const COVERAGE_REPORT_KEY = 'COVERAGE_REPORT_KEY';

const COVERAGE_REPORT_POLLING_TIME = 5000;

export const useCoverageReportQuery = (uuid: string, polling = false) =>
  useQuery({
    queryKey: [COVERAGE_REPORT_KEY, uuid],
    queryFn: () => getCoverageReport(uuid),
    enabled: !!uuid,
    retry: false, // Surface errors immediately, the user can restart via "Analyze another file"
    refetchInterval: polling ? COVERAGE_REPORT_POLLING_TIME : undefined,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: polling,
    meta: {
      title: 'Error loading coverage report',
      id: 'get-coverage-report-error',
    },
  });

// Errors are handled inline by the calling hook (useCoverageAnalysis)
export const useCreateCoverageReportMutation = () =>
  useMutation({ mutationFn: (file: File) => createCoverageReport(file) });
