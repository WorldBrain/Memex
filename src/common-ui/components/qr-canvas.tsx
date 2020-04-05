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

        return (
            <canvas
                style={{
                    borderRadius: '10px',
                    height: '150px',
                    width: '150px',
                    color: '#5cd9a6',
                }}
                ref={this.setRef}
                {...canvasProps}
            />
        )
    }
}
