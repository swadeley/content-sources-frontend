import { validateManifestFile } from './validateManifestFile';

const fileWith = (name: string) => new File([''], name);

describe('validateManifestFile', () => {
  it.each([
    'pom.xml',
    'requirements.txt',
    'bom.cdx.json',
    'sbom.xml',
    'sbom.spdx',
    'report.rdf',
    'inventory.csv',
  ])('accepts %s', (name) => {
    expect(validateManifestFile(fileWith(name))).toBe(true);
  });

  it.each(['document.pdf', 'Dockerfile', 'not-pom.xml.bak'])('rejects %s', (name) => {
    expect(validateManifestFile(fileWith(name))).toBe(false);
  });
});
