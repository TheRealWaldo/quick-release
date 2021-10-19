import conventionalCommitsParser = require('conventional-commits-parser');

export function parseMessages(
  commitMessages: string[],
  parserOpts?: conventionalCommitsParser.Options | undefined
) {
  // TODO: Use a stream or buffer instead?
  return commitMessages.map((commitMessage) => {
    // TODO: Convert to async
    return conventionalCommitsParser.sync(commitMessage, parserOpts);
  });
}
