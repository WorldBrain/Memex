import React from 'react'
import PropTypes, { string } from 'prop-types'
import AnimationWrapper from './AnimationWrapper'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import styled, { keyframes, css } from 'styled-components'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

const openAnimation = keyframes`
 0% { padding-bottom: 10px; opacity: 0 }
 100% { padding-bottom: 0px; opacity: 1 }
`

const MemexTooltip = styled.div`
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    flex-wrap: wrap;
    position: absolute;
    background-color: #fff;
    transform: translate(-50%, 50%);
    z-index: 100000;
    animation: ${openAnimation} cubic-bezier(0.4, 0, 0.16, 0.87);
    animation-duration: 0.1s;
    /* transition: all 1s ease-in-out; */
    width: fit-content;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    background: ${(props) => props.theme.colors.greyScale1};
`

const Tooltip = ({
    x = null,
    y = null,
    state,
    tooltipComponent,
    closeTooltip,
    openSettings,
}) => (
    <MemexTooltip
        left={x}
        top={y}
        // className={deriveTooltipClass(state)}
        style={{ left: x, top: y }}
        id="memex-tooltip"
    >
        <AnimationWrapper>{tooltipComponent}</AnimationWrapper>
    </MemexTooltip>
)

Tooltip.propTypes = {
    x: PropTypes.number,
    y: PropTypes.number,
    state: PropTypes.string.isRequired,
    tooltipComponent: PropTypes.element.isRequired,
    closeTooltip: PropTypes.func.isRequired,
    openSettings: PropTypes.func.isRequired,
}

export default Tooltip

export function _renderButtons({ closeTooltip, state }) {
    return (
        <TooltipBox
            tooltipText="Close. Disable in Toolbar (R)"
            placement="right"
        >
            <Icon
                filePath={'removeX'}
                heightAndWidth="20px"
                color={'darkerIconColor'}
            />
        </TooltipBox>
    )
}

_renderButtons.propTypes = {
    closeTooltip: PropTypes.func.isRequired,
    state: PropTypes.string,
}
