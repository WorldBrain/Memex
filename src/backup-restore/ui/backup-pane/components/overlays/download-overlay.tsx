import React, { PureComponent, Fragment } from 'react'
import cx from 'classnames'

import Overlay from 'src/common-ui/components/overview-overlay'
import { OverlayProps as Props } from './types'

const styles = require('./styles.css')

export default class DownloadOverlay extends PureComponent<Props, {}> {
    render() {
        return (
            <Overlay
                disabled={this.props.disabled}
                header="Download Memex' Backup App to continue."
                description={
                    <Fragment>
                        <div className={styles.text}>
                            Start the app & pick a backup folder. Then return
                            here to continue your backup.
                            <a
                                className={styles.link}
                                target="_blank"
                                href="https://www.notion.so/worldbrain/7dacad9e95b44c5db681033fc264fb59"
                            >
                                &nbsp; Learn more ▸
                            </a>
                        </div>
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
