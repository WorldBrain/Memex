import React from 'react'
import PropTypes from 'prop-types'
import ButtonTooltip from '../../../../common-ui/components/button-tooltip'
import AnimationWrapper from './AnimationWrapper'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { browser } from 'webextension-polyfill-ts'
import styled from 'styled-components'

const close = browser.runtime.getURL('/img/close.svg')
// const commentEmpty = browser.runtime.getURL('/img/commentEmpty.svg')
// const highlighterSmall = browser.runtime.getURL('/img/highlighterSmall.svg')

const MemexTooltip = styled.div`
    height: 34px;
    width: 95px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    flex-wrap: wrap;
    margin-top: 5px;
    position: absolute;
    background-color: #fff;
    transform: translate(-50%, 50%);
    z-index: 100000;
    opacity: 1;
    transition: all 1s ease-in-out;
    border: 1px solid #f0f0f0;

    &::after {
        box-sizing: content-box;
        left: calc(50% - 4px);
        top: -4px;
        content: ' ';
        height: 6px;
        width: 6px;
        position: absolute;
        pointer-events: none;
        border-bottom-color: transparent;
        border-left-color: transparent;
        transform: rotate(-45deg);
        background-color: #fff;
        transition: all 0.2s ease-in;
        transition-delay: 0.3s;
        border-top: 1px solid #f0f0f0;
        border-right: 1px solid #f0f0f0;
    }
`

// const deriveTooltipClass = (state) =>
//     classNames(styles.tooltip, {
//         [styles.statePristine]: state === 'pristine',
//         [styles.stateCopied]: state === 'copied',
//     })

const Tooltip = ({
    x = null,
    y = null,
    state,
    tooltipComponent,
    closeTooltip,
    openSettings,
}) => (
    <MemexTooltip
        // className={deriveTooltipClass(state)}
        style={{ left: x, top: y, height: 28, width: 95 }}
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
        <ButtonTooltip
            tooltipText="Close. Disable in Toolbar (R)"
            position="rightContentTooltip"
        >
            <Icon
                filePath={close}
                heightAndWidth="20px"
                color={'darkerIconColor'}
            />
        </ButtonTooltip>
    )
}

_renderButtons.propTypes = {
    closeTooltip: PropTypes.func.isRequired,
    state: PropTypes.string,
}
