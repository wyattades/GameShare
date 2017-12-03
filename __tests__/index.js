/*
  Run Tests Script:
  This file starts the GameShare server, then runs all the jest tests
  If any errors occur, all processes are shut down and the test failed
*/

require('dotenv').config();
const childProcess = require('child_process');
const fs = require('fs');

let jest;
const server = childProcess.spawn('node', ['server']);

const exit = (code) => {
  console.log('exit:', code);

  if (fs.existsSync('__tests__/__temp.txt')) fs.unlinkSync('__tests__/__temp.txt');

  server.kill();
  if (jest && !jest.killed) jest.kill();

  process.exit(code);
};

process.on('uncaughtException', () => exit(1));
process.on('SIGTERM', () => exit(1));

// server.stdout.on('data', (data) => {
//   console.log(data.toString());
// });

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
  exit(1);
});

const runJest = (pattern) => new Promise((resolve, reject) => {
  jest = childProcess.spawn('jest', [pattern, '--colors', '--verbose'], {
    env: process.env,
  });
  
  jest.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  jest.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  jest.on('exit', code => code > 0 ? reject(code) : resolve());
});

setTimeout(() => {

  runJest('__tests__/login.js')
  .then(() => runJest('__tests__/.*\\.test\\.js$'))
  .then(() => exit(0))
  .catch(code => exit(code));

}, 3000);
