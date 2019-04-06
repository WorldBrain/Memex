import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './collections-button.css'

class CollectionsButton extends PureComponent {
    static propTypes = {
        listBtnClick: PropTypes.func.isRequired,
        onPageDrag: PropTypes.func,
        onShowBtnClick: PropTypes.func,
        isListFilterActive: PropTypes.bool.isRequired,
        activeCollectionName: PropTypes.string,
        isSidebarLocked: PropTypes.bool,
    }

    render() {
        return (
            <div
                className={styles.buttonContainer}
            >
                <div 
                    className={cx(styles.enabled, {
                        [styles.sidebarLocked]: this.props.isSidebarLocked,
                    })}
                    onClick={this.props.listBtnClick}
                    onDragEnter={this.props.onPageDrag}
                >
                    <span
                        className={cx(styles.listButton, styles.button)}
                        id="collection-icon"
                    />
                    <span className={styles.title}>
                        {this.props.activeCollectionName ||
                            'All Collections'}
                    </span>
                </div>
                {this.props.isListFilterActive && (
                    <React.Fragment>
                        <div
                            onClick={this.props.onShowBtnClick}
                            className={styles.smallButton}
                        >
                            show all
                        </div>
                    </React.Fragment>
                )}
            </div>
        )
    }
}

export default CollectionsButton
