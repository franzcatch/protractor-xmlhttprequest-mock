//our root app component
import {Component, NgModule, NgZone} from '@angular/core'
import {BrowserModule} from '@angular/platform-browser'
import {HttpModule} from '@angular/http'
import {Http} from '@angular/http'

@Component({
    selector: 'my-app',
    template: `
    <div>
      <h2>The {{appType}} app</h2>
      <div><button (click)="getData()" class="refresh-data">Refresh data</button></div>
      <table>
        <tr>
            <td>Request status</td>
            <td>{{requestStatus}}</td>
        </tr>
        <tr>
            <td>Request url</td>
            <td>{{requestUrl}}</td>
        </tr>
        <tr>
            <td>Response code</td>
            <td class="response-code">{{responseCode}}</td>
        </tr>
        <tr>
            <td>Response data</td>
            <td class="response-data">{{responseData | json}}</td>
        </tr>
      </table>
    </div>
    
    <div><a href="/external-page.html" class="external-page-link">external page</a></div>
    <div><a href="/redirect.html" class="redirect-page-link">redirect page</a></div>
  `,
})
export class App {
    requestStatus = "not started";
    requestUrl = "/api/sample.json";
    responseCode = "";
    responseData = "";

    appType = "";

    constructor(
        private http: Http
    ) {
        if (window.location.href.includes("waitForProtractor")) {
            this.waitForProtractor();
        } else {
            this.getData();
        }
    }

    waitForProtractor() {
        const self = this;

        setTimeout(function() {
            if (window.protractorInitComplete) {
                self.getData();
            } else {
                self.waitForProtractor();
            }
        }, 1000);
    }

    getData() {
        console.log("getting")
        this.requestStatus = 'in progress';
        this.http.request(this.requestUrl, {method: 'get'}).subscribe((data) => {
            this.requestStatus = 'done';
            this.responseCode = data.status;
            this.responseData = data.json();
            this.appType = this.responseData.response;
        }, (data) => {
            this.requestStatus = 'done';
            this.responseCode = data.status;
            this.responseData = data.json();
            this.appType = this.responseData.response;
        });
    }
}

@NgModule({
    imports: [BrowserModule, HttpModule],
    declarations: [App],
    bootstrap: [App]
})
export class AppModule {
}
