import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import styles from './BlacklistRow.css'

const BlacklistRow = ({ expression, onDeleteClicked }) => (
    <TR>
        <TD>
            <Expression title={expression}>{expression}</Expression>
            <Icon
                onClick={onDeleteClicked}
                filePath="removeX"
                heightAndWidth="22px"
            />
        </TD>
    </TR>
)

BlacklistRow.propTypes = {
    // State
    expression: PropTypes.string.isRequired,

    // Event handlers
    onDeleteClicked: PropTypes.func.isRequired,
}

export default BlacklistRow

const TD = styled.td`
    display: flex;
    justify-content: space-between;
    width: fill-available;
    align-items: center;
`

const TR = styled.tr`
    width: fill-available;
    display: flex;
    justify-content: space-between;
    padding: 15px;
    height: 50px;
    align-items: center;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightHover};
    grid-gap: 20px;
    width: fill-available;

    &:last-child {
        border-bottom: none;
    }
`

const Expression = styled.span`
    color: ${(props) => props.theme.colors.normalText};
    font-weight: 300;
    text-overflow: ellipsis;
    display: block;
    width: 600px;
    overflow: hidden;
`
