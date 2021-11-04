import { info, debug, warning } from '@actions/core';
import { parseMessages } from './parse-messages';
import conventionalCommitsFilter = require('conventional-commits-filter');
import { inc, ReleaseType } from 'semver';
import conventionalChangelogCore = require('conventional-changelog-core');
import conventionalRecommendedBump = require('conventional-recommended-bump');

const VERSIONS: ReleaseType[] = ['major', 'minor', 'patch'];

export type recommendedBumpOpts = {
  parserOpts?: conventionalChangelogCore.ParserOptions;
  whatBump?: (
    commits: string[],
    options: conventionalRecommendedBump.Options
  ) => {
    level: number;
    releaseType: ReleaseType;
  };
};

export function getRecommendedVersion(
  latestVersion: string,
  tagPrefix: string,
  commitMessages: string[],
  config: {
    recommendedBumpOpts: recommendedBumpOpts;
    parserOpts: conventionalChangelogCore.ParserOptions;
  }
): string {
  const whatBump = config.recommendedBumpOpts.whatBump;

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
    const options = { ignoreReverted: true };
    const commits = options.ignoreReverted
      ? conventionalCommitsFilter(parsedMessages)
      : parsedMessages;
    const result = whatBump(commits, options);

    if (result && result.level != null) {
      result.releaseType = VERSIONS[result.level];
    } else if (!result) {
      throw Error('whatBump did not return anything.');
    }
    debug(`whatBump result: ${JSON.stringify(result)}`);

    const recommendedVersion = tagPrefix + inc(latestVersion, result.releaseType);

    info(`Recommended version: ${latestVersion} -> ${recommendedVersion}`);
    return recommendedVersion;
  }
}
