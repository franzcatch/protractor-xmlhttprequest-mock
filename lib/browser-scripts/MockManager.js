class MockManager {

    static setup() {
        window.XMLHttpRequestMock = XMLHttpRequestMock;
        window.XMLHttpRequestOriginal = window.XMLHttpRequest;
        window.XMLHttpRequest = window.XMLHttpRequestMock;
        window.MockManager = MockManager;
        this.mocks = new Map();
        this.allTraffic = {};
    }

    static tearDown() {
        window.XMLHttpRequest = window.XMLHttpRequestOriginal;
    }

    static reset() {
        this.mocks = new Map();
    }

    static resetTraffic() {
        this.allTraffic = {};
    }

    static addMock(name, config) {
        config = JSON.parse(config);
        if (config && config.path && config.path.type) {
            switch(config.path.type) {
                case "RegExp":
                    var m = config.path.params[0].match(/\/(.*)\/(.*)?/);
                    config.path = new RegExp(m[1], m[2] || "");
                    break;
            }
        }
        if (!Array.isArray(config.response)) {
            if (!config.response.numberOfRequests) {
                config.response.numberOfRequests = Infinity;
            }
            config.response = [config.response];
        } else {
            if (config.response.length > 1) {
                config.response.forEach((el) => {
                    if (!config.response.numberOfRequests) {
                        console.error("MockManager must have response.numberOfRequests for " + JSON.stringify(el));
                    }
                });
            }
        }
        this.mocks.set(name, config);
    }

    static getResponse(method, path) {
        let response;
        let mockName;

        this.mocks.forEach(function (config) {
            const configPath  = config.path instanceof RegExp ? config.path : new RegExp(config.path,'i');
            const configMethod = config.method ? config.method.toLowerCase() : method.toLowerCase();
            const configResponse = Array.isArray(config.response) ? config.response : [];

            if (
              path.match(configPath) &&
              configMethod === method.toLowerCase() &&
              configResponse.length > 0 &&
              configResponse[0].numberOfRequests > 0
            ) {
                mockName = config.name;
                configResponse[0].numberOfRequests--;
                response = configResponse[0];
                if (configResponse[0].numberOfRequests <= 0) {
                    config.response.shift();
                }
            }
        });

        return {
            mockName,
            response
        }
    }
}
