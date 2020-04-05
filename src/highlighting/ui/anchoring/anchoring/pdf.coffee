seek = require('dom-seek')

xpathRange = require('./range')

html = require('./html')
RenderingStates = require('../pdfjs-rendering-states')
{TextPositionAnchor, TextQuoteAnchor} = require('./types')

# Caches for performance

# Map of page index to page text content as a `Promise<string>`
pageTextCache = {}
# Two-dimensional map from `[quote][position]` to `{page, anchor}` intended to
# optimize re-anchoring of a pair of quote and position selectors if the
# position selector fails to anchor on its own.
quotePositionCache = {}


getSiblingIndex = (node) ->
  siblings = Array.prototype.slice.call(node.parentNode.childNodes)
  return siblings.indexOf(node)


getNodeTextLayer = (node) ->
  until node.classList?.contains('page')
    node = node.parentNode
  return node.getElementsByClassName('textLayer')[0]


getPage = (pageIndex) ->
  return PDFViewerApplication.pdfViewer.getPageView(pageIndex)


getPageTextContent = (pageIndex) ->
  if pageTextCache[pageIndex]?
    return pageTextCache[pageIndex]
  else
    joinItems = ({items}) ->
      # Skip empty items since PDF-js leaves their text layer divs blank.
      # Excluding them makes our measurements match the rendered text layer.
      # Otherwise, the selectors we generate would not match this stored text.
      # See the appendText method of TextLayerBuilder in pdf.js.
      nonEmpty = (item.str for item in items when /\S/.test(item.str))
      textContent = nonEmpty.join('')
      return textContent

    pageTextCache[pageIndex] = PDFViewerApplication.pdfViewer.getPageTextContent(pageIndex)
    .then(joinItems)
    return pageTextCache[pageIndex]


# Return the offset in the text for the whole document at which the text for
# `pageIndex` begins.
getPageOffset = (pageIndex) ->
  index = -1

  next = (offset) ->
    if ++index is pageIndex
      return Promise.resolve(offset)

    return getPageTextContent(index)
    .then((textContent) -> next(offset + textContent.length))

  return next(0)


# Return an {index, offset, textContent} object for the page where the given
# `offset` in the full text of the document occurs.
findPage = (offset) ->
  index = 0
  total = 0

  # We call `count` once for each page, in order. The passed offset is found on
  # the first page where the cumulative length of the text content exceeds the
  # offset value.
  #
  # When we find the page the offset is on, we return an object containing the
  # page index, the offset at the start of that page, and the textContent of
  # that page.
  #
  # To understand this a little better, here's a worked example. Imagine a
  # document with the following page lengths:
  #
  #    Page 0 has length 100
  #    Page 1 has length 50
  #    Page 2 has length 50
  #
  # Then here are the pages that various offsets are found on:
  #
  #    offset | index
  #    --------------
  #    0      | 0
  #    99     | 0
  #    100    | 1
  #    101    | 1
  #    149    | 1
  #    150    | 2
  #
  count = (textContent) ->
    lastPageIndex = PDFViewerApplication.pdfViewer.pagesCount - 1
    if total + textContent.length > offset or index == lastPageIndex
      offset = total
      return Promise.resolve({index, offset, textContent})
    else
      index++
      total += textContent.length
      return getPageTextContent(index).then(count)

  return getPageTextContent(0).then(count)


# Search for a position anchor within a page, creating a placeholder and
# anchoring to that if the page is not rendered.
anchorByPosition = (page, anchor, options) ->
  renderingState = page.renderingState
  renderingDone = page.textLayer?.renderingDone
  if renderingState is RenderingStates.FINISHED and renderingDone
    root = page.textLayer.textLayerDiv
    selector = anchor.toSelector(options)
    return html.anchor(root, [selector])
  else
    div = page.div ? page.el
    placeholder = div.getElementsByClassName('annotator-placeholder')[0]
    unless placeholder?
      placeholder = document.createElement('span')
      placeholder.classList.add('annotator-placeholder')
      placeholder.textContent = 'Loading annotations…'
      div.appendChild(placeholder)
    range = document.createRange()
    range.setStartBefore(placeholder)
    range.setEndAfter(placeholder)
    return range


# Search for a quote (with optional position hint) in the given pages.
# Returns a `Promise<Range>` for the location of the quote.
findInPages = ([pageIndex, rest...], quote, position) ->
  unless pageIndex?
    return Promise.reject(new Error('Quote not found'))

  attempt = (info) ->
    # Try to find the quote in the current page.
    [page, content, offset] = info
    root = {textContent: content}
    anchor = new TextQuoteAnchor.fromSelector(root, quote)
    if position?
      hint = position.start - offset
      hint = Math.max(0, hint)
      hint = Math.min(hint, content.length)
      return anchor.toPositionAnchor({hint})
    else
      return anchor.toPositionAnchor()

  next = ->
    return findInPages(rest, quote, position)

  cacheAndFinish = (anchor) ->
    if position
      quotePositionCache[quote.exact] ?= {}
      quotePositionCache[quote.exact][position.start] = {page, anchor}
    return anchorByPosition(page, anchor)

  page = getPage(pageIndex)
  content = getPageTextContent(pageIndex)
  offset = getPageOffset(pageIndex)

  return Promise.all([page, content, offset])
  .then(attempt)
  .then(cacheAndFinish)
  .catch(next)


