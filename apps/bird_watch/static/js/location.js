"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            species: [],
            region: "California",
            border_top: 42.00,
            border_down: 32.50,
            border_left: -124.4,
            border_right: -114.1,
            checklist_num: null,
            num_sightings: null,
            selected_species: [],
            top_contributors: [],
            page_number: 1,
            items_per_page: 10,
            first_page: true,
            last_page: false,
            total_items: null,
            total_pages: null,
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function() {
            // This is an example.
            this.my_value += 1;
        },
        update_page: function(val) {
            let last_page = this.total_pages // figure this out later
            if ((this.page_number == 1 && val == -1) || (this.page_number >= last_page && val == 1)) {
                return
            }
            this.page_number += val

            // figure out logic if there is only enough
            // data to fill 1 page
            if (this.page_number != 1 || this.page_number != last_page) {
                this.first_page = this.last_page = false
            }
            if (this.page_number == 1) {
                this.first_page = true
            }
            if (this.page_number >= last_page) {
                this.last_page = true
            }

            // get indices
            const start = (this.page_number - 1) * this.items_per_page
            const end = this.page_number * this.items_per_page
            // console.log(start, end)
            this.selected_species = this.species.slice(start,end)
        },
        drawSightingsChart: function() {
            let ctx = document.getElementById('sightings_chart').getContext('2d');
            let speciesNames = [];
            let speciesCounts = [];
            
            for (let i = 0; i < this.species.length; i++) {
                let bird = this.species[i];
                if (bird.count !== "X") {
                    speciesNames.push(bird.sightings.name);
                    speciesCounts.push(parseInt(bird.count));
                }
            }
    
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: speciesNames,
                    datasets: [{
                        label: 'Sightings',
                        data: speciesCounts,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },
        drawContributorsChart: function() {
            let ctx = document.getElementById('contributors_chart').getContext('2d');
            let observerIds = [];
            let durations = [];
    
            for (let key in this.top_contributors) {
                let contributor = this.top_contributors[key];
                observerIds.push(contributor.observer_id);
                durations.push(contributor.duration);
            }
    
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: observerIds,
                    datasets: [{
                        label: 'Observation Time',
                        data: durations,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true
                }
            });
        }
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
        app.vue.top_contributors = r.data.top_contributors
        app.vue.checklist_num = r.data.checklist_num;
        app.vue.num_sightings = r.data.num_sightings;
        app.vue.total_items = r.data.species.length;
        app.vue.total_pages = Math.ceil(app.vue.total_items / app.vue.items_per_page);
        // console.log(r.data.test_contributers)
        const start = (app.vue.page_number - 1) * app.vue.items_per_page
        const end = app.vue.page_number * app.vue.items_per_page
        app.vue.selected_species = app.vue.species.slice(start,end)

        app.vue.drawSightingsChart();
        app.vue.drawContributorsChart();
    });
}

app.load_data();

