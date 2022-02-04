import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import styles from './ButtonBar.css'

const ButtonBar = ({ isRunning, helpText, children }) => (
    <Container>
        <div className={styles.actionContainer}>
            <ActionBar>{children}</ActionBar>
        </div>
    </Container>
)

const Container = styled.div`
    display: flex;
    align-items: center;
    grid-auto-flow: column;
    justify-content: flex-end;
    margin-top: 30px;
`

const ActionBar = styled.div`
    display: grid;
    grid-gap: 10px;
    align-items: center;
    grid-auto-flow: column;
    justify-content: flex-end;
`

ButtonBar.propTypes = {
    isRunning: PropTypes.bool.isRequired,
    helpText: PropTypes.string.isRequired,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default ButtonBar
