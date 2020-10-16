import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import * as icons from 'src/common-ui/components/design-library/icons'
import styles from './collections-button.css'

class CollectionsButton extends PureComponent {
    static propTypes = {
        listBtnClick: PropTypes.func.isRequired,
        filteredListName: PropTypes.string,
    }

    render() {
        return (
            <div className={styles.listBtnContainer}>
                <div
                    className={styles.showListBtn}
                    onDragEnter={this.props.listBtnClick}
                    onClick={this.props.listBtnClick}
                >
                    <img
                        className={styles.showListIcon}
                        src={icons.hamburger}
                    />
                </div>
                {this.props.filteredListName && (
                    <div className={styles.filteredListName}>
                        {this.props.filteredListName}
                    </div>
                )}
            </div>
        )
    }
}

export default CollectionsButton
