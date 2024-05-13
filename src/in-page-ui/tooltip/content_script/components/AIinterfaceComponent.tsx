import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import React from 'react'
import styled, { css } from 'styled-components'

export interface Props {
    sendAIprompt: any
    highlightText: string
}
export interface State {
    loadingState: UITaskState
    responseText: string
}

export default class AIInterfaceForTooltip extends React.Component<Props> {
    state = {
        responseText: '',
        loadingState: 'running',
    }

    async componentDidMount() {
        const checkCounter = false
        if (!checkCounter) {
            this.setState({
                loadingState: 'success',
                responseText:
                    'You have used up your free AI requests for this page. Please upgrade',
            })
            return
        }
        if (this.props.highlightText.length > 4000) {
            this.setState({
                loadingState: 'success',
                responseText: 'Selected text is too long to summarise.',
            })
            return
        }
        let promptResponse = await this.props.sendAIprompt({
            prompt: 'Summarize the key take-aways from this text: ',
        })
        let summary = promptResponse.choices[0].text

        if (summary.startsWith(':')) {
            summary = summary.slice(2)
        }

        if (summary.length > 0) {
            this.setState({
                loadingState: 'success',
                responseText: summary,
            })
        }
    }

    async newPrompt(prompt: string) {
        this.setState({
            loadingState: 'running',
        })
        let promptResponse = await this.props.sendAIprompt({
            prompt: prompt,
        })

        let summary = promptResponse.choices[0].text

        if (summary.startsWith(':')) {
            summary = summary.slice(2)
        }

        if (summary.length > 0) {
            this.setState({
                loadingState: 'success',
                responseText: summary,
            })
        }
    }

    render() {
        return (
            <Container>
                <SuggestionsButtons className="noDrag">
                    <SuggestionsButton
                        className="noDrag"
                        onClick={() =>
                            this.newPrompt(
                                'Summarize the key take-aways from this text: ',
                            )
                        }
                    >
                        The key take-aways
                    </SuggestionsButton>
                    <SuggestionsButton
                        className="noDrag"
                        onClick={() =>
                            this.newPrompt(
                                'Summarise this for me in 3 sentences: ',
                            )
                        }
                    >
                        Summarise this for me
                    </SuggestionsButton>

                    <SuggestionsButton
                        className="noDrag"
                        onClick={() =>
                            this.newPrompt(
                                'Explain me this like I am a second grader, but don not be condescending: ',
                            )
                        }
                    >
                        Explain me like I am 5
                    </SuggestionsButton>
                </SuggestionsButtons>
                <ResponseArea
                    className="noDrag"
                    loadingState={this.state.loadingState === 'running'}
                >
                    {this.state.loadingState === 'running' ? (
                        <LoadingIndicator size={20} />
                    ) : (
                        this.state.responseText
                    )}
                </ResponseArea>
                <SummaryFooter>
                    <RightSideButtons>
                        <BetaButton>
                            <BetaButtonInner>BETA</BetaButtonInner>
                        </BetaButton>
                        <PrimaryAction
                            type="tertiary"
                            size="small"
                            onClick={() => {
                                window.open(
                                    'https://memex.garden/chatsupport',
                                    '_blank',
                                )
                            }}
                            label="Report Bug"
                        />
                    </RightSideButtons>
                    <PoweredBy>
                        Powered by
                        <Icon
                            icon="openAI"
                            height="18px"
                            hoverOff
                            width="70px"
                        />
                    </PoweredBy>
                </SummaryFooter>
            </Container>
        )
    }
}

const TextFieldContainer = styled.div`
    padding: 10px;
    width: fill-available;
`

const ResponseArea = styled.div<{ loadingState: boolean }>`
    min-height: 100px;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    margin: 10px 20px 20px 20px;
    cursor: text;

    ${(props) =>
        props.loadingState &&
        css`
            align-items: center;
            justify-content: center;
        `}
    &:hover {
        cursor: text;
    }
`

const SuggestionsButtons = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    grid-gap: 5px;
    color: ${(props) => props.theme.colors.greyScale4};
    margin: 20px 20px 10px 20px;
    width: fill-available;
    font-size: 14px;
`

const SuggestionsButton = styled.div`
    padding: 5px 10px;
    border-radius: 30px;
    background: ${(props) => props.theme.colors.greyScale2};
    font-size: 12px;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale6};

    &:hover {
        background: ${(props) => props.theme.colors.greyScale3};
        cursor: pointer;
    }
`

const SummaryFooter = styled.div`
    width: fill-available;
    display: flex;
    align-items: center;
    justify-content: space-between;
    grid-gap: 10px;
    padding: 20px 20px 10px 20px;
`

const PoweredBy = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 12px;
    height: 26px;
`

const Container = styled.div`
    display: flex;
    width: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-direction: column;
    position: relative;
`

const RightSideButtons = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 10px;
`

const BetaButton = styled.div`
    display: flex;
    background: linear-gradient(
        90deg,
        #d9d9d9 0%,
        #2e73f8 0.01%,
        #0a4bca 78.86%,
        #0041be 100%
    );
    border-radius: 50px;
    height: 24px;
    width: 50px;
    align-items: center;
    justify-content: center;
`

const BetaButtonInner = styled.div`
    display: flex;
    background: ${(props) => props.theme.colors.greyScale1};
    color: #0a4bca;
    font-size: 12px;
    letter-spacing: 1px;
    height: 20px;
    width: 46px;
    font-weight: bold;
    align-items: center;
    justify-content: center;
    border-radius: 50px;
`
