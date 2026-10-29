#!/usr/bin/env bun

import { lstat, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

type Status = "modified" | "added" | "deleted" | "renamed" | "copied" | "untracked";
type File = { path: string; status: Status; previousPath?: string; ranges?: string[] };

const args = Bun.argv.slice(2);
const staged = args.includes("--staged");
const refArg = args.find((arg) => arg.startsWith("--ref="));
const commitArg = args.find((arg) => arg.startsWith("--commit="));
const all = args.includes("--all");
const folders: string[] = [];
const paths: string[] = [];
for (let index = 0; index < args.length; index++) {
  const arg = args[index]!;
  if (arg === "--folder") {
    const folder = args[++index];
    if (!folder || folder.startsWith("--")) throw new Error("--folder requires a directory");
    folders.push(folder);
  } else if (arg !== "--all" && arg !== "--staged" && arg !== refArg && arg !== commitArg) {
    paths.push(arg);
  }
}
const inventory = all || folders.length > 0;
const modes = Number(staged) + Number(Boolean(refArg)) + Number(Boolean(commitArg)) + Number(all) + Number(folders.length > 0);
if (modes > 1) throw new Error("Use only one of --staged, --ref, --commit, --folder, or --all");
if (inventory && paths.length) throw new Error("Inventory modes cannot be combined with positional diff filters");
if (paths.some((path) => path.startsWith("--"))) throw new Error(`Unknown option: ${paths.find((path) => path.startsWith("--"))}`);

async function git(...command: string[]): Promise<string> {
  const child = Bun.spawn(["git", ...command], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  if (code !== 0) throw new Error(stderr.trim() || `git ${command.join(" ")} failed`);
  return stdout.trimEnd();
}

async function exists(ref: string): Promise<boolean> {
  try { await git("rev-parse", "--verify", `${ref}^{commit}`); return true; } catch { return false; }
}

async function defaultBranch(): Promise<string | undefined> {
  try { return (await git("symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD")).trim(); } catch {}
  for (const ref of ["origin/main", "origin/master", "main", "master"]) if (await exists(ref)) return ref;
}

function pathspec(command: string[]): string[] {
  return paths.length ? [...command, "--", ...paths] : command;
}

function parseFiles(output: string): File[] {
  const parts = output.split("\0").filter(Boolean);
  const files: File[] = [];
  const statuses: Record<string, Status> = { M: "modified", A: "added", D: "deleted", R: "renamed", C: "copied", T: "modified" };
  for (let index = 0; index < parts.length;) {
    const status = statuses[parts[index++]?.[0] ?? ""];
    if (!status) continue;
    if (status === "renamed" || status === "copied") {
      const previousPath = parts[index++];
      const path = parts[index++];
      if (path && previousPath) files.push({ path, previousPath, status });
    } else {
      const path = parts[index++];
      if (path) files.push({ path, status });
    }
  }
  return files;
}

function changedRanges(diff: string): string[] {
  return [...diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)].map((match) => {
    const removed = match[4] === "0";
    const start = Number(removed ? match[1] : match[3]);
    const count = Number((removed ? match[2] : match[4]) ?? 1);
    const end = start + count - 1;
    return `${removed ? "removed old lines" : "changed lines"}: ${start === end ? start : `${start}-${end}`}`;
  });
}

async function scope() {
  const root = (await git("rev-parse", "--show-toplevel")).trim();
  if (inventory) {
    const filters: string[] = [];
    for (const folder of folders) {
      const absolute = resolve(folder);
      const path = relative(root, absolute);
      if (path === ".." || path.startsWith("../") || isAbsolute(path)) throw new Error("Folders must be inside the repository");
      if (!(await stat(absolute)).isDirectory()) throw new Error(`Not a directory: ${folder}`);
      filters.push(`:(top,literal)${path || "."}`);
    }
    const listed = await git("-C", root, "ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", ...filters);
    const files: string[] = [];
    for (const path of new Set(listed.split("\0").filter(Boolean))) {
      try { await lstat(resolve(root, path)); files.push(path); }
      catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      }
    }
    console.log(`Run the quality gate with this fixed scope.

## Fixed Scope

- Repository: ${root}
- Mode: ${all ? "all" : "folder inventory"}
- Content source: current worktree; paths are repository-relative
- Untracked non-ignored files included: yes

## Scoped Files

${files.length ? files.sort().map((path) => `- ${path} (entire current file is in scope)`).join("\n") : "No current files found for the requested inventory."}

Report manual coverage separately from automated checks; unread scope makes validation incomplete.`);
    return;
  }
  let baseLabel = "HEAD";
  let base = (await git("rev-parse", "--verify", "HEAD^{commit}")).trim();
  let target: string | undefined;
  let branch: string | undefined;

  if (commitArg) {
    const requested = commitArg.slice(9);
    target = (await git("rev-parse", "--verify", `${requested}^{commit}`)).trim();
    try { base = (await git("rev-parse", "--verify", `${target}^`)).trim(); baseLabel = `${requested}^`; }
    catch { base = await git("hash-object", "-t", "tree", "/dev/null"); baseLabel = "empty tree"; }
  } else if (refArg) {
    baseLabel = refArg.slice(6);
    base = (await git("rev-parse", "--verify", `${baseLabel}^{commit}`)).trim();
  } else if (!staged) {
    branch = await defaultBranch();
    if (branch) {
      base = (await git("merge-base", "HEAD", branch)).trim();
      baseLabel = `merge-base(HEAD, ${branch})`;
    } else {
      baseLabel = "HEAD (default branch unavailable)";
    }
  }

  const command = ["diff", "--name-status", "-z", "--find-renames"];
  if (staged) command.push("--cached");
  command.push(base);
  if (target) command.push(target);
  const files = parseFiles(await git(...pathspec(command)));

  if (!staged && !commitArg) {
    const known = new Set(files.map((file) => file.path));
    const untracked = (await git(...pathspec(["ls-files", "--others", "--exclude-standard", "-z"]))).split("\0").filter(Boolean);
    for (const path of untracked) if (!known.has(path)) files.push({ path, status: "untracked" });
  }

  await Promise.all(files.map(async (file) => {
    if (["added", "untracked", "deleted"].includes(file.status)) return;
    const command = ["diff", "--unified=0", "--no-ext-diff", "--find-renames"];
    if (staged) command.push("--cached");
    command.push(base);
    if (target) command.push(target);
    command.push("--", ...(file.previousPath ? [file.previousPath] : []), file.path);
    const diff = await git(...command);
    file.ranges = changedRanges(diff);
    if (!file.ranges.length && /^(?:Binary files |GIT binary patch)/m.test(diff)) file.ranges = ["binary content changed; no text ranges"];
  }));

  return { root, base, baseLabel, target, branch, files: files.sort((a, b) => a.path.localeCompare(b.path)) };
}

