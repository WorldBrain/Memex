import React from 'react'
import PropTypes from 'prop-types'

import TagRow from './TagRow'
import Wrapper from './Wrapper'
import localStyles from './Tags.css'

const NewTagRow = ({ value, ...props }) => (
    <TagRow
        {...props}
        value={
            <Wrapper>
                <span className={localStyles.bold}>add new: </span> {value}
            </Wrapper>
        }
    />
)

NewTagRow.propTypes = {
    value: PropTypes.string.isRequired,
}

export default NewTagRow
