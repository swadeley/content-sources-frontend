import { Content, Flex, FlexItem, Title, type FlexProps } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import type { CSSProperties, ReactNode } from 'react';

import {
  getLwMetricsCountDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import { LwTooltip } from 'kit/components/primitives';
import { lightwellConfig, type LwStepIconColorKey } from 'kit/lightwell.config';
import './metrics-count.css';

type LwMetricsCountOwnedProps = {
  /** Prominent metric value. */
  value: ReactNode;
  /** Caption (under value in column; beside in row). */
  label: ReactNode;
  /**
   * Status bar fill from `lightwellConfig.colors.stepIcon`
   * (includes match-status keys + stubs).
   */
  color?: LwStepIconColorKey;
  /** Tooltip on the label help icon. */
  tooltip?: ReactNode;
  /** Stack orientation. Default `column`. */
  direction?: 'column' | 'row';
};

/** Owned slots + PF `Flex` passthrough. */
export type LwMetricsCountProps = LwMetricsCountOwnedProps &
  Omit<FlexProps, 'children' | 'direction'>;

/**
 * Kit **assembly** — one metric count cell.
 * Layout host = `Flex`. Value/label = PF `Title` / `Content`.
 * Status signal = chromatic bar (`color`), not value paint.
 */
export function LwMetricsCount({
  value,
  label,
  color,
  tooltip,
  direction: directionProp,
  className,
  style,
  ...rest
}: LwMetricsCountProps) {
  const defaults = getLwMetricsCountDefaults();
  const direction = directionProp ?? defaults.direction ?? 'column';
  const isColumn = direction === 'column';
  const colorKey = color ?? defaults.color;
  const colorToken = colorKey != null ? lightwellConfig.colors.stepIcon[colorKey] : undefined;

  const flexProps = mergeComponentProps(
    {},
    {
      ...rest,
      className: mergeClassNames(
        'lw-c-metrics-count',
        isColumn ? 'lw-m-column' : 'lw-m-row',
        colorToken != null ? 'lw-m-has-bar' : undefined,
        className,
      ),
      style:
        colorToken != null
          ? ({
              ...style,
              ['--lw-metrics-count-bar-color']: colorToken,
            } as CSSProperties)
          : style,
    },
  );

  const labelNode = (
    <Content className='lw-c-metrics-count__label'>
      <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>{label}</FlexItem>
        {tooltip != null ? (
          <FlexItem>
            <LwTooltip content={tooltip} position='bottom'>
              <span className='lw-c-metrics-count__help' tabIndex={0}>
                <OutlinedQuestionCircleIcon />
              </span>
            </LwTooltip>
          </FlexItem>
        ) : null}
      </Flex>
    </Content>
  );

  return (
    <Flex
      {...flexProps}
      direction={{ default: isColumn ? 'column' : 'row' }}
      alignItems={{ default: isColumn ? 'alignItemsCenter' : 'alignItemsBaseline' }}
      gap={{ default: isColumn ? 'gapSm' : 'gapMd' }}
    >
      <Flex
        direction={{ default: 'column' }}
        alignItems={{ default: isColumn ? 'alignItemsCenter' : 'alignItemsFlexStart' }}
        gap={{ default: 'gapXs' }}
      >
        <FlexItem>
          <Title headingLevel='h4' size='3xl' className='lw-c-metrics-count__value'>
            {value}
          </Title>
        </FlexItem>
        {colorToken != null ? (
          <FlexItem>
            <span className='lw-c-metrics-count__bar' aria-hidden='true' />
          </FlexItem>
        ) : null}
      </Flex>
      <FlexItem>{labelNode}</FlexItem>
    </Flex>
  );
}

export default LwMetricsCount;
