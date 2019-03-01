import React, { PureComponent } from 'react'

const styles = require('./overview-overlay.css')

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
                    <p className={styles.description}>
                        {this.props.description}
                    </p>
                    {this.props.children}
                    <div className={styles.buttonbox}>
                        <div
                            className={styles.continueButton}
                            onClick={this.props.continueButtonOnClick}
                        >
                            {this.props.continueButtonText}
                        </div>
                        <div
                            className={styles.cancelButton}
                            onClick={this.props.cancelButtonOnClick}
                        >
                            {this.props.cancelButtonText}
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    }
}
