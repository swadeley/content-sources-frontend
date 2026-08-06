import { ConnectSnippetTab } from '../../Repositories/components/connectSnippets';

interface PackageCoordinate {
  group: string;
  name: string;
  release: string;
  sourceUrl: string;
}

interface PythonPackageVersion {
  name: string;
  release: string;
  sourceUrl: string;
}

export const getPythonPackageUsageSnippetTabs = (
  pkg: PythonPackageVersion,
): ConnectSnippetTab[] => [
  {
    eventKey: 'pip',
    title: 'pip',
    snippets: [
      {
        label: 'Install directly:',
        code: `# Source: ${pkg.sourceUrl}
pip install --index-url ${pkg.sourceUrl}/simple ${pkg.name}==${pkg.release}`,
      },
    ],
  },
  {
    eventKey: 'requirements.txt',
    title: 'requirements.txt',
    snippets: [
      {
        label: 'Add to your requirements.txt:',
        code: `# Source: ${pkg.sourceUrl}
--index-url ${pkg.sourceUrl}
${pkg.name}==${pkg.release}`,
      },
    ],
  },
  {
    eventKey: 'pip.conf',
    title: 'pip.conf',
    snippets: [
      {
        label: 'Add to your pip.conf for permanent use:',
        code: `# ~/.config/pip/pip.conf
[global]
index-url = ${pkg.sourceUrl}`,
      },
    ],
  },
];

export const getMavenPackageUsageSnippetTabs = (pkg: PackageCoordinate): ConnectSnippetTab[] => [
  {
    eventKey: 'maven',
    title: 'Maven',
    snippets: [
      {
        label: 'Add to your pom.xml:',
        code: `<!-- Source: ${pkg.sourceUrl} -->
<dependency>
  <groupId>${pkg.group}</groupId>
  <artifactId>${pkg.name}</artifactId>
  <version>${pkg.release}</version>
</dependency>`,
      },
    ],
  },
  {
    eventKey: 'gradle',
    title: 'Gradle',
    snippets: [
      {
        label: 'Add to your build.gradle:',
        code: `// Source: ${pkg.sourceUrl}
implementation("${pkg.group}:${pkg.name}:${pkg.release}")`,
      },
    ],
  },
];
