import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './collections-button.css'
import { ButtonTooltip } from 'src/common-ui/components/'

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
                className={cx(styles.buttonContainer, {
                    [styles.sidebarLocked]: this.props.isSidebarLocked,
                })}
            >
                <ButtonTooltip position="bottom" tooltipText="My Collections">
                    <div className={styles.enabled}>
                        <button
                            className={cx(styles.listButton, styles.button)}
                            onClick={this.props.listBtnClick}
                            onDragEnter={this.props.onPageDrag}
                            id="collection-icon"
                        >
                            <span className={styles.title}>
                                {this.props.activeCollectionName ||
                                    'All Collections'}
                            </span>
                        </button>
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
                </ButtonTooltip>
            </div>
        )
    }
}

export default CollectionsButton
