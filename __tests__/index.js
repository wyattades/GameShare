const child_process = require('child_process');

const server = child_process.spawn('npm', ['start']);

setTimeout(() => {
  const casper = child_process.spawn('casperjs', ['test', 'tests', '--pre=login.js']);
  
  casper.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  casper.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  casper.on('exit', (code) => {
    console.log('exit:', code);
    server.kill();
    process.exit(code);
  });
}, 1000);
