import React from 'react'
import PropTypes from 'prop-types'
import niceTime from 'src/util/nice-time'
import styled from 'styled-components'

const showTags = (tags) => {
    return tags.map((tag, i) => <TagItem>{tag}</TagItem>)
}

const ResultItem = (props) => (
    <RootContainer>
        <Root href={props.url} target="_blank" onClick={props.onLinkClick}>
            <InfoContainer>
                <Title>{props.title}</Title>

                <DetailsContainer>
                    <Url>
                        {
                            props.url
                                .split('://')[1]
                                .replace('www.', '')
                                .split('/')[0]
                        }
                    </Url>
                    <DisplayTime> {niceTime(props.displayTime)} </DisplayTime>
                </DetailsContainer>
                {props.tags.length > 0 && (
                    <TagBox>{showTags(props.tags)}</TagBox>
                )}
            </InfoContainer>
        </Root>
    </RootContainer>
)

const Root = styled.a`
    padding: 20px 20px;
    text-decoration: none !important;
    display: flex;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};

    &:last-child {
        border-bottom: none;
    }
`

const RootContainer = styled.div`
    height: fit-content;
    width: fill-available;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};

    &:last-child {
        border-bottom: none;
    }

    &:hover ${Root} {
        background: ${(props) => props.theme.colors.backgroundColor};
    }
`

const InfoContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex-direction: column;
    width: fill-available;
    grid-gap: 3px;
`

const TagItem = styled.div`
    padding: 2px 8px;
    border-radius: 3px;
    background-color: ${(props) => props.theme.colors.purple};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    font-size: 12px;
    font-weight: 400;
`

const TagBox = styled.div`
    margin-top: 5px;
    display: flex;
    grid-gap: 5px;
`

const Title = styled.div`
    font-size: 15px;
    color: ${(props) => props.theme.colors.darkerText};
    font-weight: bold;
    text-decoration: none;
`

const Url = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    text-decoration: none;
`

const DetailsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`

const DisplayTime = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
`

ResultItem.propTypes = {
    // searchEngine: PropTypes.string.isRequired,
    displayTime: PropTypes.number.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    tags: PropTypes.array.isRequired,
    onLinkClick: PropTypes.func.isRequired,
}

export default ResultItem
