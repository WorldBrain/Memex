import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Styles from '../styles.css'
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
            cancel: classNames(Styles.label, Styles.dangerButton),
            upgrade: classNames(Styles.label, Styles.labelPremium),
        }[status]

        const onClick = () => {
            const handler = this.props.automaticBackupEnabled
                ? this.props.onCancel
                : this.props.onUpgrade
            handler()
        }

        return (
            <span
                className={classNames(extraClass)}
                onMouseEnter={() => this.setState({ hover: true })}
                onMouseLeave={() => this.setState({ hover: false })}
                onClick={onClick}
            >
                {status === 'cancel' && 'Cancel'}
                {status === 'active' && 'Enabled'}
                {status === 'upgrade' && (
                    <span>
                        <i
                            className={classNames(
                                'material-icons',
                                Styles.star,
                            )}
                        >
                            star
                        </i>
                        Upgrade Now
                    </span>
                )}
            </span>
        )
    }
}
