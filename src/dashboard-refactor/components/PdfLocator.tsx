import React from 'react'
import styled from 'styled-components'
import { fileOpen } from 'browser-fs-access'
import Margin from 'src/dashboard-refactor/components/Margin'
import { sizeConstants } from '../constants'

interface State {
    errorMessage: string | null
    isBeingDraggedOver: boolean
}

export interface Props {
    url: string
    title: string
    onFileReceive: (file: File) => Promise<void>
}

export default class PdfLocator extends React.PureComponent<Props, State> {
    private static allowedFileTypes = ['application/pdf']
    private static dropId = 'pdf-dropzone'

    state: State = { errorMessage: null, isBeingDraggedOver: false }

    private async handleFileReceived(file?: File) {
        if (!file || !PdfLocator.allowedFileTypes.includes(file.type)) {
            this.setState({ errorMessage: 'Non-PDF file received' })
            return
        }

        await this.props.onFileReceive(file)
        this.setState({ errorMessage: null })
    }

    private handleFileSelect = async () => {
        const file = await fileOpen({
            mimeTypes: PdfLocator.allowedFileTypes,
            extensions: ['.pdf'],
        })

        await this.handleFileReceived(file)
    }
    private setDragOver = (
        isBeingDraggedOver: boolean,
    ): React.DragEventHandler => (e) => {
        if ((e.target as Element).id === PdfLocator.dropId) {
            this.setState({ isBeingDraggedOver })
        }
    }

    private handleFileDrop: React.DragEventHandler = async (e) => {
        e.preventDefault()
        const [file] = e.dataTransfer.files
        await this.handleFileReceived(file)
    }

    private handleDragOver: React.DragEventHandler = async (e) =>
        e.preventDefault()

    render() {
        return (
            <Container>
                <DetailsContainer>
                    <Title>{this.props.title}</Title>
                    <Url>{this.props.url}</Url>
                </DetailsContainer>
                <LocatorContainer>
                    <LocatorHeader>
                        Open this PDF from your local file system
                    </LocatorHeader>
                    <LocatorText>
                        The person who annoted this PDF owned a copy. You need
                        one too in order to view it with annotations.
                    </LocatorText>
                    <LocatorDropContainer
                        id={PdfLocator.dropId}
                        onDrop={this.handleFileDrop}
                        onClick={this.handleFileSelect}
                        onDragOver={this.handleDragOver}
                        onDragEnter={this.setDragOver(true)}
                        onDragLeave={this.setDragOver(false)}
                    >
                        {this.state.isBeingDraggedOver && (
                            <strong>DRAGGED!!!!</strong>
                        )}
                        {this.state.errorMessage != null ? (
                            <>
                                <div>
                                    <LocatorDropText>
                                        An error occurred on processing your
                                        file:
                                    </LocatorDropText>
                                </div>
                                <div>
                                    <LocatorDropErrorText>
                                        {this.state.errorMessage}
                                    </LocatorDropErrorText>
                                </div>
                            </>
                        ) : (
                            <LocatorDropText>
                                <strong>Click here</strong> or drag & drop file
                                here
                            </LocatorDropText>
                        )}
                    </LocatorDropContainer>
                </LocatorContainer>
            </Container>
        )
    }
}

const Container = styled(Margin)`
    display: flex;
    flex-direction: column;
    align-self: center;
    max-width: ${sizeConstants.searchResults.widthPx}px;
    margin-bottom: 100px;
    width: fill-available;
`

const Title = styled.h1``

const Url = styled.span``

const DetailsContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-self: flex-start;
`

const LocatorContainer = styled.div`
    padding: 20px 25px;
    border: 1px solid black;
    border-radius: 5px;
    background-color: white;
`

const LocatorHeader = styled.h1``

const LocatorText = styled.span``

const LocatorDropContainer = styled.div`
    padding: 30px 20px;
    margin: 20px 50px;
    border-radius: 5px;
    background-color: grey;
    cursor: pointer;
`

const LocatorDropText = styled.span``

const LocatorDropErrorText = styled.span`
    color: red;
`
