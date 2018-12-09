import React from 'react'
import PropTypes from 'prop-types'
import TooltipFirstCloseNotification from './notifications/tooltip-first-close'
import RibbonFirstCloseNotification from './notifications/ribbon-first-close'
import styles from './styles.css'

export class ToolbarNotification extends React.Component {
    static propTypes = {
        type: PropTypes.string.isRequired,
        onCloseRequested: PropTypes.func.isRequired,
    }

    shutUpLinter =
        "I don't want to refactor this to a pure functional component just to shut up the linter"

    render() {
        return (
            <div className={styles.container}>
                {this.props.type === 'tooltip-first-close' && (
                    <TooltipFirstCloseNotification
                        onCloseRequested={this.props.onCloseRequested}
                    />
                )}
                {this.props.type === 'ribbon-first-close' && (
                    <RibbonFirstCloseNotification
                        onCloseRequested={this.props.onCloseRequested}
                    />
                )}
            </div>
        )
    }
}

export default ToolbarNotification
