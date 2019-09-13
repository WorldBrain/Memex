import React from 'react'

const styles = require('./onboarding-tooltip.css')

export interface Props {
    imgSrc?: string
    CTAText?: string
    titleText: string
    descriptionText: string
    onDismiss: () => void
    onCTAClick?: () => void
}

export default class OnboardingTooltip extends React.PureComponent<Props> {
    private renderCTAButton() {
        if (!this.props.CTAText || !this.props.onCTAClick) {
            return
        }

        return (
            <div className={styles.ctaContainer}>
                <button
                    className={styles.ctaButton}
                    onClick={this.props.onCTAClick}
                >
                    {this.props.CTAText}
                </button>
            </div>
        )
    }

    private renderImg() {
        if (!this.props.imgSrc) {
            return
        }

        return <img className={styles.img} src={this.props.imgSrc} />
    }

    render() {
        return (
            <div className={styles.container}>
                {this.renderImg()}
                <div className={styles.textContainer}>
                    <h1 className={styles.titleText}>{this.props.titleText}</h1>
                    <p className={styles.descriptionText}>
                        {this.props.descriptionText}
                    </p>
                </div>
                {this.renderCTAButton()}
                <button
                    className={styles.dismissButton}
                    onClick={this.props.onDismiss}
                >
                    X
                </button>
            </div>
        )
    }
}
