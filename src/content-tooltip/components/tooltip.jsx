import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import ButtonTooltip from '../../common-ui/components/button-tooltip'
import AnimationWrapper from './AnimationWrapper'
import styles from './tooltip.css'

const deriveTooltipClass = state =>
    classNames(styles.tooltip, {
        [styles.statePristine]: state === 'pristine',
        [styles.stateCopied]: state === 'copied',
    })

const Tooltip = ({ x, y, state, tooltipComponent, closeTooltip }) => (
    <div
        className={deriveTooltipClass(state)}
        style={{ left: x, top: y, height: 28, width: 85 }}
        id="memex-tooltip"
    >
        <AnimationWrapper>{tooltipComponent}</AnimationWrapper>
    </div>
)

Tooltip.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired,
    tooltipComponent: PropTypes.element.isRequired,
    closeTooltip: PropTypes.func.isRequired,
}

export default Tooltip

export function _renderButtons({ closeTooltip, state }) {
    return (
        <ButtonTooltip
            tooltipText="Close. Disable in Toolbar (R)"
            position="rightContentTooltip"
        >
            <span
                className={classNames(styles.buttons, {
                    [styles.noShow]: state === 'running',
                    [styles.noShow]: state === 'copied',
                })}
            >
                <a className={styles.imgCross} onClick={closeTooltip} />
            </span>
        </ButtonTooltip>
    )
}

_renderButtons.propTypes = {
    closeTooltip: PropTypes.func.isRequired,
    state: PropTypes.string,
}
