import { Button } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import { LwPageHero } from './page-hero';

const title = 'Repositories';
const description = 'Manage Lightwell repositories and notification preferences.';
const actionLabel = 'Notifications';
const actions = <Button>{actionLabel}</Button>;

it('renders the title inside a PatternFly Hero', () => {
  const { container } = render(<LwPageHero title={title} />);

  expect(container.querySelector('.pf-v6-c-hero')).toBeTruthy();
  expect(container.querySelector('.lw-c-page-hero')).toBeTruthy();
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('renders title, description, and actions', () => {
  render(<LwPageHero title={title} description={description} actions={actions} />);

  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.getByRole('paragraph')).toHaveTextContent(description);
  expect(screen.getByRole('button', { name: actionLabel })).toBeInTheDocument();
});

it('merges call-site className onto the Hero root', () => {
  const { container } = render(<LwPageHero title={title} className='lw-page-hero-test' />);
  const root = container.querySelector('.pf-v6-c-hero');

  expect(root).toHaveClass('lw-c-page-hero');
  expect(root).toHaveClass('lw-page-hero-test');
});

it('does not set Hero background srcs by default', () => {
  const { container } = render(<LwPageHero title={title} />);
  const root = container.querySelector('.pf-v6-c-hero') as HTMLElement;

  expect(root.style.getPropertyValue('--pf-v6-c-hero--BackgroundImage--light')).toBe('');
  expect(root.style.getPropertyValue('--pf-v6-c-hero--BackgroundImage--dark')).toBe('');
});

it('applies kit background srcs when backgroundImage is true', () => {
  const { container } = render(<LwPageHero title={title} backgroundImage />);
  const root = container.querySelector('.pf-v6-c-hero') as HTMLElement;

  expect(root.style.getPropertyValue('--pf-v6-c-hero--BackgroundImage--light')).toMatch(/^url\(/);
  expect(root.style.getPropertyValue('--pf-v6-c-hero--BackgroundImage--dark')).toMatch(/^url\(/);
});

it('applies custom light/dark Hero background srcs', () => {
  const { container } = render(
    <LwPageHero title={title} backgroundImage={{ light: '/light.png', dark: '/dark.png' }} />,
  );
  const root = container.querySelector('.pf-v6-c-hero') as HTMLElement;

  expect(root.style.getPropertyValue('--pf-v6-c-hero--BackgroundImage--light')).toBe('url(/light.png)');
  expect(root.style.getPropertyValue('--pf-v6-c-hero--BackgroundImage--dark')).toBe('url(/dark.png)');
});

it('lets explicit Hero backgroundSrc props win over backgroundImage', () => {
  const { container } = render(
    <LwPageHero
      title={title}
      backgroundImage
      backgroundSrcLight='/explicit-light.png'
      backgroundSrcDark='/explicit-dark.png'
    />,
  );
  const root = container.querySelector('.pf-v6-c-hero') as HTMLElement;

  expect(root.style.getPropertyValue('--pf-v6-c-hero--BackgroundImage--light')).toBe(
    'url(/explicit-light.png)',
  );
  expect(root.style.getPropertyValue('--pf-v6-c-hero--BackgroundImage--dark')).toBe(
    'url(/explicit-dark.png)',
  );
});

it('passthrough mode renders children when no owned slots are set', () => {
  render(
    <LwPageHero>
      <p>Custom hero chrome</p>
    </LwPageHero>,
  );

  expect(screen.getByText('Custom hero chrome')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument();
});

it('places actions beside supporting controls under the title', () => {
  render(
    <LwPageHero title={title} actions={actions}>
      <label htmlFor='customer-control'>Customer ID</label>
      <input id='customer-control' />
    </LwPageHero>,
  );

  const controls = document.querySelector('.lw-c-page-hero__controls');
  expect(controls).toBeTruthy();
  expect(controls).toContainElement(screen.getByLabelText('Customer ID'));
  expect(controls).toContainElement(screen.getByRole('button', { name: actionLabel }));
});

it('renders hasAside as a second column beside primary content', () => {
  const { container } = render(
    <LwPageHero title={title} hasAside={<p>Select a customer first</p>}>
      <span>Primary control</span>
    </LwPageHero>,
  );

  expect(container.querySelector('.lw-c-page-hero--split')).toBeTruthy();
  expect(container.querySelector('.lw-c-page-hero__aside')).toHaveTextContent(
    'Select a customer first',
  );
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.getByText('Primary control')).toBeInTheDocument();
});
