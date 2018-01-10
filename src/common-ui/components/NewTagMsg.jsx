import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'

const NewTagMsg = ({ data }) => (
    <div>
        <span className={localStyles.bold}>add new: </span> {data}
    </div>
)

NewTagMsg.propTypes = {
    data: PropTypes.string.isRequired,
}

export default NewTagMsg
