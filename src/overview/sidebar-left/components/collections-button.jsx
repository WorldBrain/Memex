import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import styles from './collections-button.css'

class CollectionsButton extends PureComponent {
    static propTypes = {
        listBtnClick: PropTypes.func.isRequired,
        onShowBtnClick: PropTypes.func,
        isListFilterActive: PropTypes.bool.isRequired,
    }

    render() {
        return (
            <div
                className={styles.buttonContainer}
                onDragEnter={this.props.listBtnClick}
            >
                {this.props.isListFilterActive ? (
                    <div
                        onClick={this.props.onShowBtnClick}
                        className={styles.enabled}
                    >
                        Show All
                    </div>
                ) : (
                    <div
                        onClick={this.props.listBtnClick}
                        className={styles.enabled}
                    >
                        Show Collections
                    </div>
                )}
            </div>
        )
    }
}

export default CollectionsButton
