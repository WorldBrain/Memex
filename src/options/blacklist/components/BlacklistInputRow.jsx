import React from 'react'
import PropTypes from 'prop-types'

import styled from 'styled-components'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

import styles from './BlacklistInputRow.css'

const BlacklistInputRow = ({
    value,
    isClearBtnDisabled,
    isSaveBtnDisabled,
    onAdd,
    onInputChange,
    onInputClear,
    inputRef,
}) => (
    <Container>
        <TextField
            value={value}
            type="text"
            placeholder="Enter any text or domain or path to ignore matching URLs"
            onChange={onInputChange}
            ref={inputRef}
            width="fill-available"
        />
        <PrimaryAction
            onClick={onAdd}
            disabled={isSaveBtnDisabled}
            label="Add to Block List"
        />
        <input
            value={value}
            className={styles.input}
            type="text"
            placeholder="Enter any text or domain or path to ignore matching URLs"
            ref={inputRef}
        />
    </Container>
)

export const propTypes = (BlacklistInputRow.propTypes = {
    // State
    value: PropTypes.string.isRequired,
    isClearBtnDisabled: PropTypes.bool.isRequired,
    isSaveBtnDisabled: PropTypes.bool.isRequired,

    // Event handlers
    onAdd: PropTypes.func.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onInputClear: PropTypes.func.isRequired,

    // Misc
    inputRef: PropTypes.func.isRequired,
})

export default BlacklistInputRow

const Container = styled.div`
    display: grid;
    align-items: center;
    grid-gap: 10px;

    ${TextField} {
        flex: 1;
    }
`
