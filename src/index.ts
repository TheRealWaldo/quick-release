import { info, debug, setFailed, warning, getInput, exportVariable } from '@actions/core';
import conventionalChangelog from 'conventional-changelog';
import { Context } from 'conventional-changelog-core';
import { Context as WriterContext } from 'conventional-changelog-writer';
import concat from 'concat-stream';
import conventionalRecommendedBump from 'conventional-recommended-bump';

function getConventionalRecommendedBump(
  preset: string,
  tagPrefix: string
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    conventionalRecommendedBump({ preset, tagPrefix }, (error, result) => {
      if (error) return reject(error);
      resolve(result.releaseType);
    });
  });
}

function generateChangelog<TContext extends WriterContext = Context>(
  preset: string,
  tagPrefix: string,
  context: Partial<TContext>
): Promise<string> {
  return new Promise((resolve, reject) => {
    conventionalChangelog(
      {
        preset,
        warn: warning,
        debug: debug,
        tagPrefix,
      },
      context
    )
      .pipe(concat((result) => resolve(result.toString())))
      .on('error', (error) => reject(error));
  });
}

try {
  // const githubToken = getInput('github-token', { required: true });
  // const githubUsername = getInput('github-username', { required: true });
  // const remoteRepo = `https://${githubUsername}:${githubToken}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
  const tagPrefix = getInput('tag-prefix');
  const preset = getInput('preset');
  // const gitUserName = getInput('git-user-name', { required: true });
  // const gitUserEmail = getInput('git-user-email') || process.env.GITHUB_EMAIL;
  const context: Partial<Context> = {};

  generateChangelog(tagPrefix, preset, context)
    .then((changeLog) => {
      info('Changelog:');
      info(changeLog);
      info(`Version: ${context.version}`);

      exportVariable('DEBUG', 'conventional-recommended-bump');

      getConventionalRecommendedBump(preset, tagPrefix)
        .then((releaseType) => {
          info(`Recommended bump: ${releaseType}`);
        })
        .catch((reason) => {
          throw `getConventionalRecommendedBump: ${reason}`;
        });
    })
    .catch((reason) => {
      throw `generateChangelog: ${reason}`;
    });
} catch (error) {
  setFailed(error.message);
}
