import React, { HTMLProps } from 'react'
import QRCode from 'qrcode'

export interface Props extends HTMLProps<HTMLCanvasElement> {
    toEncode: string
    errorHandler: (e: Error) => void
}

export default class QRCanvas extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        errorHandler: (e) => undefined,
    }

    private canvasRef = React.createRef<HTMLCanvasElement>()

    async componentDidMount() {
        try {
            await QRCode.toCanvas(
                this.canvasRef.current!,
                this.props.toEncode,
                {
                    color: {
                        dark: '#FAFAFA',
                        light: '#303139',
                    },
                    width: 400,
                },
            )
        } catch (err) {
            this.props.errorHandler(err)
        }
    }

    render() {
        const { toEncode, errorHandler, ...canvasProps } = this.props
        return <canvas ref={this.canvasRef} {...canvasProps} />
    }
}
