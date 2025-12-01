import React, { PureComponent, Fragment } from 'react'
import cx from 'classnames'

import Overlay from 'src/common-ui/components/overview-overlay'
import { OverlayProps as Props } from './types'

export default class DownloadOverlay extends PureComponent<Props, {}> {
    render() {
        return (
            <Overlay
                disabled={this.props.disabled}
                header="Download Memex' Backup App to continue."
                description={
                    <Fragment>
                        <div>
                            Start the app & pick a backup folder. Then return
                            here to continue your backup.
                            <a
                                target="_blank"
                                href="https://worldbrain.io/tutorials/backups"
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
                <div>
                    <a
                        href="https://worldbrain.io/download/win"
                        target="_blank"
                    >
                        <img src={'img/windows_logo.svg'} />
                    </a>
                    <a
                        href="https://worldbrain.io/download/mac"
                        target="_blank"
                    >
                        <img src={'img/apple_logo.svg'} />
                    </a>
                    <a
                        href="https://worldbrain.io/download/linux"
                        target="_blank"
                    >
                        <img src={'img/linux_logo.svg'} />
                    </a>
                </div>
            </Overlay>
        )
    }
}
