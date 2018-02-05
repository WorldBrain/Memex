import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import localStyles from './ProgressBar.css'

class ProgressBar extends PureComponent {
    static propTypes = {
        progress: PropTypes.number.isRequired,
    }

    render() {
        const { progress } = this.props

        return (
            <div className={localStyles.container}>
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
