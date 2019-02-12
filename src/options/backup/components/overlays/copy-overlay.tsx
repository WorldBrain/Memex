import React, { PureComponent } from 'react'

const styles = require('./overlay.css')

interface Props {
    onClick: (action: string) => null
    disabled: boolean
}

export default class CopyOverlay extends PureComponent<Props, {}> {
    render() {
        return !this.props.disabled ? (
            <div>
                <div className={styles.box}>
                    <h3 className={styles.header}>
                        Make sure you copy your files before you continue
                    </h3>
                    <p className={styles.description}>
                        If you don't want to redo the whole backup, make sure
                        you copied
                        <br />
                        the existing backup files into the new folder you
                        selected.
                    </p>
                    <div className={styles.buttonbox}>
                        <div
                            className={styles.colorbutton}
                            onClick={() => {
                                this.props.onClick('continue')
                            }}
                        >
                            I copied them over
                        </div>
                        <div
                            className={styles.greybutton}
                            onClick={() => {
                                this.props.onClick('cancel')
                            }}
                        >
                            Start New Backup
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    }
}
