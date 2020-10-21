var MockService = require('../lib/mock-service').MockService;

function runTests(app, url) {
    describe('Testing with '+ app +' app', function () {
        afterEach(async function () {
            return MockService.reset();
        });

        const INIT_APP_TITLE = 'The app';
        const SAMPLE_APP_TITLE = 'The Sample app';
        const MOCK_APP_TITLE = 'The Mock app';

        async function protractorInitComplete() {
            await browser.executeScript('window.protractorInitComplete=true');
        }

        async function loadPageAndAssert(addMockFunc, expectedText) {
            await browser.get(url + "?waitForProtractor=true");
            await MockService.setup(browser);
            if (addMockFunc){
                await addMockFunc();
            }

            await protractorInitComplete();

            if (expectedText) {
                expect(await waitForTitleText(expectedText)).toBe(true);
            }
        }

        async function mockSampleJson(text) {
            if (!text) {
                text = 'Mock';
            }

            await MockService.addMock('sample-mock', {
                path: '/api/sample.json',
                response: {
                    status: 200,
                    data: JSON.stringify({response: text})
                }
            });
        }
        async function mockSampleRegexJson(text) {
            if (!text) {
                text = 'Mock';
            }

            await MockService.addMock('sample-mock', {
                path: /\/api\/[a-z]*.json/,
                response: {
                    status: 200,
                    data: JSON.stringify({response: text})
                }
            });
        }

        function clickRefreshButton() {
            return browser.element(by.css('.refresh-data')).click();
        }

        async function getPageTitleText() {
            try {
                const text = await browser.element(by.css('h2')).getText();
                return text;
            } catch (e) {
                return null;
            }
        }

        async function checkData(responseCode, responseText) {
            expect(await browser.element(by.css('.response-code')).getText()).toBe(responseCode);
            expect(await browser.element(by.css('.response-data')).getText()).toContain(responseText);
        }

        async function waitForTitleText(expectedText) {
            try {
                return await browser.wait(async function () {
                    const foundText = await getPageTitleText();
                    if (foundText === expectedText) {
                        return true;
                    }
                }, 10000);
            } catch(e) {
                return false;
            }
        }

        it('should open page without mocks', async () => {
            await loadPageAndAssert(null, SAMPLE_APP_TITLE);
        });

        it('should open page with happy case mocks', async () => {
            await loadPageAndAssert(mockSampleJson, MOCK_APP_TITLE);
        });

        it('should open page with happy case mocks with Regex', async () => {
            await loadPageAndAssert(mockSampleRegexJson, MOCK_APP_TITLE);
        });

        it('should reset mocks at page refresh', async () => {
            await loadPageAndAssert(mockSampleJson, MOCK_APP_TITLE);

            await loadPageAndAssert(null, SAMPLE_APP_TITLE);
        });

        it('should be able to inject mock after page is loaded', async () => {
            await loadPageAndAssert(null, SAMPLE_APP_TITLE);

            await mockSampleJson();
            await clickRefreshButton();
            expect(await waitForTitleText(MOCK_APP_TITLE)).toBe(true);
        });

        it('should be able to overwrite a mock', async () => {
            await loadPageAndAssert(mockSampleJson, MOCK_APP_TITLE);
            expect(await waitForTitleText(MOCK_APP_TITLE)).toBe(true);

            await mockSampleJson('New Mock');
            await clickRefreshButton();
            expect(await waitForTitleText('The New Mock app')).toBe(true);
        });

        it('should reset mocks when calling reset function', async () => {
            await loadPageAndAssert(mockSampleJson, MOCK_APP_TITLE);

            await MockService.reset();
            await clickRefreshButton();
            expect(await waitForTitleText(SAMPLE_APP_TITLE)).toBe(true);
        });

        it('should be able to reinject mock at page reload', async () => {
            await loadPageAndAssert(mockSampleJson, MOCK_APP_TITLE);

            MockService.reset();
            await loadPageAndAssert(mockSampleJson, MOCK_APP_TITLE);
        });

        it('should be able to mock responses with other response code than 200', async () => {
            await loadPageAndAssert(async function() {
                await MockService.addMock('sample-mock', {
                    path: '/api/sample.json',
                    response: {
                        status: 404,
                        data: JSON.stringify({response: 'Error 404'})
                    }
                });
            }, 'The Error 404 app');

            expect(browser.element(by.css('.response-code')).getText()).toBe('404');
        });

        it('should open the page after navigating to an external page', async () => {
            await loadPageAndAssert(mockSampleJson, MOCK_APP_TITLE);

            await browser.element(by.css('.external-page-link')).click();
            browser.sleep(1000);

            await browser.element(by.css('#navigateTo')).clear().sendKeys('http://localhost:8080/angular1');
            browser.sleep(1000);
            await browser.element(by.css('button')).click();
            await waitForTitleText(INIT_APP_TITLE);

            await browser.refresh();
            await waitForTitleText(SAMPLE_APP_TITLE);
            expect(await getPageTitleText()).toBe(SAMPLE_APP_TITLE);
        });

        it('should open the page after navigating to a redirect page', async () => {
            await loadPageAndAssert(mockSampleJson, MOCK_APP_TITLE);

            await browser.element(by.css('.redirect-page-link')).click();
            expect(await waitForTitleText(SAMPLE_APP_TITLE)).toBe(true);
        });

        it('should keep mocks forever if numberOfRequests is not specified', async () => {
            await loadPageAndAssert(mockSampleJson, MOCK_APP_TITLE);
            await checkData('200', "Mock");

            for (let i=0; i < 5; i++) {
                await clickRefreshButton();
                browser.sleep(500);
                await checkData('200', "Mock");
            }
        });

        it('should keep mock numberOfRequests times', async () => {
            await loadPageAndAssert(async function() {
                await MockService.addMock('sample-mock', {
                    path: '/api/sample.json',
                    response: [
                        {
                            status: 200,
                            numberOfRequests: 2,
                            data: JSON.stringify({response: "Mock"})
                        }
                    ]
                });
            }, MOCK_APP_TITLE);
            await checkData('200', "Mock");

            await clickRefreshButton();
            await waitForTitleText(MOCK_APP_TITLE);
            await checkData('200', "Mock");

            await clickRefreshButton();
            await waitForTitleText(SAMPLE_APP_TITLE);
            await checkData('200', "Sample");
        });

        it('should be able to specify multiple responses for a mock', async () => {
            await loadPageAndAssert(async function(){
                await MockService.addMock('sample-mock', {
                    path: '/api/sample.json',
                    response: [
                        {
                            status: 404,
                            numberOfRequests: 1,
                            data: JSON.stringify({response: "Mock1"})
                        },
                        {
                            status: 200,
                            numberOfRequests: 2,
                            data: JSON.stringify({response: "Mock2"})
                        }
                    ]
                });
            }, "The Mock1 app");
            await checkData('404', "Mock1");

            await clickRefreshButton();
            await waitForTitleText("The Mock2 app");
            await checkData('200', "Mock2");

            await clickRefreshButton();
            await waitForTitleText("The Mock2 app");
            await checkData('200', "Mock2");

            await clickRefreshButton();
            await waitForTitleText(SAMPLE_APP_TITLE);
            await checkData('200', "Sample");
        });
    });
}

browser.ignoreSynchronization = true;
browser.waitForAngularEnabled(false);

runTests("Angular 1", 'http://localhost:8080/angular1');
runTests("Angular 2", 'http://localhost:8080/angular2');
runTests("Vue", "http://localhost:8080/vue");
