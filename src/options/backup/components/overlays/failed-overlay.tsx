import React, { PureComponent } from 'react'

const styles = require('./overlay.css')

interface Props {
    onClick: (action: string) => void
    disabled: boolean
}

export default class FailedOverlay extends PureComponent<Props, {}> {
    render() {
        return !this.props.disabled ? (
            <div>
                <div className={styles.box}>
                    <h3 className={styles.header}>
                        No data found in your selected folder
                    </h3>
                    <p className={styles.description}>
                        Change the folder location via the Memex Local App
                        settings and then press continue.
                    </p>
                    <div className={styles.buttonbox}>
                        <div
                            className={styles.colorbutton}
                            onClick={() => {
                                this.props.onClick('continue')
                            }}
                        >
                            Continue
                        </div>
                        <div
                            className={styles.greybutton}
                            onClick={() => {
                                this.props.onClick('cancel')
                            }}
                        >
                            Cancel
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    }
}
