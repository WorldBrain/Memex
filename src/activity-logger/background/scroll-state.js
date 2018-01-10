export default class ScrollState {
    /**
     * @property {number} Represents the current Y pixel the user has scrolled to.
     */
    _pixel = 0

    /**
     * @property {number} Represents the furthest Y pixel the user has scrolled to.
     */
    _maxPixel = 0

    /**
     * @property {number} Represents the scrollable height of the page in pixels.
     */
    _lastKnownScrollableHeight = 0

    get pixel() {
        return this._pixel
    }

    get maxPixel() {
        return this._maxPixel
    }

    get percent() {
        return this._pixelToPercent(this._pixel)
    }

    get maxPercent() {
        return this._pixelToPercent(this._maxPixel)
    }

    _pixelToPercent = pixel =>
        parseFloat(
            Number(pixel / this._lastKnownScrollableHeight).toFixed(2),
        ) || 0

    /**
     * @param {any} scrollState Derived data from the window and DOM, extracted in content script.
     */
    updateState({ scrollOffset, windowHeight, scrollableHeight }) {
        this._lastKnownScrollableHeight = scrollableHeight
        this._pixel = scrollOffset + windowHeight

        // Update max recorded pixel if current pixel is bigger
        if (this._pixel > this._maxPixel) {
            this._maxPixel = this._pixel
        }
    }
}
