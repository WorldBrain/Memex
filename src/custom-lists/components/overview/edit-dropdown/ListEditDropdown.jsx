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
                            <span className={styles.test}>
                                <button
                                    className={cx(
                                        styles.favourite,
                                        styles.button,
                                    )}
                                />
                                Favourite
                            </span>
                            <span className={styles.test}>
                                <button
                                    className={cx(styles.delete, styles.button)}
                                />
                                Delete
                            </span>
                            <span className={styles.test}>
                                <button
                                    className={cx(styles.addTag, styles.button)}
                                />
                                Add Tags
                            </span>
                            <span className={cx(styles.test, styles.test1)}>
                                <button
                                    className={cx(
                                        styles.addToList,
                                        styles.button,
                                    )}
                                    onClick={this.props.toggleAddToList}
                                />
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
