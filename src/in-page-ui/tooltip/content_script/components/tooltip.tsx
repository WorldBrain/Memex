import React from 'react'
import PropTypes, { string } from 'prop-types'
import ButtonTooltip from '../../../../common-ui/components/button-tooltip'
import AnimationWrapper from './AnimationWrapper'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import styled from 'styled-components'

const MemexTooltip = styled.div`  
    height: 34px;
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
    animation: slide-in ease-out;
    animation-duration: 0.05s;
    /* transition: all 1s ease-in-out; */
    width: fit-content;
    border: 1px solid ${(props) => props.theme.colors.lightHover};
    background: ${(props) => props.theme.colors.greyScale1};

    &::after {
        box-sizing: content-box;
        left: calc(50% - 4px);
        top: -5px;
        content: ' ';
        height: 8px;
        width: 8px;
        position: absolute;
        pointer-events: none;
        border-bottom-color: transparent;
        border-left-color: transparent;
        transform: rotate(-45deg);
        background: ${(props) => props.theme.colors.greyScale1};
        /* transition: all 0.2s ease-in;
        transition-delay: 0.3s; */
        border-top: 1px solid ${(props) => props.theme.colors.lightHover};
        border-right: 1px solid ${(props) => props.theme.colors.lightHover};
        border-radius: 1px;
        bo
    }

    @keyframes slide-in {
            0% { 
                opacity: 0%;
                margin-top: -15px;
            }
            100% {
                opacity: 100%;
                margin-top: 5px;
            }
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
        <ButtonTooltip
            tooltipText="Close. Disable in Toolbar (R)"
            position="rightContentTooltip"
        >
            <Icon
                filePath={'removeX'}
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
