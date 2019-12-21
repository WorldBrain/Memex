import React from 'react'
import PricingTable, {
    ListItem,
    PricingButton,
    PricingHead,
    PricingHeadTitle,
    PricingList,
    PricingPrice,
} from 'src/authentication/components/Subscription/pricing.style'
import Checkmark from 'src/common-ui/components/design-library/Checkmark'

interface Props {
    onClick: (...params: any) => any
    manageSubscription?: (...params: any) => any
    title: string
    price: string
    infoItems: any[]
    subscribed?: boolean
}

export class SubscriptionPriceBox extends React.PureComponent<Props> {
    public render() {
        return (
            <PricingTable>
                <PricingHead>
                    <PricingHeadTitle> {this.props.title} </PricingHeadTitle>
                </PricingHead>
                <PricingPrice>
                    <span>{this.props.price ? this.props.price : ' '}</span>
                </PricingPrice>

                {/*<DeviceSelection>*/}
                {/*    <span>for</span>*/}
                {/*    <input inputType="number" value="1" />*/}
                {/*    <span>device</span>*/}
                {/*</DeviceSelection>*/}

                <PricingList>
                    {this.props.infoItems.map((item, index) => (
                        <ListItem key={`pricing-table-list-${index}`}>
                            <span>{item}</span>
                        </ListItem>
                    ))}
                </PricingList>

                {this.props.subscribed ? (
                    <div>
                        <PricingButton background={'white'}>
                            Subscribed
                        </PricingButton>
                        <PricingButton
                            background={'rgb(86, 113, 207)'}
                            onClick={this.props.manageSubscription}
                        >
                            Manage Subscription
                        </PricingButton>
                    </div>
                ) : this.props.price ? (
                    <PricingButton onClick={this.props.onClick}>
                        Upgrade
                    </PricingButton>
                ) : (
                    <div style={{ padding: '20px' }} />
                )}

                {/*                // <div>
                //     <h3 style={styles.title}>{this.props.title}</h3>
                // </div>
                // <ul style={styles.ul}>
                //     {this.props.infoItems.map(item => (
                //         <li style={styles.li}>
                //             {checkboxGlyph}
                //             {item}
                //         </li>
                //     ))}
                // </ul>
                // {this.props.children}
                // <div style={styles.button} onClick={this.props.onClick}>
                //     <a style={styles.link} href="#">
                //         Upgrade
                //     </a>
                // </div>*/}
            </PricingTable>
        )
    }
}

const styles = {
    ul: {
        listStyle: 'none',
    },
    li: {
        fontFamily: 'Arial',
        fontSize: '18px',
        lineHeight: '21px',
        display: 'flex',
        marginBottom: '10px',
    },
    container: {
        flex: 1,
        margin: '20px',
        padding: '10px',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.25)',
        borderRadius: '5px',
        fontFamily: 'Arial',
        fontSize: '13px',
        lineHeight: '15px',
        display: 'flex',
        flexDirection: 'column' as 'column',
    },
    button: {
        border: '3px solid #5CD9A6',
        borderRadius: '3px',
        minWidth: '100px',
        minHeight: '40px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        alignContent: 'center',
        fontFamily: 'Arial',
        fontSize: '13px',
        lineHeight: '15px',
        alignSelf: 'flex-end',
    },
    title: {
        fontFamily: 'Arial',
        fontSize: '18px',
        lineHeight: '21px',
        textAlign: 'center' as 'center',
    },
    link: {
        textDecoration: 'none',
    },
}

const checkboxGlyph = (
    <svg
        style={{ marginRight: '5px', width: '18px', height: '18px' }}
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect width="18" height="18" rx="4" fill="#10D4A3" />
        <mask
            id="mask0"
            mask-type="alpha"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="18"
            height="18"
        >
            <rect width="18" height="18" rx="4" fill="white" />
        </mask>
        <g mask="url(#mask0)">
            <rect width="18" height="18" fill="#5CD9A6" />
        </g>
        <path
            d="M7.887 10.1961L13.2536 4.8295C13.6929 4.39017 14.4052 4.39017 14.8445 4.8295C15.2839 5.26884 15.2839 5.98116 14.8445 6.42049L8.68249 12.5825C8.24315 13.0219 7.53084 13.0219 7.0915 12.5825L3.3295 8.82055C2.89017 8.38121 2.89017 7.6689 3.3295 7.22956C3.76884 6.79022 4.48116 6.79022 4.9205 7.22956L7.887 10.1961Z"
            fill="white"
        />
        <mask
            id="mask1"
            mask-type="alpha"
            maskUnits="userSpaceOnUse"
            x="3"
            y="4"
            width="13"
            height="9"
        >
            <path
                d="M7.887 10.1961L13.2536 4.8295C13.6929 4.39017 14.4052 4.39017 14.8445 4.8295C15.2839 5.26884 15.2839 5.98116 14.8445 6.42049L8.68249 12.5825C8.24315 13.0219 7.53084 13.0219 7.0915 12.5825L3.3295 8.82055C2.89017 8.38121 2.89017 7.6689 3.3295 7.22956C3.76884 6.79022 4.48116 6.79022 4.9205 7.22956L7.887 10.1961Z"
                fill="white"
            />
        </mask>
        <g mask="url(#mask1)">
            <rect width="18" height="18" fill="white" />
        </g>
    </svg>
)
