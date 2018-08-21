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
                <h1 className={styles.header}>Blacklisting successful!</h1>
                <p className={styles.content}>
                    Do you also want to delete all past visits of the
                    blacklisted page?
                </p>
                <div className={styles.btnBar}>
                    <button
                        className={cx(styles.btn, styles.btnDanger)}
                        onClick={this.props.onConfirmClick}
                    >
                        YES
                    </button>
                    <button
                        className={styles.btn}
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
