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
            <div>
                <div className={localStyles.progressBar}>
                    <div
                        className={localStyles.progressColor}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div
                    className={localStyles.arrowUp}
                    style={{ marginLeft: `${progress}%` }}
                />
                <h3
                    className={localStyles.progressBarText}
                    style={{ width: `${progress}%` }}
                >
                    {Math.floor(this.props.progress)}%
                </h3>
            </div>
        )
    }
}

export default ProgressBar
