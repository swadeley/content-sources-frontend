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
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartStack,
  ChartTooltip,
} from '@patternfly/react-charts/victory';

import { IN_NETWORK_COLOR, UNCOVERED_COLOR } from '../constants';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';

type EcosystemBreakdownCardProps = {
  report: CompletedCoverageReport;
};

const EcosystemBreakdownCard = ({ report }: EcosystemBreakdownCardProps) => {
  const { containerRef, width } = useContainerWidth(450);

  const ecosystemCount = report.ecosystem_coverage_summary.length;
  const inNetwork = report.exact_matches + report.partial_matches;
  const matchedPackages = report.ecosystem_coverage_summary.map((eco) => ({
    x: eco.ecosystem,
    y: eco.exact_matches + eco.partial_matches,
  }));
  const unmatchedPackages = report.ecosystem_coverage_summary.map((eco) => ({
    x: eco.ecosystem,
    y: eco.unmatched,
  }));

  return (
    <Card isGlass>
      <CardHeader>
        <CardTitle>
          <Title headingLevel='h3' size='lg'>
            Coverage by Ecosystem Breakdown
          </Title>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Content component='p'>
              {inNetwork} of {report.total} packages in your inventory are available in the
              Lightwell Validated catalog.
            </Content>
          </FlexItem>
          <FlexItem
            ref={containerRef}
            alignSelf={{ default: 'alignSelfCenter' }}
            style={{ maxWidth: 450, width: '100%' }}
          >
            <Chart
              ariaDesc='Horizontal stacked bar chart showing in-network vs out-of-network packages per ecosystem'
              horizontal
              domainPadding={{ x: [10, 10] }}
              height={55 + ecosystemCount * 35}
              width={width}
              padding={{ bottom: 65, left: 100, right: 160, top: 10 }}
              legendPosition='right'
              legendOrientation='vertical'
              legendData={[
                { name: 'In Network', symbol: { fill: IN_NETWORK_COLOR } },
                { name: 'Not in Network', symbol: { fill: UNCOVERED_COLOR } },
              ]}
            >
              <ChartAxis style={{ tickLabels: { fontSize: 14 } }} />
              <ChartAxis
                dependentAxis
                tickFormat={(t: number) => (Number.isInteger(t) ? t.toString() : '')}
                showGrid
                style={{
                  tickLabels: { fontSize: 14 },
                  axisLabel: { fontSize: 14, padding: 50 },
                }}
                label='Packages'
              />
              <ChartStack>
                <ChartBar
                  barWidth={12}
                  data={matchedPackages}
                  style={{ data: { fill: IN_NETWORK_COLOR } }}
                  labelComponent={<ChartTooltip constrainToVisibleArea />}
                  labels={({ datum }) => `${datum.x} in network: ${datum.y}`}
                />
                <ChartBar
                  barWidth={12}
                  data={unmatchedPackages}
                  style={{ data: { fill: UNCOVERED_COLOR } }}
                  labelComponent={<ChartTooltip constrainToVisibleArea />}
                  labels={({ datum }) => `${datum.x} not in network: ${datum.y}`}
                />
              </ChartStack>
            </Chart>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default EcosystemBreakdownCard;
