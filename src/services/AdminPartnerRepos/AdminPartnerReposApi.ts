import axios from 'axios';

export type SnapshotPublishState = {
  publishing: boolean;
  unpublishing: boolean;
  published: boolean;
  stopped: boolean;
};

export const toggleAsPartner = async (uuid: string, partner: boolean): Promise<void> =>
  await axios.patch(`/api/content-sources/v1/admin/repositories/${uuid}/partner`, {
    partner,
  });

export const publishSnapshot = async (
  repoUUID: string,
  snapshotUUID: string,
  published: boolean,
): Promise<void> => {
  await axios.patch(
    `/api/content-sources/v1.0/repositories/${repoUUID}/snapshots/${snapshotUUID}/published`,
    { published },
  );
};
