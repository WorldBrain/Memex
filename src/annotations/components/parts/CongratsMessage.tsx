import React, { Component } from 'react'
import styled from 'styled-components'
import { browser } from 'webextension-polyfill-ts'

import { remoteFunction } from 'src/util/webextensionRPC'

const partyPopperIcon = browser.runtime.getURL('/img/party_popper.svg')

class CongratsMessage extends Component {
    private openOptionsTab = remoteFunction('openOptionsTab')

    private moreAboutSidebar = () => {
        // TODO: remove this direct use of WebExt API
        browser.tabs.create({
            url: 'https://worldbrain.io',
        })
    }

    private goToDashboard = () => this.openOptionsTab('overview')

    render() {
        return (
            <ContainerStyled>
                <TitleRowStyled>
                    <PartyPopperStyled src={partyPopperIcon} alt="🎉" />
                    <TitleStyled>Nice. You made your first note!</TitleStyled>
                </TitleRowStyled>
                <LearnMoreStyled onClick={this.goToDashboard}>
                    Go back to Dashboard
                </LearnMoreStyled>
            </ContainerStyled>
        )
    }
}

export default CongratsMessage

const ContainerStyled = styled.div`
    max-width: 100%;
    padding: 20px;
    text-align: center;
`

const TitleRowStyled = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
`

const TitleStyled = styled.p`
    color: rgb(54, 54, 46);
    font-weight: 600;
    font-size: 17px;
    text-align: left;
`

const PartyPopperStyled = styled.img`
    height: 43px;
    margin-top: 16px;
`

const LearnMoreStyled = styled.div`
    background: #8fffd7;
    color: rgb(54, 54, 46);
    padding: 0.5em 1em;
    border-radius: 3px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    border: none;
    transition: all 200ms ease-in-out;

    &:hover {
        background: #5cd9a6;
        color: #222222;
    }

    &:active,
    &:focus {
        outline: none;
    }

    cursor: pointer;
    font-size: 14px;
    width: max-content;
    margin: auto;
`