function format(file: File): string {
  const rename = file.previousPath ? ` from ${file.previousPath}` : "";
  if (file.status === "added" || file.status === "untracked") return `- ${file.path} (${file.status}; entire file is in scope)`;
  if (file.status === "deleted") return `- ${file.path} (deleted; entire old file is in scope)`;
  return `- ${file.path} (${file.status}${rename}; ${file.ranges?.join("; ") || "no content line changes"})`;
}

try {
  const result = await scope();
  if (result && !result.files.length) {
    console.log("No changed files found for the requested quality-gate scope.");
  } else if (result) {
    console.log(`Run the quality gate with this fixed scope.

## Fixed Scope

- Repository: ${result.root}
- Base: ${result.baseLabel}
- Base commit: ${result.base}${result.target ? `\n- Target commit: ${result.target}` : ""}${result.branch ? `\n- Default branch: ${result.branch}` : ""}
- Content source: ${staged ? "index (git show :<path>)" : result.target ? `target commit (git show ${result.target}:<path>)` : "current worktree"}
- Old content: git show ${result.base}:<old-path> (removed lines and deleted files)
- Untracked files included: ${!staged && !commitArg ? "yes" : "no"}

## Scoped Changes

${result.files.map(format).join("\n")}

Read surrounding runtime paths from the same snapshot without expanding the target. Distinguish introduced defects from legacy findings in scoped code. Report unread scope as incomplete.`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
