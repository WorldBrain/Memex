import React from 'react'
import PropTypes from 'prop-types'

const localStyles = require('src/options/privacy/components/Privacy.css')
const settingsStyle = require('src/options/settings/components/settings.css')

const PDFOptions = (props) => (
    <div className={settingsStyle.subSettingsBox}>
        <span className={settingsStyle.subTitle}>
            <strong>Automatically Open PDFs in Memex Annotation Editor</strong>
        </span>
        <select
            value={props.shouldOpen ? 'y' : 'n'}
            onChange={props.handleOpenChange}
            className={settingsStyle.dropdownSelect}
        >
            <option value="y">Yes</option>
            <option value="n">No</option>
        </select>
    </div>
)

PDFOptions.propTypes = {
    shouldOpen: PropTypes.bool.isRequired,
    handleOpenChange: PropTypes.func.isRequired,
}

export default PDFOptions
