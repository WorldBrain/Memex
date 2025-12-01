import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import IndexDropdown from 'src/common-ui/containers/IndexDropdown'

class IndexDropdownSB extends PureComponent {
    handleClickOutside = () => {
        this.props.closeSidebar()
    }

    render() {
        return (
            <div>
                <IndexDropdown />
            </div>
        )
    }
}

IndexDropdownSB.propTypes = {
    isSidebarOpen: PropTypes.bool.isRequired,
    closeDropdown: PropTypes.func.isRequired,
}

// export default IndexDropdownSB
export default IndexDropdownSB
