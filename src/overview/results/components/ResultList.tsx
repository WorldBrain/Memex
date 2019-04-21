import React, { ReactChild, PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./ResultList.css')
const shortcut = 'img/shortcut.svg'

export interface Props {
    scrollDisabled?: boolean
    isFilterBarActive?: boolean
    children: ReactChild[] | ReactChild
}

class ResultList extends PureComponent<Props> {
    static defaultProps = {
        scrollDisabled: false,
    }

    get mainClass() {
        return cx(styles.root, { [styles.lessHeight]: this.props.isFilterBarActive })
    }

    render() {
        return (
            <ul
                className={cx(this.mainClass, {
                    [styles.filterBarActive]: this.props.isFilterBarActive,
                })}
            >
                {this.props.children}
                <div className={styles.infoBox}>
                    <span className={styles.emoji}>🤓</span>
                    <span>
                        <b>Pro Tip: </b>
                        Search by typing
                    </span>
                    <div className={styles.tutorial}>
                        <div className={styles.keyboardM}>M</div>
                        <div className={styles.keyboardPlus}>then</div>
                        <div className={styles.keyboardSpace}>Space</div>
                    </div>
                    <span>into the browser's address bar</span>
                </div>
            </ul>
        )
    }
}

export default ResultList
