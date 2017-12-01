var HOME_PAGE = 'http://localhost:3000';

var envVars = require('system').env;
var email = envVars.TEST_EMAIL;
var password = envVars.TEST_PASS;

casper.on('page.created', function(page) {
  // this.echo('page created');
  page.viewportSize = {
    width: 1600,
    height: 900,
  };
});

casper.on('resource.error', function(resource) {
  casper.test.fail(JSON.stringify(resource,null,4));
});

casper.on('remote.message', function (msg) {
  this.echo('remote message caught: ' + msg);
});

casper.on("page.error", function (msg, trace) {
  casper.test.fail("Page Error: " + msg);
});

casper.on('popup.created', function (page) {
  // this.echo("url popup created : " + page.url, "INFO");
  page.viewportSize = {
    width: 1600,
    height: 900,
  };
});

casper.on('error', function (msg) {
  casper.test.fail('Error: ' + msg);
}); // You have missed this callback!

// casper.on('popup.loaded', function (page) {
//   this.echo("url popup loaded : " + page.url, "INFO");    
// });

casper.test.begin('Login with Google Sign In', function (test) {

  casper.start(HOME_PAGE, function () {
    this
      .wait(0, function () { // 'then(function' won't work as expected in any callback function.
        test.assertExists('#google-sign-in');
        this.click('#google-sign-in');
      })
      .waitForPopup(/accounts\.google/)
      .withPopup(/accounts\.google/, function (popup) {
        
          test.assertExists('form#gaia_loginform');
          test.assertExists('#Email');

          this
          .fillSelectors('form#gaia_loginform', {
            '#Email': email
          }, false)
          .thenClick('input#next')
          .wait(700, function () {
            this.waitForSelector('#Passwd', function () {
                
              test.assertExists('form#gaia_loginform');
              test.assertExists('input[name=Passwd]');
              test.assertExists('input#signIn');

              this
              .fillSelectors('form#gaia_loginform', {
                'input[name=Passwd]': password
              }, false)
              .thenClick('input#signIn')
              .wait(300);
            })
            // .wait(1000, function() {
            //   console.log('html:', popup.content);
            //   // this.clickLabel('Allow', 'button');
          });
      });
  })
  .then(function () { // here outside of the popup!!
    this.waitForUrl(/games/);
  })
  .run(function () {
    test.done();
  });
});
