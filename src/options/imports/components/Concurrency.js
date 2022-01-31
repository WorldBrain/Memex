import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import styles from './AdvSettings.css'

const Concurrency = ({ concurrency, onConcurrencyChange }) => (
    <React.Fragment>
        <KeyboardInput
            className={styles.concurrencyInput}
            id="concurrency"
            onChange={onConcurrencyChange}
            value={concurrency}
            min="1"
            max="20"
        />
        <Label>
            <LabelMain htmlFor="concurrency">
                # of simultaneous downloads (max. 20)
            </LabelMain>
            <SubLabel htmlFor="concurrency">
                Increasing this value can have performance implications
            </SubLabel>
        </Label>
    </React.Fragment>
)

const KeyboardInput = styled.input`
    background: ${(props) => props.theme.colors.backgroundColor};
    height: 40px;
    width: 30px;
    padding: 0 3px;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.darkerText};
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    outline: none;
    text-align: center;
    border-radius: 5px;
`

const Label = styled.div`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    align-items: flex-start;
    justify-content: center;
`

const LabelMain = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.darkerText};
`

const SubLabel = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
`

Concurrency.propTypes = {
    concurrency: PropTypes.number.isRequired,
    onConcurrencyChange: PropTypes.func.isRequired,
}

export default Concurrency
