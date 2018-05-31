import React, { PureComponent } from 'react'
import cx from 'classnames'
import Proptypes from 'prop-types'

import styles from './ListEditDropdown.css'

class EditDropdown extends PureComponent {
    static propTypes = {
        urlsAdded: Proptypes.arrayOf(String).isRequired,
        toggleAddToList: Proptypes.func.isRequired,
        handleRenderDropdown: Proptypes.node,
    }

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

export default EditDropdown
