import React from 'react'
import PropTypes from 'prop-types'
import niceTime from 'src/util/nice-time'
import styled from 'styled-components'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

const ResultItem = (props) => {
    return (
        <RootContainer>
            {props.isLoadingPDFReader && (
                <LoadingBlocker>
                    <LoadingIndicator size={20} />
                    Opening PDF
                </LoadingBlocker>
            )}
            <InfoContainer>
                <DetailsContainer>
                    <Url>{normalizeUrl(props.url).split('/')[0]}</Url>
                    <DisplayTime> {niceTime(props.displayTime)} </DisplayTime>
                </DetailsContainer>
                <Title>{props.title}</Title>
            </InfoContainer>
        </RootContainer>
    )
}

const RootContainer = styled.div`
    height: fit-content;
    width: fill-available;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    background: ${(props) => props.theme.colors.black};
    padding: 20px 20px;
    text-decoration: none !important;
    display: flex;
    position: relative;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};

    &:last-child {
        border-bottom: none;
    }

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background: ${(props) => props.theme.colors.greyScale2};
        cursor: pointer;
    }
`

const LoadingBlocker = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${(props) => props.theme.colors.black}98;
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 14px;
    grid-gap: 10px;
`

const InfoContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex-direction: column;
    width: fill-available;
    grid-gap: 8px;
`
const Title = styled.div`
    font-size: 15px;
    color: ${(props) => props.theme.colors.white};
    font-weight: bold;
    text-decoration: none;
`

const Url = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    text-decoration: none;
    font-weight: 200;
`

const DetailsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`

const DisplayTime = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
`

ResultItem.propTypes = {
    // searchEngine: PropTypes.string.isRequired,
    displayTime: PropTypes.number.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    isLoadingPDFReader: PropTypes.bool,
}

export default ResultItem
