import React from 'react'

import ShareButton from './ShareButton'

const ShareButtons = () => (
    <div>
        <div>
            <ShareButton
                href="https://worldbrain.io/share/facebook"
                imgSrc="/img/face.png"
            />
            <ShareButton
                href="https://worldbrain.io/share/twitter"
                imgSrc="/img/twitt.png"
            />
            <ShareButton
                href="https://worldbrain.io/share/reddit"
                imgSrc="/img/ic.png"
            />
            <ShareButton
                href="https://worldbrain.io/share/email"
                imgSrc="/img/@.png"
            />
            <ShareButton href="https://worldbrain.io/help">
                FEEDBACK
            </ShareButton>
            <div>
                <ShareButton
                    href="https://worldbrain.io/how-can-we-help-you/"
                    imgSrc="/img/chatwithus.png"
                    style={{ height: 35, width: 35 }}
                />
                <p>
                    <a
                        target="_new"
                        href="https://worldbrain.io/how-can-we-help-you/"
                    />
                </p>{' '}
            </div>
        </div>
    </div>
)

export default ShareButtons
