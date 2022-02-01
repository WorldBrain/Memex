import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const DownloadDetailsRow = ({
    url,
    downloaded,
    error,
    handleClick,
    isActive,
}) => (
    <Container onClick={() => window.open(url)}>
        <UrlCol>{url}</UrlCol>
        <ErrorCol>{error}</ErrorCol>
    </Container>
)

const Container = styled.tr`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    justify-content: flex-start;
    align-items: center;
    grid-auto-rows: min-content;
    padding: 10px 10px;
    cursor: pointer;

    &:nth-child(2n + 2) {
        background: ${(props) => props.theme.colors.backgroundColor};
    }
`

const UrlCol = styled.span`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: 500;
`

const ErrorCol = styled.span`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
`

DownloadDetailsRow.propTypes = {
    // State
    isActive: PropTypes.bool.isRequired,

    // Event handlers
    handleClick: PropTypes.func.isRequired,

    // Data
    url: PropTypes.string.isRequired,
    downloaded: PropTypes.string.isRequired,
    error: PropTypes.string,
}

export default DownloadDetailsRow
