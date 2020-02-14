import React from 'react'

const styles = require('./onboarding-tooltip.css')

export interface Props {
    imgSrc?: string
    CTAText?: string
    descriptionText: string
    onCTAClick?: () => void
}

export default class OnboardingTooltip extends React.PureComponent<Props> {
    private renderCTAButton() {
        if (!this.props.CTAText || !this.props.onCTAClick) {
            return
        }

        return (
            <button
                className={styles.ctaButton}
                onClick={this.props.onCTAClick}
            >
                {this.props.CTAText}
            </button>
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
            <>
                {this.renderImg()}
                <div className={styles.textContainer}>
                    <p className={styles.containerTitle}>
                        <span className={styles.tipIcon} />
                        <span>Pro tip</span>
                    </p>
                    <p className={styles.descriptionText}>
                        {this.props.descriptionText}
                    </p>
                </div>
                {this.renderCTAButton()}
            </>
        )
    }
}
