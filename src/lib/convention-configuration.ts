import Q from 'q';
import conventionalChangelogAngular = require('conventional-changelog-angular');
import conventionalChangelogAtom = require('conventional-changelog-atom');
import conventionalChangeLogCodeMirror = require('conventional-changelog-codemirror');
import conventionalChangelogConventionalCommits = require('conventional-changelog-conventionalcommits');
import conventionalChangelogEmber = require('conventional-changelog-ember');
import conventionalChangelogESLint = require('conventional-changelog-eslint');
import conventionalChangelogExpress = require('conventional-changelog-express');
import conventionalChangelogJQuery = require('conventional-changelog-jquery');
import conventionalChangelogJSHint = require('conventional-changelog-jshint');
import conventionalChangelogCore = require('conventional-changelog-core');

// TODO: 'jscs'?
const CONVENTIONS = {
  angular: conventionalChangelogAngular,
  atom: conventionalChangelogAtom,
  codemirror: conventionalChangeLogCodeMirror,
  conventionalcommits: conventionalChangelogConventionalCommits,
  ember: conventionalChangelogEmber,
  eslint: conventionalChangelogESLint,
  express: conventionalChangelogExpress,
  jquery: conventionalChangelogJQuery,
  jshint: conventionalChangelogJSHint,
};

function conventionConfigurationResolver(
  conventionConfiguration: conventionalChangelogCore.Options
): any {
  return Q.resolve().then(() => {
    // handle traditional node-style callbacks
    if (typeof conventionConfiguration === 'function') {
      return Q.nfcall(conventionConfiguration);
    }

    // handle object literal or Promise instance
    if (typeof conventionConfiguration === 'object') {
      return Q(conventionConfiguration);
    }

    throw new Error('preset package must be a promise, function, or object');
  });
}

export async function loadConventionConfiguration(convention: string) {
  const isValidConvention = (x: string): x is keyof typeof CONVENTIONS => x in CONVENTIONS;

  if (convention == 'unknown') {
    throw new Error('Could not automatically detect convention.');
  } else if (!isValidConvention(convention)) {
    throw new Error(`The ${convention} convention is not currently supported by quick-release.`);
  } else {
    return conventionConfigurationResolver(CONVENTIONS[convention]);
  }
}
