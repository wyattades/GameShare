/*
  Run Tests Script:
  This file starts the GameShare server, then runs all the jest tests
  If any errors occur, all processes are shut down and the test failed
*/

require('dotenv').config();
const childProcess = require('child_process');
const fs = require('fs');

const WIN = process.platform === 'win32';

let jest;
const server = childProcess.spawn('node', ['server']);

const exit = (err) => {
  console.log('exit:', err || 'success');

  if (fs.existsSync('__tests__/__temp.txt')) fs.unlinkSync('__tests__/__temp.txt');

  server.kill();
  if (jest && !jest.killed) jest.kill();

  process.exit(err ? 1 : 0);
};

server.on('error', err => exit(`Server error: ${err}`));
process.on('uncaughtException', err => exit(err));
process.on('SIGTERM', err => exit(err));

// server.stdout.on('data', (data) => {
//   console.log(data.toString());
// });

server.stderr.on('data', (data) => {
  exit(`Server error: ${data.toString()}`);
});

const runJest = (pattern) => new Promise((resolve, reject) => {
  jest = childProcess.spawn(
    WIN ? 'jest.cmd' : 'jest',
    [WIN ? pattern.replace('/', '\\\\') : pattern, '--colors', '--verbose'],
    { env: process.env },
  );

  jest.on('error', err => exit(`Jest error: ${err}`));
  
  jest.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  jest.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  jest.on('exit', code => code > 0 ? reject('Jest exit error') : resolve());
});

setTimeout(() => {

  runJest('__tests__/login.js')
  .then(() => runJest('__tests__/.*\\.test\\.js$'))
  .then(exit)
  .catch(exit);

}, 3000);
