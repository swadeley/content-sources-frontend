import axios from 'axios';

export type EcosystemCoverageSummary = {
  ecosystem: string;
  exact_matches: number;
  partial_matches: number;
  unmatched: number;
  total: number;
};

type CoverageReportBase = {
  uuid: string;
  created_at: string;
  input_format?: string;
  analysis_task_uuid?: string;
};

type PendingCoverageReport = CoverageReportBase & {
  status: 'pending';
};

export type CompletedCoverageReport = CoverageReportBase & {
  status: 'completed';
  exact_matches: number;
  partial_matches: number;
  unmatched: number;
  total: number;
  ecosystem_coverage_summary: EcosystemCoverageSummary[];
  completed_at: string;
};

type FailedCoverageReport = CoverageReportBase & {
  status: 'failed';
  analysis_task_error?: string;
};

export type CoverageReportResponse =
  PendingCoverageReport | CompletedCoverageReport | FailedCoverageReport;

export const createCoverageReport = async (file: File): Promise<CoverageReportResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axios.post<CoverageReportResponse>(
    '/api/content-sources/v1/coverage_reports/',
    formData,
  );
  return data;
};

export const getCoverageReport = async (uuid: string): Promise<CoverageReportResponse> => {
  const { data } = await axios.get<CoverageReportResponse>(
    `/api/content-sources/v1/coverage_reports/${encodeURIComponent(uuid)}`,
  );
  return data;
};
