import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Title,
} from '@patternfly/react-core';
import { ChartDonut } from '@patternfly/react-charts/victory';
import text from '@patternfly/react-styles/css/utilities/Text/text';
import alignment from '@patternfly/react-styles/css/utilities/Alignment/alignment';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { IN_NETWORK_COLOR, UNCOVERED_COLOR } from '../constants';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';

type CoverageSummaryCardProps = {
  filename?: string;
  report: CompletedCoverageReport;
};

const CoverageSummaryCard = ({ filename, report }: CoverageSummaryCardProps) => {
  const { containerRef, width } = useContainerWidth(250);

  const inNetwork = report.exact_matches + report.partial_matches;
  const outOfNetwork = report.unmatched;
  const percentage = report.total > 0 ? Math.round((inNetwork / report.total) * 100) : 0;

  return (
    <Card isGlass>
      <CardHeader>
        <CardTitle>
          <Title headingLevel='h3' size='lg'>
            Coverage Summary
          </Title>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Flex
          direction={{ default: 'column' }}
          alignItems={{ default: 'alignItemsCenter' }}
          gap={{ default: 'gapMd' }}
        >
          <FlexItem ref={containerRef} style={{ maxWidth: 300 }}>
            <ChartDonut
              ariaDesc='Coverage summary donut chart'
              constrainToVisibleArea
              data={[
                { x: 'In Network', y: inNetwork },
                { x: 'Not in Network', y: outOfNetwork },
              ]}
              colorScale={[IN_NETWORK_COLOR, UNCOVERED_COLOR]}
              labels={({ datum }) => `${datum.x}: ${datum.y}`}
              title={`${percentage}%`}
              subTitle='in network'
              width={width}
              height={width * 0.72}
              padding={{ bottom: 10, left: 10, right: 10, top: 10 }}
            />
          </FlexItem>
          <FlexItem
            className={`${alignment.textAlignCenter} ${spacing.px_4xl}`}
            style={{ maxWidth: 650 }}
          >
            <Content component='p' className={spacing.pbSm} style={{ wordBreak: 'keep-all' }}>
              Lightwell Network currently covers {percentage}% of the inventory given in{' '}
              <span className={text.fontWeightBold}>{filename}</span>. Packages that are not found
              in the Network have been noted as demand signals for the content team.
            </Content>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default CoverageSummaryCard;
