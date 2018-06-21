# This module exports a set of classes for converting between DOM `Range`
# objects and different types of selector. It is mostly a thin wrapper around a
# set of anchoring libraries. It serves two main purposes:
#
#  1. Providing a consistent interface across different types of anchor.
#  2. Insulating the rest of the code from API changes in the underyling anchoring
#     libraries.

domAnchorTextPosition = require('dom-anchor-text-position')
domAnchorTextQuote = require('dom-anchor-text-quote')

xpathRange = require('./range')

# Helper function for throwing common errors
missingParameter = (name) ->
  throw new Error('missing required parameter "' + name + '"')


###*
# class:: RangeAnchor(range)
#
# This anchor type represents a DOM Range.
#
# :param Range range: A range describing the anchor.
###
class RangeAnchor
  constructor: (root, range) ->
    unless root? then missingParameter('root')
    unless range? then missingParameter('range')
    @root = root
    @range = xpathRange.sniff(range).normalize(@root)

  @fromRange: (root, range) ->
    return new RangeAnchor(root, range)

  # Create and anchor using the saved Range selector.
  @fromSelector: (root, selector) ->
    data = {
      start: selector.startContainer
      startOffset: selector.startOffset
      end: selector.endContainer
      endOffset: selector.endOffset
    }
    range = new xpathRange.SerializedRange(data)
    return new RangeAnchor(root, range)

  toRange: () ->
    return @range.toRange()

  toSelector: (options = {}) ->
    range = @range.serialize(@root, options.ignoreSelector)
    return {
      type: 'RangeSelector'
      startContainer: range.start
      startOffset: range.startOffset
      endContainer: range.end
      endOffset: range.endOffset
    }

###*
# Converts between TextPositionSelector selectors and Range objects.
###
class TextPositionAnchor
  constructor: (root, start, end) ->
    @root = root
    @start = start
    @end = end

  @fromRange: (root, range) ->
    selector = domAnchorTextPosition.fromRange(root, range)
    TextPositionAnchor.fromSelector(root, selector)

  @fromSelector: (root, selector) ->
    new TextPositionAnchor(root, selector.start, selector.end)

  toSelector: () ->
    {
      type: 'TextPositionSelector',
      start: @start,
      end: @end,
    }

  toRange: () ->
    domAnchorTextPosition.toRange(@root, {start: @start, end: @end})

###*
# Converts between TextQuoteSelector selectors and Range objects.
###
class TextQuoteAnchor
  constructor: (root, exact, context = {}) ->
    @root = root
    @exact = exact
    @context = context

  @fromRange: (root, range, options) ->
    selector = domAnchorTextQuote.fromRange(root, range, options)
    TextQuoteAnchor.fromSelector(root, selector)

  @fromSelector: (root, selector) ->
    {prefix, suffix} = selector
    new TextQuoteAnchor(root, selector.exact, {prefix, suffix})

  toSelector: () ->
    {
      type: 'TextQuoteSelector',
      exact: @exact,
      prefix: @context.prefix,
      suffix: @context.suffix,
    }

  toRange: (options = {}) ->
    range = domAnchorTextQuote.toRange(@root, this.toSelector(), options)
    if range == null
      throw new Error('Quote not found')
    range

  toPositionAnchor: (options = {}) ->
    anchor = domAnchorTextQuote.toTextPosition(@root, this.toSelector(), options)
    if anchor == null
      throw new Error('Quote not found')
    new TextPositionAnchor(@root, anchor.start, anchor.end)


exports.RangeAnchor = RangeAnchor
exports.FragmentAnchor = require('dom-anchor-fragment')
exports.TextPositionAnchor = TextPositionAnchor
exports.TextQuoteAnchor = TextQuoteAnchor
