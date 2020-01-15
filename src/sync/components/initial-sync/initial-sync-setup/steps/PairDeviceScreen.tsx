import React from 'react'
import styled from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import PairScreenLogic, {
    PairScreenDependencies,
    PairScreenEvent,
    PairScreenState,
} from 'src/sync/components/initial-sync/old/pair-device/logic'
import QRCanvas from 'src/common-ui/components/qr-canvas'
import {
    ModalBox,
    ModalColLeft,
    ModalColRight,
} from 'src/common-ui/components/design-library/ModalBox'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import {
    colorError,
    colorPrimary,
} from 'src/common-ui/components/design-library/colors'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import {
    CenterText,
    TypographyBody,
    TypographyHeadingSmall,
} from 'src/common-ui/components/design-library/typography'

const titleText = 'Setup sync with mobile devices'
const helpText = 'Scan this QR code with your mobile app to pair the devices'
const QRPlaceHolder = styled.div`
    min-width: 300px;
    min-height: 300px;
    border: 1px solid ${colorPrimary};
    box-sizing: border-box;
    border-radius: 5px;
`
const QRPlaceHolderError = styled(QRPlaceHolder)`
    border: 1px solid ${colorError};
`

const LeftColumnHelpText = () => (
    <ModalColLeft>
        <CenterText>
            <TypographyHeadingSmall>Step 2</TypographyHeadingSmall>
        </CenterText>
        <CenterText>
            <TypographyBody>{helpText}</TypographyBody>
        </CenterText>
    </ModalColLeft>
)

export const LoadingQRCode = ({}) => (
    <ModalBox
        header={titleText}
        actions={[<SecondaryAction label={'back'} onClick={() => null} />]}
    >
        <LeftColumnHelpText />

        <ModalColRight>
            <QRPlaceHolder>
                <LoadingIndicator />
            </QRPlaceHolder>
        </ModalColRight>
    </ModalBox>
)

export const ScanQRCode = ({ QRCodeData }: { QRCodeData: string }) => (
    <ModalBox
        header={titleText}
        actions={[<SecondaryAction label={'back'} onClick={() => null} />]}
    >
        <LeftColumnHelpText />

        <ModalColRight>
            <QRPlaceHolder>
                <QRCanvas toEncode={QRCodeData} />
            </QRPlaceHolder>
        </ModalColRight>
    </ModalBox>
)

export const SuccessfullyPaired = ({}) => (
    <ModalBox
        header={titleText}
        actions={[<SecondaryAction label={'back'} onClick={() => null} />]}
    >
        <LeftColumnHelpText />

        <ModalColRight>
            <QRPlaceHolder>Successfully Paired</QRPlaceHolder>
        </ModalColRight>
    </ModalBox>
)

export const ErrorPane = ({}) => (
    <ModalBox
        header={titleText}
        actions={[<SecondaryAction label={'back'} onClick={() => null} />]}
    >
        <LeftColumnHelpText />

        <ModalColRight>
            <QRPlaceHolderError>Something went wrong</QRPlaceHolderError>
        </ModalColRight>
    </ModalBox>
)

export const PairDeviceScreen = ({
    initialSyncMessage,
}: {
    initialSyncMessage?: string
}) => {
    return initialSyncMessage ? (
        <ScanQRCode QRCodeData={initialSyncMessage} />
    ) : (
        <LoadingQRCode />
    )
}
