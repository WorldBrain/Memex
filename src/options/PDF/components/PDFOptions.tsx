import React from 'react'
import PropTypes from 'prop-types'

const localStyles = require('src/options/privacy/components/Privacy.css')
const settingsStyle = require('src/options/settings/components/settings.css')

const PDFOptions = (props) => (
    <div className={localStyles.privacy}>
        <div className={settingsStyle.section}>
            <div className={settingsStyle.sectionTitle}>
                Automatically Open PDFs
            </div>
            <p className={settingsStyle.infoText}></p>
            <div className={localStyles.optOut}>
                <span className={settingsStyle.infoText}>
                    Should Memex automatically open remote PDFs in Memex PDF
                    Viewer to enable annotating.
                </span>
                <select
                    value={props.shouldOpen ? 'y' : 'n'}
                    onChange={props.handleOpenChange}
                >
                    <option value="y">Yes</option>
                    <option value="n">No</option>
                </select>
            </div>
        </div>
    </div>
)

PDFOptions.propTypes = {
    shouldOpen: PropTypes.bool.isRequired,
    handleOpenChange: PropTypes.func.isRequired,
}

export default PDFOptions
