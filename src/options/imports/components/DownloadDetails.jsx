import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const DownloadDetails = ({ children, filterHandlers, filter }) => (
    <DetailsContainer>
        <DetailsTable>
            <DetailsTableBody>{children}</DetailsTableBody>
        </DetailsTable>
    </DetailsContainer>
)

const DetailsContainer = styled.div`
    max-height: 600px;

    overflow: scroll;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const DetailsTable = styled.table``

const DetailsTableBody = styled.tbody``

DownloadDetails.propTypes = {
    // Event handlers
    filterHandlers: PropTypes.shape({
        all: PropTypes.func.isRequired,
        succ: PropTypes.func.isRequired,
        fail: PropTypes.func.isRequired,
    }).isRequired,
    filter: PropTypes.string.isRequired,

    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default DownloadDetails
