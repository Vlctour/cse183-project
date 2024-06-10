"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data() {
        return {
        };
    },
    methods: {
        stats_redirect: function() {
            axios.get(handle_redirect_stats_url, {
            }).then(function(r){
                window.location.href = r.data.url
            });
        },
        checklists_redirect: function () {
            axios.get(handle_redirect_checklists_url, {
                params: {
                    observer_id: 'obs1171407',
                }
            }).then(function(r){
                window.location.href = r.data.url
            });
        },
        locations_redirect: function () {
            axios.get(handle_redirect_locations_url, {
            }).then(function(r){
                window.location.href = r.data.url
            });
        }
    },
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(my_callback_url).then(function (r) {
        app.vue.my_value = r.data.my_value;
    });
}

app.load_data();
