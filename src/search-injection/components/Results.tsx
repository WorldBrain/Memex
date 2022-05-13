import React from 'react'
import PropTypes from 'prop-types'
import Dropdown from './Dropdown'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { ButtonTooltip } from 'src/common-ui/components'
import { browser } from 'webextension-polyfill-ts'

const settings = browser.runtime.getURL('/img/settings.svg')
const compress = browser.runtime.getURL('/img/compress-alt.svg')
const expand = browser.runtime.getURL('/img/expand-alt.svg')
const search = browser.runtime.getURL('/img/search.svg')

const Results = (props) => {
    // const searchEngineClass = `${props.searchEngine}_${props.position}`
    return (
        <>
            <MemexContainer
                position={props.position}
                hideResults={props.hideResults}
                // searchEngine={props.searchEngine}
            >
                <UpdateNotifBannerBox>
                    <UpdateNotifBanner
                        theme={{
                            width:
                                props.position === 'side' && 'fill-available',
                            position: 'relative',
                            iconSize: '20px',
                        }}
                    />
                </UpdateNotifBannerBox>
                <TopBarArea hideResults={props.hideResults}>
                    <ResultsBox>
                        <ButtonTooltip
                            position={'bottom'}
                            tooltipText={
                                props.hideResults
                                    ? 'Show Results'
                                    : 'Hide Results'
                            }
                        >
                            <Icon
                                filePath={props.hideResults ? expand : compress}
                                heightAndWidth="16px"
                                onClick={props.toggleHideResults}
                            />
                        </ButtonTooltip>
                        <TotalCount>{props.totalCount}</TotalCount>
                        <ResultsText>Memex Results</ResultsText>
                    </ResultsBox>
                    <IconArea>
                        <ButtonTooltip
                            position={'bottom'}
                            tooltipText={'Go to Dashboard'}
                        >
                            <Icon
                                filePath={search}
                                heightAndWidth="16px"
                                onClick={props.seeMoreResults}
                            />
                        </ButtonTooltip>
                        <SettingsButtonContainer>
                            <ButtonTooltip
                                position={'bottom'}
                                tooltipText={'Settings'}
                            >
                                <Icon
                                    filePath={settings}
                                    heightAndWidth="16px"
                                    onClick={props.toggleDropdown}
                                />
                            </ButtonTooltip>
                            {props.dropdown && (
                                <Dropdown
                                    remove={props.removeResults}
                                    rerender={props.changePosition}
                                    closeDropdown={props.closeDropdown}
                                />
                            )}
                        </SettingsButtonContainer>
                    </IconArea>
                </TopBarArea>
                {!props.hideResults && (
                    <ResultsContainer>
                        {props.renderResultItems()}
                    </ResultsContainer>
                )}
            </MemexContainer>
        </>
    )
}

const SettingsButtonContainer = styled.div`
    height: 24px;
`

const MemexContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-height: ${(props) => (props.hideResults ? 'fit-content' : '650px')};
    width: ${(props) =>
        props.position === 'above' ? 'fill-available' : '450px'};
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    animation: fadeIn 1s ease-in;
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
    border-radius: 8px;
    margin-right: ${(props) => (props.position === 'above' ? '0px' : '30px')};
    background: white;
`

const TopBarArea = styled.div<{ hideResults }>`
    border-bottom: ${(props) =>
        props.hideResults
            ? 'none'
            : '1px solid' + props.theme.colors.lightgrey};
    height: 50px;
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
`

const ResultsBox = styled.div`
    display: grid;
    grid-gap: 5px;
    align-items: center;
    grid-auto-flow: column;
    align-items: center;
`

const TotalCount = styled.div`
    color: ${(props) => props.theme.colors.purple};
    font-weight: bold;
    font-size: 16px;
`

const ResultsText = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-weight: bold;
    font-size: 16px;
`

const IconArea = styled.div`
    display: grid;
    grid-gap: 10px;
    align-items: center;
    grid-auto-flow: column;
`

const ResultsContainer = styled.div`
    display: flex;
    flex: 1;
    height: fill-available;
    flex-direction: column;
    overflow: scroll;
    height: 500px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const UpdateNotifBannerBox = styled.div`
    height: fit-content;
    border-radius: 8px 8px 0 0;
    position: relative;
    bottom: 0px;
    width: fill-available;
    overflow: hidden;
`

Results.propTypes = {
    position: PropTypes.string.isRequired,
    searchEngine: PropTypes.string.isRequired,
    totalCount: PropTypes.number,
    seeMoreResults: PropTypes.func.isRequired,
    toggleHideResults: PropTypes.func.isRequired,
    hideResults: PropTypes.bool.isRequired,
    toggleDropdown: PropTypes.func.isRequired,
    closeDropdown: PropTypes.func.isRequired,
    dropdown: PropTypes.bool.isRequired,
    removeResults: PropTypes.func.isRequired,
    changePosition: PropTypes.func.isRequired,
    renderResultItems: PropTypes.func.isRequired,
    renderNotification: PropTypes.node,
}

export default Results
