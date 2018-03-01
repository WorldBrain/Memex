import React from 'react'
import PropTypes from 'prop-types'

const styles = {
    resultItems: {
        padding: '1%',
        margin: 'auto 0px',
        color: '#000',
    },
}

const BadSearchTerm = ({ children }) => (
    <div style={styles.resultItems}>
        <h1>{children}</h1>
        <p>¯\_(ツ)_/¯</p>
    </div>
)

BadSearchTerm.propTypes = {
    children: PropTypes.string.isRequired,
}

export default BadSearchTerm
