import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import PackageRemediationsTab from './PackageRemediationsTab';
import type { PackageAdvisoryRemediation } from '../types';

const remediations: PackageAdvisoryRemediation[] = [
  {
    advisoryName: 'CVE-2022-40152',
    severity: 'Critical',
    lightwellRelease: '3.14.0.rhlw-00003',
    isLatest: true,
  },
  {
    advisoryName: 'CVE-2022-40151',
    severity: 'Important',
    lightwellRelease: '3.14.0.rhlw-00002',
    isLatest: false,
  },
];

it('renders advisory links that set the name search param', () => {
  render(
    <MemoryRouter initialEntries={['/lightwell/java-remediated/org.json.test/json-test']}>
      <PackageRemediationsTab
        name='json-test'
        version='3.14.0'
        remediations={remediations}
        isLoading={false}
        isFetching={false}
        formatCopyText={(version) => `org.json.test:json-test:${version}`}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole('link', { name: 'CVE-2022-40152' })).toHaveAttribute(
    'href',
    '/lightwell/java-remediated/org.json.test/json-test?name=CVE-2022-40152',
  );
  expect(screen.getByText('Latest')).toBeInTheDocument();
  expect(screen.getByText('3.14.0.rhlw-00003')).toBeInTheDocument();
});

it('replaces the name param when the drawer is already open', () => {
  render(
    <MemoryRouter
      initialEntries={['/lightwell/java-remediated/org.json.test/json-test?name=CVE-2022-40151']}
    >
      <PackageRemediationsTab
        name='json-test'
        version='3.14.0'
        remediations={remediations}
        isLoading={false}
        isFetching={false}
        formatCopyText={(version) => version}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole('link', { name: 'CVE-2022-40152' })).toHaveAttribute(
    'href',
    '/lightwell/java-remediated/org.json.test/json-test?name=CVE-2022-40152',
  );
});
