import React from 'react'
import PropTypes, { string } from 'prop-types'
import styled, { keyframes, css } from 'styled-components'

const openAnimation = keyframes`
 0% { zoom: 0.8; opacity: 0 }
 80% { zoom: 1.05; opacity: 0.8 }
 100% { zoom: 1; opacity: 1 }

/* 0% { padding-bottom: 10px; opacity: 0 }
 100% { padding-bottom: 0px; opacity: 1 } */
`

const MemexTooltip = styled.div<{ screenPosition }>`
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    flex-wrap: wrap;
    position: ${(props) => props.screenPosition};
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

const Tooltip = ({ x = null, y = null, tooltipComponent, screenPosition }) => (
    <MemexTooltip
        left={x}
        top={y}
        style={{ left: x, top: y }}
        id="memex-tooltip"
        screenPosition={screenPosition}
    >
        {tooltipComponent}
    </MemexTooltip>
)

Tooltip.propTypes = {
    x: PropTypes.number,
    y: PropTypes.number,
    state: PropTypes.string.isRequired,
    tooltipComponent: PropTypes.element.isRequired,
    screenPosition: PropTypes.string,
}

export default Tooltip
