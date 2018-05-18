import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { getExtURL } from '../utils'
import styles from './tooltip.css'

const cssClasses = {
    pristine: 'stateInitial',
    running: 'stateCreatingLink',
    done: 'stateCreatedLink',
    error: 'stateLinkError',
    copied: 'stateLinkCopied',
}

const images = {
    logo: getExtURL('/img/worldbrain-logo-narrow.png'),
    logoWhite: getExtURL('/img/icon_white.svg'),
}

const Tooltip = ({ x, y, state, tooltipComponent }) => (
    <div
        className={classNames(styles.tooltip, styles[cssClasses[state]])}
        style={{ left: x, top: y }}
    >
        <span className={styles.icon}>
            <img src={state === 'copied' ? images.logoWhite : images.logo} />
        </span>
        {tooltipComponent}
    </div>
)

Tooltip.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired,
    tooltipComponent: PropTypes.element.isRequired,
}

export default Tooltip
