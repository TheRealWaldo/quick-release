import { info, debug, setFailed, warning, getInput } from '@actions/core';
import conventionalChangelog from 'conventional-changelog';
import { Context } from 'conventional-changelog-core';
import { Context as WriterContext } from 'conventional-changelog-writer';
import concat from 'concat-stream';
// import conventionalRecommendedBump from 'conventional-recommended-bump';

// function getConventionalRecommendedBump() {
//   conventionalRecommendedBump({}, (error, result) => {
//     if (error) return reject(error);
//   });
// }

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
  const context: Partial<WriterContext> = {};
  // TODO: Get changelog
  generateChangelog(tagPrefix, preset, context)
    .then((changeLog) => {
      info(changeLog);
    })
    .catch((reason) => {
      throw `generateChangelog: ${reason}`;
    });
  // TODO: Get recommended bump
  //conventionalRecommendedBump();
} catch (error) {
  setFailed(error.message);
}
