import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './ProgressBar.css'

class ProgressBar extends PureComponent {
    static propTypes = {
        progress: PropTypes.number.isRequired,
        className: PropTypes.string,
    }

    render() {
        const { progress, className } = this.props

        return (
            <div className={cx(localStyles.container, className)}>
                <div className={localStyles.bar}>
                    <div
                        className={localStyles.color}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className={localStyles.percent}>
                    {Math.floor(progress)}%
                </span>
            </div>
        )
    }
}

export default ProgressBar
