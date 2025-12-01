import React from 'react'

export interface Props {
    imgSrc?: string
    CTAText?: string
    descriptionText: Object
    onCTAClick?: () => void
}

export default class OnboardingTooltip extends React.PureComponent<Props> {
    private renderCTAButton() {
        if (!this.props.CTAText || !this.props.onCTAClick) {
            return
        }

        return (
            <button className="ctaButton" onClick={this.props.onCTAClick}>
                {this.props.CTAText}
            </button>
        )
    }

    private renderImg() {
        if (!this.props.imgSrc) {
            return
        }

        return <img className="img" src={this.props.imgSrc} />
    }

    render() {
        return (
            <>
                {this.renderImg()}
                <div className="textContainer">
                    <p className="containerTitle"></p>
                    <p className="descriptionText">
                        {this.props.descriptionText}
                    </p>
                </div>
                {this.renderCTAButton()}
            </>
        )
    }
}
