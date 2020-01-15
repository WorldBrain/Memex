import React from 'react'
import { ModalBox } from 'src/common-ui/components/design-library/ModalBox'
import { Link } from 'src/common-ui/components/design-library/actions/Link'
import ProgressBar from 'src/common-ui/components/ProgressBar'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import {
    CenterText,
    TypographyBodyBlock,
} from 'src/common-ui/components/design-library/typography'

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
        <ModalBox header={'Setup sync with mobile devices'} actions={[]}>
            <div>
                <CenterText>
                    <TypographyBodyBlock>
                        {'Initial sync is in progress... this may take a while'}
                    </TypographyBodyBlock>
                    <TypographyBodyBlock>
                        {'Make sure both devices stay connected'}
                    </TypographyBodyBlock>

                    <div>
                        {!error ? (
                            <div>
                                <Link
                                    label={'Cancel syncing'}
                                    onClick={() => false}
                                />
                                {progressPct === undefined ? (
                                    <LoadingIndicator />
                                ) : (
                                    <div>
                                        <div>{`Stage ${stage}`}</div>
                                        <ProgressBar
                                            progress={progressPct * 100}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <Link
                                    label={'retry syncing'}
                                    onClick={() => false}
                                />
                                Something went wrong
                            </div>
                        )}
                    </div>
                    <div>
                        <span>{'Problem with syncing?'}</span>
                        <ExternalLink label={'Send a bug report'} href={''} />
                        <ExternalLink label={'Help & FAQ'} href={''} />
                    </div>
                </CenterText>
            </div>
        </ModalBox>
    )
}
