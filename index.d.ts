import {ProtractorBrowser} from 'protractor';

export declare interface SimpleResponseMock {
    status: number,
    data: string
}

export declare interface ResponseMock {
    status: number,
    numberOfRequests: number,
    data: string
}

export declare interface MockConfig {
    path: string | RegExp,
    method: string,
    response: SimpleResponseMock | ResponseMock[]
}

export declare interface NetworkTraffic
{
    data: any,
    method: string,
    mockNameUsed: string,
    mockedRequest: boolean,
    response: any,
    responseText: string,
    url: string
}

export declare class MockService {
    static reset() : Promise<null>;
    static setup(browser: ProtractorBrowser) : Promise<null>;
    static addMock(name: string, config: MockConfig) : Promise<null>;
    static getNetworkTraffic() : Promise<NetworkTraffic[]>;
    static resetNetworkTraffic() : Promise<void>;
}
