require('dotenv').config({ path: '../.env' });
const child_process = require('child_process');

let pid;

const server = child_process.spawn('npm', ['start']);

server.stdout.on('data', (data) => {
  const str = data.toString();
  console.log(str);
  const match = str.match(/PID=(.*)/);
  if (match) {
    pid = match[1].trim();
  }
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
  exit(1);
});

const exit = (code) => {
  console.log('exit:', code);
  server.kill();
  if (pid) child_process.spawnSync('kill', [ pid ]);
  else child_process.spawnSync('killall', [ 'node' ]);
  process.exit(code);
};
//'-e ../.env',
setTimeout(() => {
  const casper = child_process.spawn(
    'casperjs',
    [ 'test', 'tests', '--pre=login.js', '--ssl-protocol=tlsv1', '--ignore-ssl-errors=true'],
    { env: process.env },
  );
  
  casper.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  casper.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  casper.on('exit', exit);
}, 1000);

process.on('uncaughtException', () => exit(1));
process.on('SIGTERM', () => exit(1));
