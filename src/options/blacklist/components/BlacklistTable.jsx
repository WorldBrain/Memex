import React from 'react'
import PropTypes from 'prop-types'

const BlacklistTable = ({ children }) => (
    <div>
        <div />
        <div>
            <table>
                <tbody>{children}</tbody>
            </table>
        </div>
    </div>
)

BlacklistTable.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default BlacklistTable
