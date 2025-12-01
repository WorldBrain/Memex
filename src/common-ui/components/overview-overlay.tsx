import React, { PureComponent } from 'react'
import { PrimaryAction } from '@worldbrain/memex-common/ts/common-ui/components/PrimaryAction'
import { CancelAction } from 'src/common-ui/components/design-library/actions/CancelAction'
import {
    WhiteSpacer20,
    WhiteSpacer10,
} from 'src/common-ui/components/design-library/typography'

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
                <div className="box">
                    <h3 className="header">{this.props.header}</h3>
                    <WhiteSpacer10 />
                    <p className="description">{this.props.description}</p>
                    {this.props.children}
                    <WhiteSpacer20 />
                    <div className="buttonArea">
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
