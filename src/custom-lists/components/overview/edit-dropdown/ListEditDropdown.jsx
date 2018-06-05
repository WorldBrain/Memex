import React, { PureComponent } from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'
import onClickOutside from 'react-onclickoutside'

import styles from './ListEditDropdown.css'

class EditDropdown extends PureComponent {
    static propTypes = {
        urlsAdded: PropTypes.arrayOf(PropTypes.string).isRequired,
        toggleAddToList: PropTypes.func.isRequired,
        handleRenderDropdown: PropTypes.node,
        closeAddToList: PropTypes.func.isRequired,
        handleFavBtnClick: PropTypes.func.isRequired,
    }

    handleClickOutside = () => this.props.closeAddToList()

    render() {
        return (
            <div className={styles.dropdownMain}>
                <div className={styles.editDropdown}>
                    <div className={styles.listSelected}>
                        {this.props.urlsAdded.length} Items selected
                    </div>
                    <div>
                        <div className={styles.buttonContainer}>
                            <span
                                className={styles.buttons}
                                onClick={this.props.handleFavBtnClick}
                            >
                                Favourite
                            </span>
                            <span className={styles.buttons}>Delete</span>
                            <span className={styles.buttons}>Add Tags</span>
                            <span
                                className={cx(styles.buttons, styles.addToList)}
                                onClick={this.props.toggleAddToList}
                            >
                                Add To List(s)
                                {this.props.handleRenderDropdown}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default onClickOutside(EditDropdown)
