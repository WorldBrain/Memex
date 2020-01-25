import React from 'react'
import { ModalBox } from 'src/common-ui/components/design-library/ModalBox'
import { Link } from 'src/common-ui/components/design-library/actions/Link'
import ProgressBar from 'src/common-ui/components/ProgressBar'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import {
    CenterText,
    TypographyBodyBold,
    TypographyBodyCenter,
    HelpBlock,
    StageBlock,
    ProgressBox,
    Warning,
    WhiteSpacer20,
    WhiteSpacer30,
} from 'src/common-ui/components/design-library/typography'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { CancelAction } from 'src/common-ui/components/design-library/actions/CancelAction'

export const SyncDeviceScreen = ({
    error,
    stage,
    progressPct,
}: {
    error?: string
    stage: string
    progressPct?: number
}) => {
    return (
        <ModalBox
            header={'Setup sync with mobile devices'}
            actions={[]}
            key={`dialog-sync`}
        >
            <ProgressBox>
                <CenterText>
                    <TypographyBodyBold>
                        {'Initial sync is in progress... this may take a while'}
                    </TypographyBodyBold>
                    <TypographyBodyCenter>
                        {'Make sure both devices stay connected'}
                    </TypographyBodyCenter>

                    <div>
                        {!error ? (
                            <div>
                                <WhiteSpacer20/>  
                                <CancelAction label={'Cancel'} onClick={() => false} />
                                {progressPct === undefined ? (
                                    <LoadingIndicator />
                                ) : (
                                    <div>
                                        <ProgressBar
                                            progress={progressPct * 100}
                                        />
                                        <StageBlock>{`Stage ${stage}`}</StageBlock>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <Warning>⚠️ Something went wrong</Warning>
                                <PrimaryAction label={'Retry Syncing'} onClick={() => false} />
                                <WhiteSpacer30/>                                
                            </div>
                        )}
                    </div>
                    <HelpBlock>
                        <span>{'Problem with syncing?'}</span>
                        <ExternalLink label={'Send a bug report'} href={''} />
                        <ExternalLink label={'Help & FAQ'} href={''} />
                    </HelpBlock>
                </CenterText>
            </ProgressBox>
        </ModalBox>
    )
}
