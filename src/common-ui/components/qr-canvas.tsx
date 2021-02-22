import React, { HTMLProps } from 'react'
import QRCode from 'qrcode'
import styled from 'styled-components'

export interface Props extends HTMLProps<HTMLCanvasElement> {
    toEncode: string
    errorHandler: (e: Error) => void
}

export default class QRCanvas extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        errorHandler: (e) => undefined,
    }

    private canvasEl: HTMLCanvasElement

    async componentDidMount() {
        try {
            await QRCode.toCanvas(this.canvasEl!, this.props.toEncode, {
                scale: 8,
            })
        } catch (err) {
            this.props.errorHandler(err)
        }
    }

    private setRef = (el: HTMLCanvasElement) => (this.canvasEl = el)

    render() {
        const { toEncode, errorHandler, ...canvasProps } = this.props

        return <Canvas ref={this.setRef} {...canvasProps} />
    }
}

const Canvas = styled.canvas`
    border-radius: 10px;
    height: 150px;
    width: 150px;
    color: #5cd9a6;
`
