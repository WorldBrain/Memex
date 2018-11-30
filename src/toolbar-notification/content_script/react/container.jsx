import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'
import TooltipFirstCloseNotification from './notifications/tooltip-first-close'
import styles from './styles.css'

export class ToolbarNotification extends React.Component {
    static propTypes = {
        type: PropTypes.string.isRequired,
        onCloseRequested: PropTypes.func.isRequired,
    }

    handleClickOutside = () => {
        this.props.onCloseRequested()
    }

    render() {
        return (
            <div className={styles.container}>
                {this.props.type === 'tooltip-first-close' && (
                    <TooltipFirstCloseNotification
                        onCloseRequested={this.props.onCloseRequested}
                    />
                )}
            </div>
        )
    }
}

export default OnClickOutside(ToolbarNotification)
