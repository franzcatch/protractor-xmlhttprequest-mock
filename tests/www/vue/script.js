document.addEventListener('DOMContentLoaded', function() {
  var app = new Vue({
    el: '#app',
    data: function () {
      return {
        requestStatus: "not started",
        requestUrl: "/api/sample.json",
        responseCode: "",
        responseData: "",
        appType: ""
      }
    },
    mounted: function () {
      if (window.location.href.includes("waitForProtractor")) {
        this.waitForProtractor();
      } else {
        this.getData();
      }
    },
    methods: {
      waitForProtractor: function () {
        const self = this;

        setTimeout(function () {
          if (window.protractorInitComplete) {
            self.getData();
          } else {
            self.waitForProtractor();
          }
        }, 1000);
      },
      getData: function () {
        console.log('here')
        this.requestStatus = 'in progress';
        axios.get(this.requestUrl).then((data) => {
          this.requestStatus = 'done';
          this.responseCode = data.status;
          this.responseData = data.data;
          this.appType = this.responseData.response;
        }).catch((e) => {
          this.requestStatus = 'done';
          this.responseCode = e.response.status;
          this.responseData = e.response.data;
          this.appType = this.responseData.response;
        });
      }
    }
  });
});
