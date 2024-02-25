import React, { PureComponent } from 'react'
import Button from './Button'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const styles = require('./Button.css')
const LinkButtonStyles = require('src/popup/collections-button/components/CollectionsButton.css')

interface Props {
    currentPageUrl?: string
    getRootElement: () => HTMLElement
}

interface State {
    isCopied?: boolean
}

class CopyPDFLinkButton extends PureComponent<Props, State> {
    state = {
        isCopied: false,
    }

    copyUrl() {
        navigator.clipboard.writeText(
            decodeURIComponent(
                this.props.currentPageUrl.split('?file=')[1].toString(),
            ),
        )
        this.setState({
            isCopied: true,
        })
        setTimeout(
            () =>
                this.setState({
                    isCopied: false,
                }),
            3000,
        )
    }

    render() {
        return (
            <ButtonItem disabled={false} onClick={() => this.copyUrl()}>
                <ButtonInnerContainer>
                    <Icon
                        filePath={icons.copy}
                        heightAndWidth="22px"
                        hoverOff
                    />
                    <ButtonInnerContent>
                        {this.state.isCopied === false ? (
                            <div className={styles.buttonInnerContent}>
                                Copy PDF Url
                            </div>
                        ) : (
                            <div className={styles.buttonInnerContent}>
                                Copied to Clipboard
                            </div>
                        )}
                    </ButtonInnerContent>
                </ButtonInnerContainer>
            </ButtonItem>
        )
    }
}

const ButtonInnerContainer = styled.div`
    display: flex;
    grid-gap: 15px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight}80;
    border-radius: 100px;
    height: 32px;
    width: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ButtonItem = styled.div<{ disabled: boolean }>`
    display: flex;
    grid-gap: 15px;
    width: fill-available;
    align-items: center;
    justify-content: space-between;
    border-radius: 8px;
    padding: 0px 10px;
    margin: 0px 10px -10px 10px;
    height: 50px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

    &:hover {
        background: ${(props) => props.theme.colors.greyScale3};
    }

    & * {
        cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    }
`

const ButtonInnerContent = styled.div`
    display: flex;
    grid-gap: 5px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    font-size: 14px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.white};
`

export default CopyPDFLinkButton
