
# protractor-xmlhttprequest-mocker

[![Build Status](https://travis-ci.org/krisboit/protractor-xmlhttprequest-mock.svg?branch=master)](https://travis-ci.org/krisboit/protractor-xmlhttprequest-mock)

`protractor-xmlhttprequest-mocker` monitors AJAX requests made by your browser and allows you to return custom data.  It also automatically tracks all AJAX calls - which can be retrieved for test analysis (more below).

Note:  Typescript typings attached to project.

### Why would you use this?
- When your test does not "necessarily" need to hit live data.
- When you *must* test functionality in a *live* browser, and don't want your application to wait for or rely on AJAX calls.
- Protractor tests can be long-running due to the high number of steps needed, and because the browser has to wait for API calls that could be slow/numerous.  The more tests you write, the more waiting on API responses, and the longer you are waiting for test results. 
- Data issues for staging test scenarios:
  - Scenarios you want to test do not consistently/reliably have data needed to perform the test.
  - Using "never touch this" data could be fragile since other developers could modify it, breaking tests, and not know how/what to restore to fix.
  - Automated insertion of needed data for tests could be fragile/complicated/risky depending out how complex your data-structures are. What about failures during insertion? What about rolling back inserted data? Do you have permissions needed to write to every database you need?

### How is this done?
Any time your client-side (in-browser) code makes an AJAX request, the call flows through the browser's internal [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest).
Protractor can inject `protractor-xmlhttprequest-mocker` into the browser to stand between AJAX calls and `XMLHttpRequest`.
When a request comes through, if it matches a mock defined by `path/method`, it will return the mock data instead of making the real call.  Otherwise it is forwarded to the real `XMLHttpRequest`.

### What browsers/frameworks does this support?
- This has been tested in Chrome and IE11, and may work in many others that support XMLHttpRequest.
  - [cross-browser compatibility](https://caniuse.com/xhr2).
- This should work with any UI framework - so long as you are making requests that use XMLHttpRequest.
  - It has been tested in Angular and Vue.  

### A simple example of usage:
- `numberOfRequests` optional

```js
import {browser, $} from 'protractor';
import {MockService} from 'protractor-xmlhttprequest-mock';

describe('The test...', () => {
  beforeAll(async () => {
    // Make sure to do this each time the browser refreshes/redirects because the mock code will be erased by these actions
    await MockService.setup(browser);
  })

  afterAll(async () => {
    // This step would only be necessary if you are not refreshing/redirecting the browser when your tests are done
    await MockService.reset();
  })

  it('should do...', async () => {
    await MockService.addMock('mock1', {
      path: '/api/teapot',
      method: 'get', // not case sensitive
      response: {
        numberOfRequests: 1,
        status: 200,
        data: <response value - array/json/primitive/etc>
      }
    });
  });
});
```

### Multiple responses for a mock
- `numberOfRequests` required
- `addMock(<name>)` -> if you create multiple mocks with the same `<name>`, only the last one in will be used

```js
    await MockService.addMock('mock1', {
      path: '/api/teapot',
      mothod: 'get',
      response: [
        {status: 418, numberOfRequests: 1, data: "I'm a teapot"},
        {status: 200, numberOfRequests: 2, data: "I'm not a teapot"},
        {status: 418, numberOfRequests: 1, data: "I'm a teapot again"}
      ] 
    });
```

### Get browser application to wait for mocks to be injected before it starts loading routes

- `protractor-xmlhttprequest-mocker` does NOT grab AJAX calls on page load by default.  You will have to add some code to get your app to wait until after you have injected your mock code.
  - Example for Angular 1.5 (something similar could be done in Angular 2+, Vue, etc).
  - In *Protractor* 
    - navigate browser to page:  http://thepage.com/?waitForProtractor=true
    - await MockService.setup(browser);
    - await MockService.addMock(...
    - other setup/code
    - await browser.executeScript('window.protractorInitComplete = true;');
  - In *Angular* (see code below)
    - Notice how appModule.run has an override if `waitForProtractor=true` is in the query string.
    - If so, `tryWaitForProtractor` will wait until Protractor has sent `window.protractorInitComplete` before resolving any routes.
    
    ```js
    // app.js
    
    appModule.run(function($rootScope, $location, $state, $q) {
      $rootScope.$on("$stateChangeStart", function(event, toState, toParams) {
        if (
          $location.url().indexOf("waitForProtractor=true") >= 0 &&
          !window.protractorInitComplete
        ) {
          event.preventDefault();
    
          tryWaitForProtractor($q).then(function() {
            $state.go(toState, toParams);
          });
        }
      });
    });
    
    function tryWaitForProtractor($q) {
      var dfd = $q.defer();
    
      function waitForProtractor() {
        setTimeout(function() {
          if (window.protractorInitComplete) {
            dfd.resolve();
          } else {
            waitForProtractor();
          }
        }, 2000);
      }
    
      waitForProtractor();
    
      return dfd.promise;
    }
    ```
  
### Managing network traffic
- Starts automatically with `await MockService.setup(browser);`
```js
    const traffic = await MockService.getNetworkTraffic();
    const traffic = await MockService.resetNetworkTraffic();
```
```
    // sample data
    [{
        data: <data>,
        method: <verb>,
        mockNameUsed: <string>,
        mockedRequest: <boolean>,
        response: <response data>,
        responseText: <response text - not always present>,
        url: <path/url used to make request>,
    }]
```

### Notes:
- Other examples can be found in the tests from  `tests` folder.
