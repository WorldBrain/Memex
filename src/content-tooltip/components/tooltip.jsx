import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import AnimationWrapper from './AnimationWrapper'
import { getExtURL } from '../utils'
import styles from './tooltip.css'

const images = {
    cross: getExtURL('/img/cross_grey.svg'),
    settings: getExtURL('/img/settings_grey.svg'),
}

const deriveTooltipClass = state =>
    classNames(styles.tooltip, {
        [styles.statePristine]: state === 'pristine',
        [styles.stateCopied]: state === 'copied',
    })

const Tooltip = ({
    x,
    y,
    showCloseMessage,
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

        <span className={styles.buttons}>
            <a onClick={closeTooltip} className={styles.smallButton}>
                <img
                    className={styles.imgCross}
                    src={images.cross}
                    title={
                        'Close once. Disable via Memex icon in the extension toolbar.'
                    }
                />
            </a>
            <a onClick={openSettings} className={styles.smallButton}>
                <img className={styles.imgSettings} src={images.settings} />
            </a>
        </span>

        {showCloseMessage && (
            <div className={styles.closeMessage}>
                <div
                    onClick={closeTooltip}
                    className={styles.closeMessageCross}
                >
                    x
                </div>
                <div>It's your first time doing this</div>
                <div
                    onClick={event => closeTooltip(event, { disable: true })}
                    className={styles.closeMessageDisableTooltip}
                >
                    Disable on all sites
                </div>
            </div>
        )}
    </div>
)

Tooltip.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    showCloseMessage: PropTypes.bool.isRequired,
    state: PropTypes.string.isRequired,
    tooltipComponent: PropTypes.element.isRequired,
    closeTooltip: PropTypes.func.isRequired,
    openSettings: PropTypes.func.isRequired,
}

export default Tooltip
