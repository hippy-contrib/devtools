const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let logStr = '';
const logFile = path.join(__dirname, 'oci-log.log');
const tag = process.env.ORANGE_BRANCH;
const npmToken = process.env.NPM_TOKEN;

function log(...args) {
  console.log(...args);
  args.forEach((argv) => {
    logStr += `${argv.toString()}\n`;
  });
}

function checkTag() {
  if (!/^\d+\.\d+\.\d+(-(alpha|beta)\.\d+)?$/.test(tag)) {
    log(`tag不合法，必须为'1.0.1', '1.0.1-alpha.1', '1.0.1-beta.1' 格式！`);
    process.exit(0);
  }
}

async function updatePackageJson() {
  const fpath = path.resolve('package.json');
  const packageStr = fs.readFileSync(fpath, 'utf-8');
  const packageJson = JSON.parse(packageStr);
  packageJson.version = tag;
  fs.writeFileSync(fpath, JSON.stringify(packageJson, null, 2));
}

function exec(cmd, argv, options) {
  return new Promise((resolve, reject) => {
    log(`Execting ${cmd} ${JSON.stringify(argv)}`);
    let stdout = '';
    const cp = spawn(cmd, argv, options);
    cp.stdout.on('data', (msg) => {
      log(`stdout: ${msg.toString()}`);
      stdout += msg.toString();
    });
    cp.stderr.on('data', (err) => log(err.toString()));
    cp.on('error', (err) => reject(err));
    cp.on('close', (code) => {
      if (code) {
        const e = new Error(`error: ${code}`);
        log(e);
        return reject(e);
      }
      resolve(stdout);
    });
  });
}

function commitPackageJson() {
  return exec('git', ['add', 'package.json']).then(
    () =>
      new Promise((resolve, reject) => {
        exec('git', ['status'])
          .then((res) => {
            if (res.indexOf('Changes not staged') !== -1) {
              exec('git', ['commit', '-m', 'chore: oci自动更新版本号'])
                .then(() => exec('git', ['push']))
                .then(() => resolve())
                .catch(reject);
            } else resolve();
          })
          .catch(reject);
      }),
  );
}

function checkout() {
  function findBranch(stdout) {
    const branchs = stdout
      .split('\n')
      .map((v) => v.replace('*', '').trim())
      .filter((v) => v.startsWith('remotes/origin/'))
      .map((v) => v.replace('remotes/origin/', ''));
    if (branchs.indexOf('master') !== -1) return 'master';

    const branch = branchs.find((branch) => branch.indexOf('detached') === -1);
    if (branch) return branch;
  }
  return exec('git', ['config', '--global', 'pager.branch', 'false'])
    .then(() => exec('git', ['branch', '-a', '--contains', `tags/${tag}`]))
    .then((stdout) => {
      log(stdout);
      const branch = findBranch(stdout);
      if (branch) return branch;

      const row = stdout.split('\n').find((row) => row.startsWith('*'));
      const result = row.match(/detached.*\s([\d|\w]+)\)$/);
      if (result && result[1]) {
        const commitId = result[1];
        return exec('git', ['branch', '-a', '--contains', commitId]).then((stdout) => findBranch(stdout));
      }

      return row.replace('*', '').trim();
    })
    .then((branch) => {
      if (branch) {
        return exec('git', ['checkout', `${branch}`]).then(() => branch);
      }
    });
}

function installDependencies() {
  return exec('tnpm', ['i']);
}

function build() {
  return exec('npm', ['run', 'build']);
}

function npmLogin() {
  const configs = [
    ['registry', 'https://registry.npmjs.org/'],
    ['always-auth', 'true'],
    ['strict-ssl', 'true'],
    // ['//registry.npmjs.org/:username', auth.split(':')[0]],
    // ['//registry.npmjs.org/:_password', auth.split(':')[1]],
    // ['//registry.npmjs.org/:email', email],
    ['//registry.npmjs.org/:_authToken', npmToken],
  ];
  return Promise.all(configs.map((config) => exec('npm', ['config', 'set', ...config])));
}

function publishNpm() {
  const publishArgs = ['publish'];
  const matchGroup = tag.match(/(alpha|beta)/);
  if (matchGroup) {
    publishArgs.push('--tag', matchGroup[1]);
  }
  publishArgs.push('--registry', 'https://registry.npmjs.org');
  return exec('npm', publishArgs);
}

(async () => {
  // try {
  checkTag();
  const branch = await checkout();
  if (branch) {
    await updatePackageJson();
    await commitPackageJson();
  }
  await installDependencies();
  await build();
  await npmLogin();
  await publishNpm();
  log(`发布npm包成功，版本号: ${tag}`);
  process.exit(0);
  // }
  // catch(e) {
  //   log(e);
  //   process.exit(1);
  // }
})();

function onError(e) {
  log(e);
  fs.writeFileSync(logFile, logStr);
  throw e;
}

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);
