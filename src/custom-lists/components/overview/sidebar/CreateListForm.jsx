import React from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'

import styles from './Index.css'

const CreateListForm = props => (
    <div>
        <form
            className={styles.createListForm}
            onSubmit={props.onCheckboxClick}
        >
            <button type="submit" className={cx(styles.tick, styles.button)} />
            <input
                className={styles.listForm}
                name="listName"
                type="text"
                autoComplete="off"
                placeholder="List Name"
                defaultValue={props.value}
                autoFocus
                required
            />
        </form>
    </div>
)

CreateListForm.propTypes = {
    onCheckboxClick: PropTypes.func.isRequired,
    value: PropTypes.string,
}

export default CreateListForm
