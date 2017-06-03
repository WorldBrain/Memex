import React from 'react'
import PropTypes from 'prop-types'
import Waypoint from 'react-waypoint'

import LoadingIndicator from './LoadingIndicator'

/**
 * Handles rendering view for infinite scroll waypoint component. Simply switches between
 * loading comp and waypoint comp to trigger infinite scroll event logic.
 */
const InfScrollWaypoint = ({ isMoreLoading, handlePagination }) => isMoreLoading
    ? <LoadingIndicator />
    : <Waypoint onEnter={handlePagination} />

InfScrollWaypoint.propTypes = {
    isMoreLoading: PropTypes.bool.isRequired,

    // Logic that gets triggered when user scrolls to this component
    handlePagination: PropTypes.func.isRequired,
}

export default InfScrollWaypoint
