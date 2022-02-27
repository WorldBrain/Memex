import React from 'react'
import PricingTable, {
    ListItem,
    PricingButton,
    PricingHead,
    PricingHeadTitle,
    PricingList,
    PricingPrice,
    PricingBox,
} from 'src/authentication/components/Subscription/pricing.style'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

interface Props {
    onClick?: (...params: any) => any
    title: string
    price: string
    loading: boolean
}

export class SubscriptionPriceBox extends React.PureComponent<Props> {
    public render() {
        return (
            <PricingTable onClick={this.props.onClick}>
                {this.props.loading ? (
                    <PricingBox>
                        <LoadingIndicator />
                    </PricingBox>
                ) : (
                    <PricingBox>
                        <PricingHead>
                            <PricingHeadTitle>
                                {' '}
                                {this.props.title}{' '}
                            </PricingHeadTitle>
                        </PricingHead>
                        <PricingPrice>
                            <span>
                                {this.props.price ? this.props.price : ' '}
                            </span>
                        </PricingPrice>
                    </PricingBox>
                )}
            </PricingTable>
        )
    }
}
