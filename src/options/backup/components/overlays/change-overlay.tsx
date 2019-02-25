import React, { PureComponent } from 'react'

const styles = require('./overlay.css')

interface Props {
    onClick: (action: string) => null
    disabled: boolean
}

export default class ChangeOverlay extends PureComponent<Props, {}> {
    render() {
        return !this.props.disabled ? (
            <div>
                <div className={styles.box}>
                    <h3 className={styles.header}>Are you sure?</h3>
                    <p className={styles.description}>
                        Changing your backup location will require a completely
                        fresh backup which might take some time.
                    </p>
                    <div className={styles.buttonbox}>
                        <div
                            className={styles.continueButton}
                            onClick={() => {
                                this.props.onClick('yes')
                            }}
                        >
                            Yes, get started
                        </div>
                        <div
                            className={styles.cancelButton}
                            onClick={() => {
                                this.props.onClick('nope')
                            }}
                        >
                            Nope, get back
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    }
}
