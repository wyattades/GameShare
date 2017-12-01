var HOME_PAGE = 'http://localhost:3000';

var email = 'gamesharetestman@gmail.com';
var password = 'gameshareteamwinners';

// var casper = require('casper').create({
//   verbose: true,
//   logLevel: 'debug',
//   waitTimeout: 5000,
//   // userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4',
//   viewportSize: { width: 1600, height: 900 },
// });

casper.capturePath = function (name) {
  return this.capture('./captures/' + name)
}

casper.on('remote.message', function (msg) {
  this.echo('remote message caught: ' + msg);
});

casper.on("page.error", function (msg, trace) {
  this.echo("Page Error: " + msg, "ERROR");
});

casper.on('popup.created', function (newPage) {
  this.echo("url popup created : " + this.getCurrentUrl(), "INFO");
  newPage.viewportSize = {
    width: 1600,
    height: 900
  }
});

casper.on('error', function (msg) {
  this.echo('Error: ' + msg, "ERROR");
}); // You have missed this callback!

casper.on('popup.loaded', function () {
  this.echo("url popup loaded : " + this.getCurrentUrl(), "INFO");
});

casper.test.begin('Login with Google Sign In', function (test) {

  casper.start(HOME_PAGE, function () {
    this
      .wait(0, function () { // 'then(function' won't work as expected in any callback function.
        test.assertExists('#google-sign-in');
        this.click('#google-sign-in');
      })
      .wait(3000, function() {
        this.capture('login.png');        
      })
      .waitForPopup(/accounts\.google/)
      .withPopup(/accounts\.google/, function (popup) {
        this
          .fillSelectors('form#gaia_loginform', {
            '#Email': email
          }, false)
          .thenClick('input#next')
          .wait(700, function () {
            this.waitForSelector('#Passwd',
              function success() {
                this
                  .echo('success', 'INFO')
                  .fillSelectors('form#gaia_loginform', {
                    'input[name=Passwd]': password
                  }, false)
                  .capturePath('beforeSubmit.png')
                  .thenClick('input#signIn')
                  .wait(300, function () { // less than previous '.wait(700, function() {' -- otherwise will be buggy
                    this.capturePath('afterSubmit.png');
                  })
              },
              function fail() {
                this.echo('failure');
              })
          })
      })
  })
  .then(function () { //here outside of the popup!!
    this.withPopup(/accounts\.google/, function (popup) { // we need to be here until the previous '.withPopup' function will switch to 'about:blank', otherwise we will get an error: 'CasperError: Couldn't find popup with url matching pattern'
      this
        /*.wait(3000,*/
        .waitForSelector('div.sPxS6d', //'.dashboard-container' -- i've not seen such selector there  
          function success() {
            this
              .echo('logged in!', 'INFO')
              .capturePath('in.png')
          },
          function fail() {
            this
              .capturePath('failed.png')
              .echo('failed to login', 'ERROR');
          })
    });
  })
  .run(function () {
    test.done();
  });
});