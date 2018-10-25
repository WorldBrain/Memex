import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import backupStyles from '../styles.css'
// import styles from './overview-automatic-backup-button.css'

export default class AutomaticBackupButton extends React.Component {
    static propTypes = {
        automaticBackupEnabled: PropTypes.bool,
        onUpgrade: PropTypes.func.isRequired,
        onCancel: PropTypes.func.isRequired,
    }

    state = {
        hover: false,
    }

    render(props) {
        let status
        if (this.props.automaticBackupEnabled) {
            if (this.state.hover) {
                status = 'cancel'
            } else {
                status = 'active'
            }
        } else {
            status = 'upgrade'
        }

        const extraClass = {
            cancel: backupStyles.dangerButton,
            upgrade: backupStyles.paymentButton,
        }[status]

        const onClick = () => {
            const handler = this.props.automaticBackupEnabled
                ? this.props.onCancel
                : this.props.onUpgrade
            handler()
        }

        return (
            <div
                className={classNames(backupStyles.smallButton, extraClass)}
                onMouseEnter={() => this.setState({ hover: true })}
                onMouseLeave={() => this.setState({ hover: false })}
                onClick={onClick}
            >
                {status === 'cancel' && 'Cancel'}
                {status === 'active' && 'Enabled'}
                {status === 'upgrade' && 'Enable'}
            </div>
        )
    }
}
