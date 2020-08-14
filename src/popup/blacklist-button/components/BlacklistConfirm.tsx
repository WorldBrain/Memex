import React, { PureComponent } from 'react'
import cx from 'classnames'

import { ClickHandler } from '../../types'

const styles = require('./BlacklistConfirm.css')

export interface Props {
    onConfirmClick: ClickHandler<HTMLButtonElement>
    onDenyClick: ClickHandler<HTMLButtonElement>
}

class BlacklistConfirm extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.container}>
                <p className={styles.header}>Added to Blocklist</p>
                <p className={styles.content}>
                    Do you also want to delete all visits of the blocked page?
                </p>
                <div className={styles.btnBar}>
                    <button
                        className={cx(styles.btn)}
                        onClick={this.props.onConfirmClick}
                    >
                        YES
                    </button>
                    <button
                        className={styles.btnDanger}
                        onClick={this.props.onDenyClick}
                    >
                        NO
                    </button>
                </div>
            </div>
        )
    }
}

export default BlacklistConfirm
