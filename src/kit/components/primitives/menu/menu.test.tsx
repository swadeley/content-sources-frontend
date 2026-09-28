import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LwMenu } from './menu';

it('renders a toggle with the given label', () => {
  render(<LwMenu label='Export' items={[{ id: 'csv', children: 'Export as CSV' }]} />);

  expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
});

it('opens and lists items from the items slot', async () => {
  const user = userEvent.setup();
  render(
    <LwMenu
      label='Export'
      items={[
        { id: 'csv', children: 'Export as CSV' },
        { id: 'json', children: 'Export as JSON' },
      ]}
    />,
  );

  await user.click(screen.getByRole('button', { name: 'Export' }));

  expect(screen.getByRole('menuitem', { name: 'Export as CSV' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Export as JSON' })).toBeInTheDocument();
});

it('closes and invokes onSelect when an item is chosen', async () => {
  const onSelect = jest.fn();
  const user = userEvent.setup();
  render(<LwMenu label='Export' items={[{ id: 'csv', children: 'Export as CSV', onSelect }]} />);

  await user.click(screen.getByRole('button', { name: 'Export' }));
  await user.click(screen.getByRole('menuitem', { name: 'Export as CSV' }));

  expect(onSelect).toHaveBeenCalledTimes(1);
  await waitFor(() => {
    expect(screen.queryByRole('menuitem', { name: 'Export as CSV' })).not.toBeInTheDocument();
  });
});

it('disables the toggle and shows busy label while isBusy', () => {
  render(
    <LwMenu
      label='Export'
      busyLabel='Exporting'
      isBusy
      items={[{ id: 'csv', children: 'Export as CSV' }]}
    />,
  );

  const toggle = screen.getByRole('button', { name: 'Exporting' });
  expect(toggle).toBeDisabled();
  expect(toggle).toHaveAttribute('aria-busy', 'true');
});

it('does not open while isBusy', async () => {
  const user = userEvent.setup();
  render(
    <LwMenu
      label='Export'
      busyLabel='Exporting'
      isBusy
      items={[{ id: 'csv', children: 'Export as CSV' }]}
    />,
  );

  await user.click(screen.getByRole('button', { name: 'Exporting' }));

  expect(screen.queryByRole('menuitem', { name: 'Export as CSV' })).not.toBeInTheDocument();
});

it('merges call-site className onto the Dropdown Menu host when open', async () => {
  const user = userEvent.setup();
  render(<LwMenu label='Export' className='lw-menu-test' items={[{ id: 'a', children: 'A' }]} />);

  await user.click(screen.getByRole('button', { name: 'Export' }));

  // PF applies Dropdown className to Menu (mounted while open), not the toggle.
  const root = document.querySelector('.pf-v6-c-menu');
  expect(root).toHaveClass('lw-c-menu');
  expect(root).toHaveClass('lw-menu-test');
});
it('lets children passthrough win over items', async () => {
  const user = userEvent.setup();
  render(
    <LwMenu label='Actions' items={[{ id: 'hidden', children: 'Hidden' }]}>
      <button type='button'>Custom interior</button>
    </LwMenu>,
  );

  await user.click(screen.getByRole('button', { name: 'Actions' }));

  expect(screen.getByRole('button', { name: 'Custom interior' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'Hidden' })).not.toBeInTheDocument();
});
