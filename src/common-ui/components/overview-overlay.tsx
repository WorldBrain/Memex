import React, { PureComponent } from 'react'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { CancelAction } from 'src/common-ui/components/design-library/actions/CancelAction'
import {
    WhiteSpacer20,
    WhiteSpacer10,
} from 'src/common-ui/components/design-library/typography'

const styles = require('./overview-overlay.css')
const settingsStyle = require('src/options/settings/components/settings.css')

interface Props {
    disabled: boolean
    header: string
    description: React.ReactNode
    continueButtonText: string
    continueButtonOnClick: (...args: any[]) => any
    cancelButtonText: string
    cancelButtonOnClick: (...args: any[]) => any
    children?: React.ReactNode
}

export default class Overlay extends PureComponent<Props, {}> {
    render() {
        return !this.props.disabled ? (
            <div>
                <div className={styles.box}>
                    <h3 className={styles.header}>{this.props.header}</h3>
                    <WhiteSpacer10 />
                    <p className={styles.description}>
                        {this.props.description}
                    </p>
                    {this.props.children}
                    <WhiteSpacer20 />
                    <div className={settingsStyle.buttonArea}>
                        <CancelAction
                            onClick={this.props.cancelButtonOnClick}
                            label={this.props.cancelButtonText}
                        />
                        <PrimaryAction
                            onClick={this.props.continueButtonOnClick}
                            label={this.props.continueButtonText}
                        />
                    </div>
                </div>
            </div>
        ) : null
    }
}
