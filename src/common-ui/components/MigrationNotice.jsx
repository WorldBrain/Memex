import React from 'react'
import PropTypes from 'prop-types'

const MigrationNotice = ({
    banner,
    btnText,
    subText,
    onBtnClick,
    isBtnDisabled,
}) => (
    <div>
        {banner && <img className={styles.banner} src={banner} />}
        <h1>[ Action Required ]</h1>
        <p>
            2 months ago we upgraded to our 15x faster search technology.
            Whenever you were not using your computer, we tried to migrate your
            data in the background.
        </p>
        <p>
            The process, even though it should be fairly quick, is still not
            finished and we just launched new features that are incompatible
            with the old search.
        </p>

        <button type="button" disabled={isBtnDisabled} onClick={onBtnClick}>
            {btnText}
        </button>
        <p>{subText}</p>
    </div>
)

MigrationNotice.propTypes = {
    isBtnDisabled: PropTypes.bool,
    banner: PropTypes.string,
    btnText: PropTypes.string.isRequired,
    subText: PropTypes.string.isRequired,
    onBtnClick: PropTypes.func.isRequired,
}

export default MigrationNotice
