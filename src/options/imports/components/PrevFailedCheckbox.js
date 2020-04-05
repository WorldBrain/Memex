import React from 'react'
import PropTypes from 'prop-types'
import { Checkbox } from 'src/common-ui/components'

const PrevFailedCheckbox = props => (
    <React.Fragment>
        <Checkbox
                id="process-failed"
                handleChange={props.onChange}
                isChecked={props.checked}
        >
            <label htmlFor="process-failed">Include previously failed urls</label>
        </Checkbox>
    </React.Fragment>
)

PrevFailedCheckbox.propTypes = {
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
}

export default PrevFailedCheckbox
