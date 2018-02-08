import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { DumpDB, RestoreDB, Concurrency, PrevFailedCheckbox } from '.'

import styles from './AdvSettings.css'

class AdvSettings extends PureComponent {
    // = ({ onPrevFailedToggle, prevFailedValue, ...props }) => (
    static propTypes = {
        advMode: PropTypes.bool.isRequired,
        onPrevFailedToggle: PropTypes.func.isRequired,
        prevFailedValue: PropTypes.bool.isRequired,
    }

    render() {
        const { prevFailedValue, onPrevFailedToggle, ...props } = this.props

        return (
            <section className={styles.container}>
                {props.advMode && (
                    <div className={styles.advFunctionality}>
                        <ul className={styles.settingsList}>
                            <li className={styles.settingsListItem}>
                                <Concurrency {...props} />
                            </li>
                            <li className={styles.settingsListItem}>
                                <PrevFailedCheckbox
                                    checked={prevFailedValue}
                                    onChange={onPrevFailedToggle}
                                />
                            </li>
                            <li className={styles.settingsListItem}>
                                <RestoreDB {...props} />
                            </li>
                            <li className={styles.settingsListItem}>
                                <DumpDB {...props} />
                            </li>
                        </ul>
                    </div>
                )}
            </section>
        )
    }
}

export default AdvSettings
