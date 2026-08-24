import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentOriginFilter from './ContentOriginFilter';
import { ContentOrigin } from 'services/Content/ContentApi';
import { useAppContext } from 'middleware/AppContext';

jest.mock('middleware/AppContext', () => ({
  useAppContext: jest.fn(),
}));

const defaultFeatures = {
  snapshots: { accessible: true },
};

describe('ContentOriginFilter', () => {
  beforeEach(() => {
    (useAppContext as jest.Mock).mockReturnValue({
      features: defaultFeatures,
    });
  });

  it('renders nothing when snapshots are not accessible', () => {
    (useAppContext as jest.Mock).mockReturnValue({
      features: { snapshots: { accessible: false } },
    });

    const { container } = render(
      <ContentOriginFilter contentOrigin={[]} setContentOrigin={jest.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('adds external and upload origins when Custom is turned on', async () => {
    const user = userEvent.setup();
    const setContentOrigin = jest.fn();

    render(
      <ContentOriginFilter
        contentOrigin={[ContentOrigin.REDHAT]}
        setContentOrigin={setContentOrigin}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Custom' }));

    expect(setContentOrigin).toHaveBeenCalled();
    const updater = setContentOrigin.mock.calls[0][0] as (prev: ContentOrigin[]) => ContentOrigin[];
    expect(updater([ContentOrigin.REDHAT])).toEqual(
      expect.arrayContaining([ContentOrigin.EXTERNAL, ContentOrigin.UPLOAD, ContentOrigin.REDHAT]),
    );
  });

  it('removes external and upload origins when Custom is turned off', async () => {
    const user = userEvent.setup();
    const setContentOrigin = jest.fn();

    render(
      <ContentOriginFilter
        contentOrigin={[ContentOrigin.EXTERNAL, ContentOrigin.UPLOAD, ContentOrigin.REDHAT]}
        setContentOrigin={setContentOrigin}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Custom' }));

    const updater = setContentOrigin.mock.calls[0][0] as (prev: ContentOrigin[]) => ContentOrigin[];
    expect(updater([ContentOrigin.EXTERNAL, ContentOrigin.UPLOAD, ContentOrigin.REDHAT])).toEqual([
      ContentOrigin.REDHAT,
    ]);
  });

  it('toggles Red Hat origin', async () => {
    const user = userEvent.setup();
    const setContentOrigin = jest.fn();

    const { rerender } = render(
      <ContentOriginFilter contentOrigin={[]} setContentOrigin={setContentOrigin} />,
    );

    await user.click(screen.getByRole('button', { name: 'Red Hat' }));

    let updater = setContentOrigin.mock.calls[0][0] as (prev: ContentOrigin[]) => ContentOrigin[];
    expect(updater([])).toEqual([ContentOrigin.REDHAT]);

    setContentOrigin.mockClear();

    rerender(
      <ContentOriginFilter
        contentOrigin={[ContentOrigin.REDHAT]}
        setContentOrigin={setContentOrigin}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Red Hat' }));

    updater = setContentOrigin.mock.calls[0][0] as (prev: ContentOrigin[]) => ContentOrigin[];
    expect(updater([ContentOrigin.REDHAT])).toEqual([]);
  });

  it('toggles EPEL origin', async () => {
    const user = userEvent.setup();
    const setContentOrigin = jest.fn();

    render(<ContentOriginFilter contentOrigin={[]} setContentOrigin={setContentOrigin} />);

    await user.click(screen.getByRole('button', { name: 'EPEL' }));

    const addCommunity = setContentOrigin.mock.calls[0][0] as (
      prev: ContentOrigin[],
    ) => ContentOrigin[];
    expect(addCommunity([])).toEqual([ContentOrigin.COMMUNITY]);
  });

  it('removes community origin when EPEL is turned off', async () => {
    const user = userEvent.setup();
    const setContentOrigin = jest.fn();

    render(
      <ContentOriginFilter
        contentOrigin={[ContentOrigin.COMMUNITY, ContentOrigin.REDHAT]}
        setContentOrigin={setContentOrigin}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'EPEL' }));

    const removeCommunity = setContentOrigin.mock.calls[0][0] as (
      prev: ContentOrigin[],
    ) => ContentOrigin[];
    expect(removeCommunity([ContentOrigin.COMMUNITY, ContentOrigin.REDHAT])).toEqual([
      ContentOrigin.REDHAT,
    ]);
  });
});