# When a position anchor is available, quote search can prioritize pages by
# the position, searching pages outward starting from the page containing the
# expected offset. This should speed up anchoring by searching fewer pages.
prioritizePages = (position) ->
  {pagesCount} = PDFViewerApplication.pdfViewer
  pageIndices = [0...pagesCount]

  sort = (pageIndex) ->
    left = pageIndices.slice(0, pageIndex)
    right = pageIndices.slice(pageIndex)
    result = []
    while left.length or right.length
      if right.length
        result.push(right.shift())
      if left.length
        result.push(left.pop())
    return result

  if position?
    return findPage(position.start)
    .then(({index}) -> return sort(index))
  else
    return Promise.resolve(pageIndices)


###*
# Anchor a set of selectors.
#
# This function converts a set of selectors into a document range.
# It encapsulates the core anchoring algorithm, using the selectors alone or
# in combination to establish the best anchor within the document.
#
# :param Element root: The root element of the anchoring context.
# :param Array selectors: The selectors to try.
# :param Object options: Options to pass to the anchor implementations.
# :return: A Promise that resolves to a Range on success.
# :rtype: Promise
####
exports.anchor = (root, selectors, options = {}) ->
  # Selectors
  position = null
  quote = null

  # Collect all the selectors
  for selector in selectors ? []
    switch selector.type
      when 'TextPositionSelector'
        position = selector
      when 'TextQuoteSelector'
        quote = selector

  # Until we successfully anchor, we fail.
  promise = Promise.reject('unable to anchor')

  # Assert the quote matches the stored quote, if applicable
  assertQuote = (range) ->
    if quote?.exact? and range.toString() != quote.exact
      throw new Error('quote mismatch')
    else
      return range

  if position?
    promise = promise.catch ->
      return findPage(position.start)
      .then ({index, offset, textContent}) ->
        page = getPage(index)
        start = position.start - offset
        end = position.end - offset
        length = end - start
        assertQuote(textContent.substr(start, length))
        anchor = new TextPositionAnchor(root, start, end)
        return anchorByPosition(page, anchor, options)

  if quote?
    promise = promise.catch ->
      if position? and quotePositionCache[quote.exact]?[position.start]?
        {page, anchor} = quotePositionCache[quote.exact][position.start]
        return anchorByPosition(page, anchor, options)

      return prioritizePages(position)
      .then((pageIndices) -> findInPages(pageIndices, quote, position))

  return promise


###*
# Convert a DOM Range object into a set of selectors.
#
# Converts a DOM `Range` object describing a start and end point within a
# `root` `Element` and converts it to a `[position, quote]` tuple of selectors
# which can be saved into an annotation and later passed to `anchor` to map
# the selectors back to a `Range`.
#
# :param Element root: The root Element
# :param Range range: DOM Range object
# :param Object options: Options passed to `TextQuoteAnchor` and
#                        `TextPositionAnchor`'s `toSelector` methods.
###
exports.describe = (root, range, options = {}) ->

  range = new xpathRange.BrowserRange(range).normalize()

  startTextLayer = getNodeTextLayer(range.start)
  endTextLayer = getNodeTextLayer(range.end)

  # XXX: range covers only one page
  if startTextLayer isnt endTextLayer
    throw new Error('selecting across page breaks is not supported')

  startRange = range.limit(startTextLayer)
  endRange = range.limit(endTextLayer)

  startPageIndex = getSiblingIndex(startTextLayer.parentNode)
  endPageIndex = getSiblingIndex(endTextLayer.parentNode)

  iter = document.createNodeIterator(startTextLayer, NodeFilter.SHOW_TEXT)

  start = seek(iter, range.start)
  end = seek(iter, range.end) + start + range.end.textContent.length

  return getPageOffset(startPageIndex).then (pageOffset) ->
    # XXX: range covers only one page
    start += pageOffset
    end += pageOffset

    position = new TextPositionAnchor(root, start, end).toSelector(options)

    r = document.createRange()
    r.setStartBefore(startRange.start)
    r.setEndAfter(endRange.end)

    quote = TextQuoteAnchor.fromRange(root, r, options).toSelector(options)

    return Promise.all([position, quote])


###*
# Clear the internal caches of page text contents and quote locations.
#
# This exists mainly as a helper for use in tests.
###
exports.purgeCache = ->
  pageTextCache = {}
  quotePositionCache = {}
