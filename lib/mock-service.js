const fs = require('fs');
const path = require('path');
const transform = require('@babel/core').transform;

var MockService = {
    reset: function () {
        return new Promise((resolve) => {
            if (this.browser) {
                this.browser
                    .executeScript("if(window.hasOwnProperty('MockManager')) window.MockManager.reset();")
                    .then(resolve);
            }
            this.browser = null;
            this.queue = [];
            resolve();
        });
    },

    setup: async function (browser) {
        //console.log('running setup');
        this.browser = browser;
        var self = this;
        var scripts = "";

        // Inject browser scripts if needed
        const needed = await browser.executeScript('return typeof MockManager == "undefined"');
        if (needed) {
            //console.log('injecting mock service!');
            scripts += fs.readFileSync(path.join(
              __dirname, './browser-scripts/XMLHttpRequestMock.js'), 'utf-8');
            scripts += fs.readFileSync(path.join(
              __dirname, './browser-scripts/MockManager.js'), 'utf-8');

            scripts += 'MockManager.setup();';
        }

        if (self.queue) {
            scripts += self.queue.join(';') + ';';
            self.queue = [];
        }

        // cross browser changes
        const transformed = await transform(scripts, {
            plugins: ["@babel/plugin-transform-classes"]
        });

        scripts = transformed.code.replace(/let/g, "var");
        scripts = scripts.replace(/const/g, "var");

        return browser.executeScript(scripts);
    },

    addMock: function (name, config) {
        if (!this.queue) {
            this.queue = [];
        }

        if (config.path instanceof RegExp) {
            // serialize regexp to be json friendly
            config.path = {
                type: "RegExp",
                params: [
                    config.path.toString()
                ]
            }
        }

        var script = "window.MockManager.addMock(\"" + name + "\", \"" +
          JSON.stringify(config).replace(/\\/gi, "\\\\").replace(/"/gi, "\\\"") +
          "\");";
        //console.log(script);

        //console.log('add mock browser instance', this.browser);
        if (this.browser) {
            //console.log('Execute script in browser: ', script, this.browser);
            return this.browser.executeScript(script);
        } else {
            //console.log('Put script in queue for execution: ', script);
            this.queue.push(script);
            return Promise.resolve();
        }
    },

    getNetworkTraffic: async function () {
        return browser.executeScript('return window.MockManager.allTraffic;');
    },

    resetNetworkTraffic: async function () {
        return browser.executeScript('window.MockManager.resetTraffic();');
    }
};

exports.MockService = MockService;
