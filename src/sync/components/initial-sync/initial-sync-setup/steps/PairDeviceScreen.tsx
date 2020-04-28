import React from 'react'
import styled from 'styled-components'
import QRCanvas from 'src/common-ui/components/qr-canvas'
import {
    ModalBox,
    ModalColLeft,
    ModalColRight,
} from 'src/common-ui/components/design-library/ModalBox'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { colorError } from 'src/common-ui/components/design-library/colors'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import {
    TypographyHeadingPage,
    TypographyBodyBlock,
} from 'src/common-ui/components/design-library/typography'

const LeftColumnHelpText = () => (
    <ModalColLeft>
        <TypographyHeadingPage>STEP 2</TypographyHeadingPage>
        <TypographyBodyBlock>{helpText}</TypographyBodyBlock>
    </ModalColLeft>
)

export const LoadingQRCode = ({
    onPressBack,
}: {
    onPressBack?: () => void
}) => (
    <ModalBox
        header={titleText}
        actions={[
            <SecondaryAction
                label={'Back'}
                onClick={onPressBack}
                key={`LoadingQRCode-back`}
            />,
        ]}
    >
        <LeftColumnHelpText />

        <ModalColRight>
            <QRPlaceHolder>
                <LoadingIndicator />
            </QRPlaceHolder>
        </ModalColRight>
    </ModalBox>
)

export const ScanQRCode = ({
    QRCodeData,
    onPressBack,
}: {
    QRCodeData: string
    onPressBack?: () => void
}) => (
    <ModalBox
        header={titleText}
        actions={[
            <SecondaryAction
                key={`ScanQRCode-back`}
                label={'Back'}
                onClick={onPressBack}
            />,
        ]}
        key={`dialog-pair-qr`}
    >
        <LeftColumnHelpText />

        <ModalColRight>
            <QRPlaceHolder>
                <QRCanvas toEncode={QRCodeData} />
            </QRPlaceHolder>
        </ModalColRight>
    </ModalBox>
)

export const ErrorPane = ({}) => (
    <ModalBox
        header={titleText}
        actions={[
            <SecondaryAction
                key={`ErrorPane-back`}
                label={'Back'}
                onClick={() => null}
            />,
        ]}
        key={`dialog-pair-error`}
    >
        <LeftColumnHelpText />

        <ModalColRight>
            <QRPlaceHolderError>Something went wrong</QRPlaceHolderError>
        </ModalColRight>
    </ModalBox>
)

export const PairDeviceScreen = ({
    initialSyncMessage,
    onPressBack,
}: {
    initialSyncMessage?: string
    onPressBack?: () => void
}) => {
    return initialSyncMessage ? (
        <ScanQRCode QRCodeData={initialSyncMessage} onPressBack={onPressBack} />
    ) : (
        <LoadingQRCode onPressBack={onPressBack} />
    )
}

const titleText = 'Pair your computer with a mobile device'
const helpText = 'Scan this QR code with your mobile app to pair the devices'
const QRPlaceHolder = styled.div`
    min-width: 150px;
    min-height: 150px;
    border: 1px solid #e0e0e0;
    box-sizing: border-box;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
`

const QRPlaceHolderError = styled(QRPlaceHolder)`
    border: 1px solid ${colorError};
`
