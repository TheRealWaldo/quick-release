import { info, debug, warning } from '@actions/core';
import { parseMessages } from './parse-messages';
import conventionalCommitsFilter = require('conventional-commits-filter');
import { inc } from 'semver';

const VERSIONS = ['major', 'minor', 'patch'];

function noop() {
  warning('noop called');
}

export function getRecommendedVersion(
  latestVersion: string,
  tagPrefix: string,
  commitMessages: string[],
  // TODO: Type config
  config: any
) {
  // TODO: Turn this into a promise
  // return new Promise((resolve, reject) => {
  const whatBump =
    config.recommendedBumpOpts && config.recommendedBumpOpts.whatBump
      ? config.recommendedBumpOpts.whatBump
      : noop;

  if (typeof whatBump !== 'function') {
    throw Error('whatBump must be a function');
  }

  const bumpParserOpts = Object.assign(
    {},
    config.recommendedBumpOpts && config.recommendedBumpOpts.parserOpts
      ? config.recommendedBumpOpts.parserOpts
      : config.parserOpts,
    {
      warn: warning,
    }
  );

  debug(`parser opts: ${JSON.stringify(bumpParserOpts)}`);
  const parsedMessages = parseMessages(commitMessages, bumpParserOpts);

  if (!parsedMessages || !parsedMessages.length) {
    warning('No commits since last release.');
    return latestVersion;
  } else {
    // TODO: Allow for ignoreReverted to be set in action configuration
    const options = Object.assign({ ignoreReverted: true }, {});
    const commits = options.ignoreReverted
      ? conventionalCommitsFilter(parsedMessages)
      : parsedMessages;
    let result = whatBump(commits, options);

    // TODO: Figure out what happens if there is no commits
    if (result && result.level != null) {
      result.releaseType = VERSIONS[result.level];
    } else if (result == null) {
      result = {};
    }
    debug(`whatBump result: ${JSON.stringify(result)}`);

    const recommendedVersion = tagPrefix + inc(latestVersion, result.releaseType);

    info(`Recommended version: ${latestVersion} -> ${recommendedVersion}`);
    return recommendedVersion;
  }
  //});
}
