// const casper = require('casper').create();

// casper.test.begin('a twitter bootstrap dropdown can be opened', 2, function(test) {
//   casper.start('http://getbootstrap.com/2.3.2/javascript.html#dropdowns', function() {
//       test.assertExists('#navbar-example');
//       this.click('#dropdowns .nav-pills .dropdown:last-of-type a.dropdown-toggle');
//       this.waitUntilVisible('#dropdowns .nav-pills .open', function() {
//           test.pass('Dropdown is open');
//       });
//   }).run(function() {
//       test.done();
//   });
// });

// hello-test.js
casper.test.begin("Hello, Test!", 1, function(test) {
    test.assert(true);
    test.done();
});
