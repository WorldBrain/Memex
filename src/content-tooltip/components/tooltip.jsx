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

const Tooltip = ({
    x,
    y,
    state,
    tooltipComponent,
    closeTooltip,
    openSettings,
}) => (
    <div
        className={deriveTooltipClass(state)}
        style={{ left: x, top: y }}
        id="memex-tooltip"
    >
        <AnimationWrapper>{tooltipComponent}</AnimationWrapper>
        {_renderButtons({ closeTooltip, openSettings })}
    </div>
)

Tooltip.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired,
    tooltipComponent: PropTypes.element.isRequired,
    closeTooltip: PropTypes.func.isRequired,
    openSettings: PropTypes.func.isRequired,
}

export default Tooltip

export function _renderButtons({ closeTooltip, openSettings }) {
    return (
         <ButtonTooltip
            tooltipText="Close. Disable in ribbon (R)"
            position="rightContentTooltip"
        >
        <span className={styles.buttons}>
            <a className={styles.imgCross} onClick={closeTooltip}/>
        </span>
        </ButtonTooltip>
    )
}

_renderButtons.propTypes = {
    closeTooltip: PropTypes.func.isRequired,
    openSettings: PropTypes.func,
}
