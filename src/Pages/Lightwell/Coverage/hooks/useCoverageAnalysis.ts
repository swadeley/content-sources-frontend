import { useState, useEffect } from 'react';
import {
  useCreateCoverageReportMutation,
  useCoverageReportQuery,
} from 'services/Lightwell/CoverageReportsQueries';
import { validateManifestFile } from '../utils/validateManifestFile';
import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';
import { LIGHTWELL_USE_MOCK } from 'Pages/Lightwell/constants';

export type ProcessStep = 'select' | 'uploading' | 'analyzing' | 'complete' | 'error';
export type FileUploadStatus = 'success' | 'error' | 'default';

const POLLING_RETRY_LIMIT = 40;
const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const MOCK_REPORT: CompletedCoverageReport = {
  uuid: 'mock-report',
  status: 'completed',
  created_at: '2026-08-18T00:00:00Z',
  completed_at: '2026-08-18T00:00:01Z',
  total: 2000,
  exact_matches: 1380,
  partial_matches: 340,
  unmatched: 280,
  ecosystem_coverage_summary: [
    { ecosystem: 'maven',  total: 650, exact_matches: 450, partial_matches: 110, unmatched: 90 },
    { ecosystem: 'npm',    total: 550, exact_matches: 380, partial_matches: 90,  unmatched: 80 },
    { ecosystem: 'pypi',   total: 400, exact_matches: 270, partial_matches: 70,  unmatched: 60 },
    { ecosystem: 'crates', total: 200, exact_matches: 140, partial_matches: 40,  unmatched: 20 },
    { ecosystem: 'go',     total: 150, exact_matches: 100, partial_matches: 20,  unmatched: 30 },
    { ecosystem: 'nuget',  total: 50,  exact_matches: 40,  partial_matches: 10,  unmatched: 0  },
  ],
};

export const useCoverageAnalysis = () => {
  if (LIGHTWELL_USE_MOCK) {
    return {
      filename: 'Vuln-Report_2026-08-18.csv',
      report: MOCK_REPORT,
      uploadProps: {
        file: undefined,
        fileError: undefined,
        processError: undefined,
        validated: 'default' as FileUploadStatus,
        isLoading: false,
        onDropAccepted: () => undefined,
        onClearClick: () => undefined,
        onRetry: () => undefined,
      },
      startOver: () => undefined,
    };
  }
  const [step, setStep] = useState<ProcessStep>('select');
  const [file, setFile] = useState<File | undefined>();
  const [reportUUID, setReportUUID] = useState('');
  const [fileError, setFileError] = useState<string | undefined>();
  const [processError, setProcessError] = useState<string | undefined>();
  const [pollCount, setPollCount] = useState(0);

  const isPolling = step === 'analyzing' && pollCount <= POLLING_RETRY_LIMIT;
  const createReport = useCreateCoverageReportMutation();
  const { data: report, isError: isPollingError } = useCoverageReportQuery(reportUUID, isPolling);

  useEffect(() => {
    if (step !== 'analyzing') return;
    setPollCount((count) => count + 1);

    if (!report) return;
    if (report.status === 'completed') {
      setStep('complete');
    } else if (report.status === 'failed') {
      setProcessError('Analysis could not be completed');
      setStep('error');
    }
  }, [report, step]);

  useEffect(() => {
    if (pollCount > POLLING_RETRY_LIMIT) {
      setProcessError('Analysis is taking longer than expected');
      setStep('error');
      return;
    }
    if (isPollingError) {
      setProcessError('Could not retrieve analysis results');
      setStep('error');
    }
  }, [pollCount, isPollingError]);

  // Uses dropzoneProps.onDropAccepted instead of onFileInputChange to avoid a PF bug
  // where onFileInputChange fires twice when selecting a file via the browser dialog
  const handleFileAccepted = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File exceeds the ${MAX_FILE_SIZE_MB}MB size limit. Please try a smaller file.`);
      setFile(selectedFile);
      return;
    }
    if (!validateManifestFile(selectedFile)) {
      setFileError('Could not detect format. Please check your file.');
      setFile(selectedFile);
      return;
    }
    setFileError(undefined);
    setFile(selectedFile);
    setStep('uploading');
    createReport.mutate(selectedFile, {
      onSuccess: (data) => {
        if (data.status === 'failed') {
          setProcessError('Could not start analysis');
          setStep('error');
          return;
        }
        setReportUUID(data.uuid);
        setStep('analyzing');
      },
      onError: () => {
        setProcessError('Could not upload your file');
        setStep('error');
      },
    });
  };

  const handleClearFile = () => {
    setStep('select');
    setFile(undefined);
    setFileError(undefined);
  };

  const startOver = () => {
    setStep('select');
    setFile(undefined);
    setReportUUID('');
    setFileError(undefined);
    setProcessError(undefined);
    setPollCount(0);
  };

  const validated: FileUploadStatus = fileError
    ? 'error'
    : file && step !== 'select' && step !== 'error'
      ? 'success'
      : 'default';

  const completedReport: CompletedCoverageReport | undefined =
    report?.status === 'completed' ? report : undefined;

  return {
    filename: file?.name,
    report: completedReport,
    uploadProps: {
      file,
      fileError,
      processError,
      validated,
      isLoading: step === 'uploading' || step === 'analyzing',
      onDropAccepted: handleFileAccepted,
      onClearClick: handleClearFile,
      onRetry: startOver,
    },
    startOver,
  };
};
