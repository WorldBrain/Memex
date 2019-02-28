import React, { PureComponent, Fragment } from 'react'
import cx from 'classnames'
import Overlay from 'src/common-ui/components/overview-overlay'

const styles = require('./styles.css')

interface Props {
    onClick: (action: string) => void
    disabled: boolean
}

export default class DownloadOverlay extends PureComponent<Props, {}> {
    render() {
        return (
            <Overlay
                disabled={this.props.disabled}
                header="Download Memex' Backup App to continue."
                description={
                    <Fragment>
                        Start it & pick a backup folder. Then return to continue
                        your backup.
                        <br />
                        <a
                            className={styles.link}
                            target="_blank"
                            href="https://www.notion.so/worldbrain/Backup-Restore-locally-and-to-any-cloud-provider-7b7e470247c548eeb3e9601a03e246a7"
                        >
                            Learn More ▸
                        </a>
                    </Fragment>
                }
                continueButtonText="I'm ready"
                continueButtonOnClick={() => this.props.onClick('continue')}
                cancelButtonText="Cancel"
                cancelButtonOnClick={() => this.props.onClick('cancel')}
            >
                <div className={styles.linkbox}>
                    <a
                        href="https://worldbrain.io/download/win"
                        target="_blank"
                    >
                        <img
                            className={styles.logo}
                            src={'img/windows_logo.svg'}
                        />
                    </a>
                    <a
                        href="https://worldbrain.io/download/mac"
                        target="_blank"
                    >
                        <img
                            className={styles.logo}
                            src={'img/apple_logo.svg'}
                        />
                    </a>
                    <a
                        href="https://worldbrain.io/download/linux"
                        target="_blank"
                    >
                        <img
                            className={cx(styles.logo, styles.linux)}
                            src={'img/linux_logo.svg'}
                        />
                    </a>
                </div>
            </Overlay>
        )
    }
}
