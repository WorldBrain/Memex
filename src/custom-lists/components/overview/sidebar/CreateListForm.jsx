import React from 'react'
import PropTypes from 'prop-types'
import { TooltipBox } from '@worldbrain/memex-common/ts/common-ui/components/tooltip-box'

const CreateListForm = (props) => (
    <div>
        <form onSubmit={props.onCheckboxClick}>
            <input
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
            <span>
                <TooltipBox
                    tooltipText="Save"
                    placement="bottom"
                    getPortalRoot={null}
                >
                    <button type="submit" />
                </TooltipBox>
                <TooltipBox
                    tooltipText="Cancel"
                    placement="bottom"
                    getPortalRoot={null}
                >
                    <button onClick={props.closeCreateListForm} />
                </TooltipBox>
            </span>
        </form>
        {props.showWarning && <small>List name already taken.</small>}
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
