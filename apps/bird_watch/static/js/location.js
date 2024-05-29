"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            // Complete as you see fit.
            my_value: 1, // This is an example.
            species: [],
            region: "North America",
            border_top: 49.00,
            border_down: 26.22,
            border_left: -126.16,
            border_right: -71.50,
            checklist_num: 5,
            num_sightings: 50,
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function() {
            // This is an example.
            this.my_value += 1;
        },
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_species_url, {
        params: {
            top: app.vue.border_top,
            bottom: app.vue.border_down,
            left: app.vue.border_left,
            right: app.vue.border_right
        }
    }).then(function (r) {
        app.vue.species = r.data.species;
    });
}

app.load_data();

