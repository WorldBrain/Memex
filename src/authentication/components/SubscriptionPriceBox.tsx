import React from 'react'

interface Props {
    onClick: (...params: any) => any
}
export class SubscriptionPriceBox extends React.PureComponent<Props> {
    public render() {
        return (
            <div style={styles.container} onClick={this.props.onClick}>
                <div>
                    <h3>{this.props.children}</h3>
                    <span>Automatic Backups &amp; Sync</span>
                </div>
                <div>
                    <span>€</span> <span>1</span>
                    <div>
                        <span>50</span>
                    </div>
                </div>
                <ul>
                    <li>
                        <div>
                            <span />
                            <p>Everything in Basic</p>
                        </div>
                    </li>
                    <li>
                        <div>
                            <span />
                            <p>Automatic Backups every 15 min</p>
                        </div>
                    </li>
                    <li>
                        <div>
                            <span />
                            <p>
                                Sync between your devices
                                <br />
                                <span>Work in Progress</span>
                            </p>
                        </div>
                    </li>
                    <li>
                        <div />
                    </li>
                </ul>
                <div>
                    <a href="#">Upgrade</a>
                </div>
            </div>
        )
    }
}

const styles = {
    container: {
        flex: 1,
        border: '1px solid grey',
        margin: '20px',
    },
}
