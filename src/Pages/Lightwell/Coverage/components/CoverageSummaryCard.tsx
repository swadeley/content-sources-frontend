import { Card, CardBody, Content, Flex, FlexItem, Title, Tooltip } from '@patternfly/react-core';
import text from '@patternfly/react-styles/css/utilities/Text/text';
import alignment from '@patternfly/react-styles/css/utilities/Alignment/alignment';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { ChartDonut } from '@patternfly/react-charts/victory';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { EXACT_MATCH_COLOR, FUZZY_MATCH_COLOR, UNCOVERED_COLOR } from '../constants';
import { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';

type CoverageSummaryCardProps = {
  report: CompletedCoverageReport;
};

const CoverageSummaryCard = ({ report }: CoverageSummaryCardProps) => {
  const inNetwork = report.exact_matches + report.partial_matches;
  const percentage = report.total > 0 ? Math.round((inNetwork / report.total) * 100) : 0;

  return (
    <Flex gap={{ default: 'gapXl' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <div style={{ width: 320 }}>
          <ChartDonut
            ariaDesc='Coverage summary donut chart'
            constrainToVisibleArea
            data={[
              { x: 'Exact matches', y: report.exact_matches },
              { x: 'Partial matches', y: report.partial_matches },
              { x: 'Out of network', y: report.unmatched },
            ]}
            colorScale={[EXACT_MATCH_COLOR, FUZZY_MATCH_COLOR, UNCOVERED_COLOR]}
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
            title={`${percentage}%`}
            subTitle='in network'
            width={320}
            height={280}
            padding={{ bottom: 10, left: 10, right: 10, top: 10 }}
          />
        </div>
      </FlexItem>
      <FlexItem flex={{ default: 'flex_1' }}>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
          <FlexItem>
            <Title headingLevel='h3' size='2xl'>
              Lightwell Network covers <strong>{percentage}%</strong> of this manifest
            </Title>
          </FlexItem>
          <FlexItem>
            <Card>
              <CardBody>
                <Flex
                  gap={{ default: 'gapLg' }}
                  justifyContent={{ default: 'justifyContentSpaceAround' }}
                >
                  {[
                    {
                      count: report.exact_matches,
                      label: 'Exact matches',
                      tooltip: 'Package name and version found in the Lightwell Network catalog.',
                    },
                    {
                      count: report.partial_matches,
                      label: 'Partial matches',
                      tooltip:
                        'Package name found in the catalog, but not the specific version you are running.',
                    },
                    {
                      count: report.unmatched,
                      label: 'Out of network',
                      tooltip: 'Package not found in the Lightwell Network catalog.',
                    },
                  ].map(({ count, label, tooltip }) => (
                    <FlexItem key={label} style={{ textAlign: 'center' }}>
                      <Title headingLevel='h4' size='4xl'>
                        {count}
                      </Title>
                      <Content component='p' className={text.fontSizeLg}>
                        {label}{' '}
                        <Tooltip content={tooltip}>
                          <OutlinedQuestionCircleIcon className={text.textColorSubtle} />
                        </Tooltip>
                      </Content>
                    </FlexItem>
                  ))}
                </Flex>
                <Content
                  component='small'
                  className={`${text.textColorSubtle} ${alignment.textAlignCenter} ${spacing.mtMd}`}
                  style={{ display: 'block' }}
                >
                  Out of network packages logged as demand signals for the Catalog Build Queue
                </Content>
              </CardBody>
            </Card>
          </FlexItem>
        </Flex>
      </FlexItem>
    </Flex>
  );
};

export default CoverageSummaryCard;
