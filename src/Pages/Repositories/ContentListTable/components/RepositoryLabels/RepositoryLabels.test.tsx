import { render, screen } from '@testing-library/react';
import { RepositoryLabels } from './RepositoryLabels';
import { ContentOrigin } from 'services/Content/ContentApi';

jest.mock('middleware/AppContext', () => ({
  useAppContext: jest.fn(() => ({
    features: { partnerrepos: { enabled: false, accessible: false } },
  })),
}));

it('shows Upload and in-progress labels when marking as partner', () => {
  render(
    <RepositoryLabels origin={ContentOrigin.UPLOAD} isRepoBeingMarkedAsPartner isPartner={false} />,
  );

  expect(screen.getByText('Upload')).toBeInTheDocument();
  expect(screen.getByText('Marking as Partnered in progress')).toBeInTheDocument();
  expect(screen.queryByText('Partnered')).not.toBeInTheDocument();
});

it('shows Upload and Partnered labels when partner', () => {
  render(
    <RepositoryLabels origin={ContentOrigin.UPLOAD} isRepoBeingMarkedAsPartner={false} isPartner />,
  );

  expect(screen.getByText('Upload')).toBeInTheDocument();
  expect(screen.getByText('Partnered')).toBeInTheDocument();
  expect(screen.queryByText('Marking as Partnered in progress')).not.toBeInTheDocument();
});

it('shows Community label for COMMUNITY origin when partnerrepos is off', () => {
  render(
    <RepositoryLabels
      origin={ContentOrigin.COMMUNITY}
      isRepoBeingMarkedAsPartner={false}
      isPartner={false}
    />,
  );

  expect(screen.getByText('Community')).toBeInTheDocument();
});

it('shows Published label when publishState.published is true', () => {
  render(
    <RepositoryLabels
      origin={ContentOrigin.UPLOAD}
      isRepoBeingMarkedAsPartner={false}
      isPartner
      publishState={{ publishing: false, unpublishing: false, published: true, stopped: false }}
    />,
  );

  expect(screen.getByText('Published')).toBeInTheDocument();
  expect(screen.queryByText('Publishing in progress')).not.toBeInTheDocument();
  expect(screen.queryByText('Unpublishing in progress')).not.toBeInTheDocument();
});

it('shows Publishing in progress label when publishState.publishing is true', () => {
  render(
    <RepositoryLabels
      origin={ContentOrigin.UPLOAD}
      isRepoBeingMarkedAsPartner={false}
      isPartner
      publishState={{ publishing: true, unpublishing: false, published: false, stopped: false }}
    />,
  );

  expect(screen.getByText('Publishing in progress')).toBeInTheDocument();
  expect(screen.queryByText('Published')).not.toBeInTheDocument();
  expect(screen.queryByText('Unpublishing in progress')).not.toBeInTheDocument();
});

it('shows Unpublishing in progress label when publishState.unpublishing is true', () => {
  render(
    <RepositoryLabels
      origin={ContentOrigin.UPLOAD}
      isRepoBeingMarkedAsPartner={false}
      isPartner
      publishState={{ publishing: false, unpublishing: true, published: true, stopped: false }}
    />,
  );

  expect(screen.getByText('Unpublishing in progress')).toBeInTheDocument();
  expect(screen.getByText('Published')).toBeInTheDocument();
  expect(screen.queryByText('Publishing in progress')).not.toBeInTheDocument();
});

it('shows both Published and Publishing in progress labels simultaneously when another snapshot has already been Published', () => {
  render(
    <RepositoryLabels
      origin={ContentOrigin.UPLOAD}
      isRepoBeingMarkedAsPartner={false}
      isPartner
      publishState={{ publishing: true, unpublishing: false, published: true, stopped: false }}
    />,
  );

  expect(screen.getByText('Published')).toBeInTheDocument();
  expect(screen.getByText('Publishing in progress')).toBeInTheDocument();
});

it('shows no publish labels when publishState.stopped is true', () => {
  render(
    <RepositoryLabels
      origin={ContentOrigin.UPLOAD}
      isRepoBeingMarkedAsPartner={false}
      isPartner
      publishState={{ publishing: false, unpublishing: false, published: false, stopped: true }}
    />,
  );

  expect(screen.queryByText('Published')).not.toBeInTheDocument();
  expect(screen.queryByText('Publishing in progress')).not.toBeInTheDocument();
  expect(screen.queryByText('Unpublishing in progress')).not.toBeInTheDocument();
});

it('shows no publish labels when publishState is undefined', () => {
  render(
    <RepositoryLabels origin={ContentOrigin.UPLOAD} isRepoBeingMarkedAsPartner={false} isPartner />,
  );

  expect(screen.queryByText('Published')).not.toBeInTheDocument();
  expect(screen.queryByText('Publishing in progress')).not.toBeInTheDocument();
  expect(screen.queryByText('Unpublishing in progress')).not.toBeInTheDocument();
});

it('does not show publish labels for non-UPLOAD, non-COMMUNITY origin', () => {
  render(
    <RepositoryLabels
      origin={ContentOrigin.EXTERNAL}
      isRepoBeingMarkedAsPartner={false}
      isPartner={false}
      publishState={{ publishing: true, unpublishing: true, published: true, stopped: false }}
    />,
  );

  expect(screen.queryByText('Published')).not.toBeInTheDocument();
  expect(screen.queryByText('Publishing in progress')).not.toBeInTheDocument();
  expect(screen.queryByText('Unpublishing in progress')).not.toBeInTheDocument();
});
