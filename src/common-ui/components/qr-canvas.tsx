import React, { HTMLProps, RefObject } from 'react'
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
                color: {
                    dark: '#FAFAFA',
                    light: '#303139',
                },
                width: 400,
            })
        } catch (err) {
            this.props.errorHandler(err)
        }
    }

    private setRef:
        | ((el: HTMLCanvasElement | null) => void)
        | RefObject<HTMLCanvasElement> = (el: HTMLCanvasElement | null) => {
        if (el) this.canvasEl = el
    }
    render() {
        const { toEncode, errorHandler, ...canvasProps } = this.props

        return <Canvas ref={this.setRef} {...canvasProps} />
    }
}

const Canvas = styled.canvas``
