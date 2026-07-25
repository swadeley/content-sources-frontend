import { Button } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import LightwellPageHeader from './LightwellPageHeader';

const title = 'Repositories';
const description = 'Manage Lightwell repositories and notification preferences.';
const actionLabel = 'Notifications';
const actions = <Button>{actionLabel}</Button>;

it('renders the title', () => {
  render(<LightwellPageHeader title={title} />);

  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('renders title, description, and actions', () => {
  render(<LightwellPageHeader title={title} description={description} actions={actions} />);

  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.getByRole('paragraph')).toHaveTextContent(description);
  expect(screen.getByRole('button', { name: actionLabel })).toBeInTheDocument();
});
