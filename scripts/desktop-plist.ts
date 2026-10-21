import path from 'node:path';

const { ELECTROBUN_BUILD_DIR: buildDir, ELECTROBUN_APP_NAME: appName } = process.env;
const bundle = buildDir && appName ? path.join(buildDir, `${appName}.app`) : undefined;

if (!bundle) {
  console.error('Run this as the Electrobun postBuild script.');
  process.exit(1);
}

const plist = path.join(bundle, 'Contents/Info.plist');
const key = ':NSAppTransportSecurity:NSAllowsArbitraryLoadsInWebContent';

Bun.spawnSync(['/usr/libexec/PlistBuddy', '-c', 'Add :NSAppTransportSecurity dict', plist], { stderr: 'ignore' });

const set = Bun.spawnSync(['/usr/libexec/PlistBuddy', '-c', `Add ${key} bool true`, '-c', `Set ${key} true`, plist], { stderr: 'pipe' });

if (!set.success) {
  console.error(`Could not allow plain http in ${plist}: ${set.stderr.toString()}`);
  process.exit(1);
}

Bun.spawnSync(['/usr/libexec/PlistBuddy', '-c', 'Delete :NSUserActivityTypes', plist], { stderr: 'ignore' });

const activity = Bun.spawnSync(['/usr/libexec/PlistBuddy', '-c', 'Add :NSUserActivityTypes array', '-c', 'Add :NSUserActivityTypes:0 string INSendMessageIntent', plist], { stderr: 'pipe' });

if (!activity.success) {
  console.error(`Could not allow message notifications in ${plist}: ${activity.stderr.toString()}`);
  process.exit(1);
}
