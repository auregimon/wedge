// Post a Wedge report as a sticky PR comment via the `gh` CLI.
// Sticky = find the prior comment by its hidden marker and UPDATE it, so re-runs
// don't spam the PR. Requires `gh` to be installed and authenticated.
import { execSync } from 'node:child_process';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

export function detectRepo() {
  try { return JSON.parse(sh('gh repo view --json nameWithOwner')).nameWithOwner; }
  catch { return null; }
}

function findStickyId(repo, pr, marker) {
  try {
    const comments = JSON.parse(sh(`gh api "repos/${repo}/issues/${pr}/comments" --paginate`));
    return comments.find(c => c.body && c.body.includes(marker))?.id ?? null;
  } catch { return null; }
}

// bodyFile: path to a file holding the markdown. Returns { action, id, url }.
export function postSticky({ repo, pr, bodyFile, marker, dryRun = false }) {
  const existing = findStickyId(repo, pr, marker);
  const action = existing ? 'update' : 'create';
  if (dryRun) return { action, id: existing, url: null, dryRun: true };

  const out = existing
    ? sh(`gh api "repos/${repo}/issues/comments/${existing}" -X PATCH -F body=@${bodyFile}`)
    : sh(`gh api "repos/${repo}/issues/${pr}/comments" -X POST -F body=@${bodyFile}`);
  const json = JSON.parse(out);
  return { action, id: json.id, url: json.html_url };
}
