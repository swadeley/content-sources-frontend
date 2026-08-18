const EXACT_FILENAMES = ['pom.xml', 'requirements.txt'];
const SBOM_EXTENSIONS = ['.json', '.xml', '.spdx', '.rdf', '.csv'];

export const validateManifestFile = (file: File): boolean => {
  const name = file.name.toLowerCase();
  if (EXACT_FILENAMES.includes(name)) return true;
  return SBOM_EXTENSIONS.some((extension) => name.endsWith(extension));
};
