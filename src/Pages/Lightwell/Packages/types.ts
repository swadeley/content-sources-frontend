export type PackageCoordinate = { name: string; group?: string } & (
  { isMaven: boolean; isPython?: never } | { isPython: boolean; isMaven?: never }
);
