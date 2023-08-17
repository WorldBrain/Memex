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
                scale: 6,
                color: {
                    dark: '#FAFAFA',
                    light: '#303139',
                },
                width: 150,
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

const Canvas = styled.canvas``
