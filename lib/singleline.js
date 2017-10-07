/* @flow */

import { Range, Point } from 'atom'
import type { TextEditor } from 'atom'
import type { LinterMessage, MessagesPatch } from './types'

function getText(
  range: Range,
  filePath: string,
  textEditors: Array<TextEditor>,
): ?string {
  const textEditor = textEditors.find(
    textEditor2 => textEditor2.getPath() === filePath,
  )

  if (!textEditor) {
    return null
  }

  return textEditor.getTextInBufferRange(range)
}

function updateRange(
  range: Range,
  filePath: string,
  textEditors: Array<TextEditor>,
): Range {
  const text = getText(range, filePath, textEditors)
  const lines = text == null ? [] : text.split('\n')
  const endRowIndex = lines.findIndex(line => line !== '')

  const endRow =
    endRowIndex === -1 ? range.end.row : range.start.row + endRowIndex

  const endColumn =
    endRowIndex === -1 ? range.end.column : lines[endRowIndex].length

  return new Range(range.start, new Point(endRow, endColumn))
}

function updateMessage(
  message: LinterMessage,
  textEditors: Array<TextEditor>,
): LinterMessage {
  switch (message.version) {
    case 2:
      return Object.assign({}, message, {
        location: Object.assign({}, message.location, {
          position: updateRange(
            message.location.position,
            message.location.file,
            textEditors,
          ),
        }),
      })

    case 1:
      return Object.assign({}, message, {
        range:
          message.range && message.filePath != null
            ? updateRange(message.range, message.filePath, textEditors)
            : message.range,
      })

    default:
      return message
  }
}

function updateMessages(
  messages: Array<LinterMessage>,
  textEditors: Array<TextEditor>,
): Array<LinterMessage> {
  return messages.map(message => updateMessage(message, textEditors))
}

function updateMessagesPatch(
  difference: MessagesPatch,
  textEditors: Array<TextEditor>,
): MessagesPatch {
  return {
    added: updateMessages(difference.added, textEditors),
    removed: updateMessages(difference.removed, textEditors),
    messages: updateMessages(difference.messages, textEditors),
  }
}

module.exports = updateMessagesPatch
