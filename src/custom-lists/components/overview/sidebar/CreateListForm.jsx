import React from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
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
                onKeyDown={props.handleNameKeyDown}
                ref={props.setInputRef}
                autoFocus
                required
            />
            <span className={styles.buttonBox}>
                <ButtonTooltip tooltipText="Save" position="bottom">
                    <button
                        type="submit"
                        className={cx(styles.tick, styles.button)}
                    />
                </ButtonTooltip>
                <ButtonTooltip tooltipText="Cancel" position="bottom">
                    <button
                        onClick={props.closeCreateListForm}
                        className={cx(styles.deleteButton, styles.button)}
                    />
                </ButtonTooltip>
            </span>
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
    handleNameKeyDown: PropTypes.func,
    showWarning: PropTypes.bool,
    setInputRef: PropTypes.func.isRequired,
    closeCreateListForm: PropTypes.func,
}

export default CreateListForm
