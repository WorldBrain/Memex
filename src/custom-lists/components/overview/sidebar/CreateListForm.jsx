import React from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'

import styles from './CreateListForm.css'

const CreateListForm = props => (
    <div>
        <form
            className={styles.createListForm}
            onSubmit={props.onCheckboxClick}
        >
            <input
                className={styles.listForm}
                name="listName"
                type="text"
                autoComplete="off"
                placeholder="List Name"
                value={props.value || ''}
                onChange={props.handleNameChange}
                ref={props.setInputRef}
                autoFocus
                required
            />
            <button type="submit" className={cx(styles.tick, styles.button)} />
            <button
                onClick={props.closeCreateListForm}
                className={cx(styles.deleteButton, styles.button)}
            />
        </form>
        {props.showWarning && (
            <small className={styles.sameNameWarning}>
                List name already taken.
            </small>
        )}
    </div>
)

CreateListForm.propTypes = {
    onCheckboxClick: PropTypes.func.isRequired,
    value: PropTypes.string,
    handleNameChange: PropTypes.func.isRequired,
    showWarning: PropTypes.bool,
    setInputRef: PropTypes.func.isRequired,
    closeCreateListForm: PropTypes.func,
}

export default CreateListForm
