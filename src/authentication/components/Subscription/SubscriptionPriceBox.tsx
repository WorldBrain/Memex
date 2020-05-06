import React from 'react'
import PricingTable, {
    ListItem,
    PricingButton,
    PricingHead,
    PricingHeadTitle,
    PricingList,
    PricingPrice,
} from 'src/authentication/components/Subscription/pricing.style'

interface Props {
    onClick?: (...params: any) => any
    title: string
    price: string
}

export class SubscriptionPriceBox extends React.PureComponent<Props> {
    public render() {
        return (
            <PricingTable onClick={this.props.onClick}>
                <div>
                    <PricingHead>
                        <PricingHeadTitle>
                            {' '}
                            {this.props.title}{' '}
                        </PricingHeadTitle>
                    </PricingHead>
                    <PricingPrice>
                        <span>{this.props.price ? this.props.price : ' '}</span>
                    </PricingPrice>
                </div>
            </PricingTable>
        )
    }
}
