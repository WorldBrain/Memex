import React from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'
import styles from './CreateListForm.css'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

const CreateListForm = (props) => (
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
                placeholder="Collection Name"
                value={props.value || ''}
                onChange={props.handleNameChange}
                onKeyDown={props.handleNameKeyDown}
                ref={props.setInputRef}
                autoFocus
                required
            />
            <span className={styles.buttonBox}>
                <TooltipBox
                    tooltipText="Save"
                    placement="bottom"
                    getPortalRoot={null}
                >
                    <button
                        type="submit"
                        className={cx(styles.tick, styles.button)}
                    />
                </TooltipBox>
                <TooltipBox
                    tooltipText="Cancel"
                    placement="bottom"
                    getPortalRoot={null}
                >
                    <button
                        onClick={props.closeCreateListForm}
                        className={cx(styles.deleteButton, styles.button)}
                    />
                </TooltipBox>
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
