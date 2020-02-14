import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './ProgressBar.css'

class ProgressBar extends PureComponent {
    static propTypes = {
        progress: PropTypes.number.isRequired, // needs to be given in format 54.3 > 54.3%
        className: PropTypes.string,
    }

    render() {
        const { progress, className } = this.props
        return (
            <div className={cx(localStyles.container, className)}>
                <div className={localStyles.bar}>
                    <div
                        className={localStyles.color}
                        style={{ width: `${progress}%`, minWidth: '25px' }}
                    >
                        <span className={localStyles.percent}>
                            {Math.floor(progress)}%
                        </span>
                    </div>
                </div>
            </div>
        )
    }
}

export default ProgressBar
