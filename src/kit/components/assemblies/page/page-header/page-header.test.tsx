import { Button } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import { LwPageHeader } from './page-header';

const title = 'Repositories';
const description = 'Manage Lightwell repositories and notification preferences.';
const actionLabel = 'Notifications';
const actions = <Button>{actionLabel}</Button>;

it('renders the title without a Hero host', () => {
  const { container } = render(<LwPageHeader title={title} />);

  expect(container.querySelector('.pf-v6-c-hero')).toBeNull();
  expect(container.querySelector('.lw-c-page-header')).toBeTruthy();
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('renders title, description, and actions', () => {
  render(<LwPageHeader title={title} description={description} actions={actions} />);

  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.getByRole('paragraph')).toHaveTextContent(description);
  expect(screen.getByRole('button', { name: actionLabel })).toBeInTheDocument();
});

it('merges call-site className onto the Flex root', () => {
  const { container } = render(<LwPageHeader title={title} className='lw-page-header-test' />);
  const root = container.querySelector('.lw-c-page-header');

  expect(root).toHaveClass('lw-page-header-test');
});

it('passthrough mode renders children and skips slots', () => {
  render(
    <LwPageHeader title={title} description={description} actions={actions}>
      <p>Custom chrome</p>
    </LwPageHeader>,
  );

  expect(screen.getByText('Custom chrome')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: actionLabel })).not.toBeInTheDocument();
});
