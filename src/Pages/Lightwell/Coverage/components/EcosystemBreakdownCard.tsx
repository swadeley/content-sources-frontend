import { Content, Flex, FlexItem, Title } from '@patternfly/react-core';
import { useRef, useState, useEffect } from 'react';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartStack,
  ChartTooltip,
} from '@patternfly/react-charts/victory';

import { EXACT_MATCH_COLOR, FUZZY_MATCH_COLOR, UNCOVERED_COLOR } from '../constants';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';

type EcosystemBreakdownCardProps = {
  report: CompletedCoverageReport;
};

const EcosystemBreakdownCard = ({ report }: EcosystemBreakdownCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    if (containerRef.current) {
      setChartWidth(containerRef.current.getBoundingClientRect().width);
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChartWidth(entry.contentRect.width);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const ecosystemCount = report.ecosystem_coverage_summary.length;
  const inNetwork = report.exact_matches + report.partial_matches;
  const exactPackages = report.ecosystem_coverage_summary.map((eco) => ({
    x: eco.ecosystem,
    y: eco.exact_matches,
  }));
  const fuzzyPackages = report.ecosystem_coverage_summary.map((eco) => ({
    x: eco.ecosystem,
    y: eco.partial_matches,
  }));
  const unmatchedPackages = report.ecosystem_coverage_summary.map((eco) => ({
    x: eco.ecosystem,
    y: eco.unmatched,
  }));

  return (
    <>
      <Title headingLevel='h3' size='2xl' className={spacing.pbSm}>
        Coverage by Ecosystem
      </Title>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FlexItem>
          <Content component='p'>
            <strong>{inNetwork}</strong> of <strong>{report.total}</strong> packages in your
            inventory are available in the Lightwell Validated catalog.
          </Content>
        </FlexItem>
        <FlexItem>
          <div ref={containerRef} style={{ width: '100%' }}>
            <Chart
              ariaDesc='Horizontal stacked bar chart showing exact matches, partial matches, and out of network packages per ecosystem'
              horizontal
              domainPadding={{ x: [15, 15] }}
              height={75 + ecosystemCount * 55}
              width={chartWidth}
              padding={{ bottom: 65, left: 100, right: 140, top: 10 }}
              legendPosition='right'
              legendOrientation='vertical'
              legendData={[
                { name: 'Exact matches', symbol: { fill: EXACT_MATCH_COLOR } },
                { name: 'Partial matches', symbol: { fill: FUZZY_MATCH_COLOR } },
                { name: 'Out of network', symbol: { fill: UNCOVERED_COLOR } },
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
                  data={exactPackages}
                  style={{ data: { fill: EXACT_MATCH_COLOR } }}
                  labelComponent={<ChartTooltip constrainToVisibleArea />}
                  labels={({ datum }) => `${datum.x} exact match: ${datum.y}`}
                />
                <ChartBar
                  data={fuzzyPackages}
                  style={{ data: { fill: FUZZY_MATCH_COLOR } }}
                  labelComponent={<ChartTooltip constrainToVisibleArea />}
                  labels={({ datum }) => `${datum.x} partial match: ${datum.y}`}
                />
                <ChartBar
                  data={unmatchedPackages}
                  style={{ data: { fill: UNCOVERED_COLOR } }}
                  labelComponent={<ChartTooltip constrainToVisibleArea />}
                  labels={({ datum }) => `${datum.x} out of network: ${datum.y}`}
                />
              </ChartStack>
            </Chart>
          </div>
        </FlexItem>
      </Flex>
    </>
  );
};

export default EcosystemBreakdownCard;
