import React from 'react'
import PropTypes from 'prop-types'
import Checkbox from 'src/common-ui/components/Checkbox'
import styled from 'styled-components'

const PrevFailedCheckbox = (props) => (
    <React.Fragment>
        <Checkbox
            id="process-failed"
            handleChange={props.onChange}
            isChecked={props.checked}
            label={'Include previously failed urls'}
            subLabel={'Retry also urls that have previously been unsuccessful'}
        ></Checkbox>
    </React.Fragment>
)

PrevFailedCheckbox.propTypes = {
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
}

export default PrevFailedCheckbox
