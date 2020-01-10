import React, { HTMLProps } from 'react'
import QRCode from 'qrcode'

export interface Props extends HTMLProps<HTMLCanvasElement> {
    toEncode: string
    errorHandler: (e: Error) => void
}

export default class QRCanvas extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        errorHandler: e => undefined,
    }

    private canvasEl: HTMLCanvasElement

    async componentDidMount() {
        try {
            await QRCode.toCanvas(this.canvasEl!, this.props.toEncode)
        } catch (err) {
            this.props.errorHandler(err)
        }
    }

    private setRef = (el: HTMLCanvasElement) => (this.canvasEl = el)

    render() {
        const { toEncode, errorHandler, ...canvasProps } = this.props

        return <canvas ref={this.setRef} {...canvasProps} />
    }
}
