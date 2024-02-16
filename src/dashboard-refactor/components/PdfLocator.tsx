import React from 'react'
import styled from 'styled-components'
import { dropImage } from 'src/common-ui/components/design-library/icons'

interface State {
    isBeingDraggedOver: boolean
}

export interface Props {
    url: string
    title: string
}

export default class PdfLocator extends React.PureComponent<Props, State> {
    private static dropId = 'pdf-dropzone'

    state: State = { isBeingDraggedOver: false }

    private setDragOver = (
        isBeingDraggedOver: boolean,
    ): React.DragEventHandler => (e) => {
        if ((e.target as Element).id === PdfLocator.dropId) {
            this.setState({ isBeingDraggedOver })
        }
    }

    private handleDragOver: React.DragEventHandler = async (e) =>
        e.preventDefault()

    render() {
        return (
            <LocatorContainer
                id={PdfLocator.dropId}
                onDragOver={this.handleDragOver}
                onDragEnter={this.setDragOver(true)}
                onDragLeave={this.setDragOver(false)}
                onDrop={this.setDragOver(false)}
            >
                <LocatorHeader>
                    The PDF could not be found in the expected location
                </LocatorHeader>
                <LocatorText>
                    If you have a copy somewhere else, open it with this brower
                    or drop it here
                </LocatorText>
                <LocatorDropContainerInner
                    id={PdfLocator.dropId}
                    onDragEnter={this.setDragOver(true)}
                    onDragLeave={this.setDragOver(false)}
                    onDrop={this.setDragOver(false)}
                >
                    <DropImage src={dropImage} />
                    {this.state.isBeingDraggedOver ? (
                        <LocatorDropText>...aaaand, drop!</LocatorDropText>
                    ) : (
                        <LocatorDropText>Drop PDF file here</LocatorDropText>
                    )}
                </LocatorDropContainerInner>
            </LocatorContainer>
        )
    }
}

const LocatorContainer = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
`

const LocatorHeader = styled.h1`
    text-align: center;
    color: ${(props) => props.theme.colors.primary};
    font-size: 1.5rem;
    pointer-events: none;
    margin-top: 10vh;
`

const LocatorText = styled.div`
    font-size: 1rem;
    color: ${(props) => props.theme.colors.darkgrey};
    margin-bottom: 50px;
    pointer-events: none;
`

const LocatorDropContainerInner = styled.div`
    border-radius: 5px;
    border: 2px dashed ${(props) => props.theme.colors.prime1};
    box-sizing: border-box;
    height: fill-available;
    width: fill-available;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    max-height: 800px;
    max-width: 1200px;
    width: 50vw;
    height: 50vh;
    pointer-events: none;
`

const DropImage = styled.img`
    display: flex;
    background-size: 25px;
    background-position: center center;
    border-radius: 100px;
    padding: 20px;
    margin-bottom: 40px;
    border: 3px solid ${(props) => props.theme.colors.prime1};
`

const LocatorDropText = styled.div`
    color: ${(props) => props.theme.colors.prime1};
    text-align: center;
    pointer-events: none;
    font-size: 1.5rem;
    font-weight: 400;
`
