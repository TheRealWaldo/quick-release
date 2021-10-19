import { error, debug, warning } from '@actions/core';
import { parseMessages } from './parse-messages';
import { Readable } from 'stream';
import conventionalChangelogWriter = require('conventional-changelog-writer');

async function streamToString(stream: Readable) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

export function generateChangelog(
  commitMessages: string[],
  context: conventionalChangelogWriter.Context,
  // TODO: Type config
  config: any
) {
  const parserOpts = Object.assign({}, config.parserOpts, {
    warn: warning,
    referenceActions: [
      'close',
      'closes',
      'closed',
      'fix',
      'fixes',
      'fixed',
      'resolve',
      'resolves',
      'resolved',
    ],
    issuePrefixes: ['#', 'gh-'],
  });

  const parsedMessages = parseMessages(commitMessages, parserOpts);
  const writerOptions = Object.assign({}, config.writerOpts, { debug });
  const readableStream = Readable.from(parsedMessages);

  return streamToString(
    readableStream.pipe(conventionalChangelogWriter(context, writerOptions)).on('error', (err) => {
      error(`Error in conventional-changelog-writer: ${err.message}`);
    })
  );
}
