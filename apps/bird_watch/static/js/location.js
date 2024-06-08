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
            bird_data: [],
            radar_data: {},
            page_number: 1,
            items_per_page: 8,
            first_page: true,
            last_page: false,
            total_items: null,
            total_pages: null,
            bird_chart_instance: null,
            bird_chart_label_name: null,
        };
    },
    methods: {
        find_item_idx: function(id) {
            for (let i = 0; i < this.selected_species.length; i++) {
                if(this.selected_species[i].sightings.id === id) {
                    return i
                }
            }
            return null
        },
        update_page: function(val) {
            let last_page = this.total_pages 
            if ((this.page_number == 1 && val == -1) || (this.page_number >= last_page && val == 1)) {
                return
            }
            this.page_number += val

            if (this.page_number != 1 || this.page_number != last_page) {
                this.first_page = this.last_page = false
            }
            if (this.page_number == 1) {
                this.first_page = true
            }
            if (this.page_number >= last_page) {
                this.last_page = true
            }
            const start = (this.page_number - 1) * this.items_per_page
            const end = this.page_number * this.items_per_page
            this.selected_species = this.species.slice(start,end)
        },
        display_location_data: function(item_id) {
            let self = this
            let i = self.find_item_idx(item_id)
            axios.get(display_location_data_url, {
                params: {
                    bird_name: self.selected_species[i].sightings.name,
                    top: self.border_top,
                    bottom: self.border_down,
                    left: self.border_left,
                    right: self.border_right
                }
            }).then(function (r){
                self.bird_data = r.data.bird_data
                self.bird_chart_label_name = r.data.bird_name
                self.render_chart(r.data.bird_name)
                // self.chart_loading = false
            });
        },
        render_chart: function(bird_name) {
            const ctx = document.getElementById('birdChart').getContext('2d');
            const labels = this.bird_data.map(entry => entry.checklists.date);
            const data = this.bird_data.map(entry => entry.count);

            // Destroy existing chart instance if it exists
            if (this.bird_chart_instance) {
                this.bird_chart_instance.destroy();
            }
            
            this.bird_chart_instance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: bird_name,
                        data: data,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 1,
                        fill: true,
                        stepped: true, // Enable stepped line
                        pointRadius: 5, // Set point radius
                        pointHoverRadius: 8 // Set point hover radius
                    }]
                },
                options: {
                    animation: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Number of Birds'
                            }
                        }
                    }
                }
            });
        },
        createRadarChart: function() {
            const ctx = document.getElementById('radarChart').getContext('2d');
            const data = this.radar_data;

            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const counts = months.map(month => data[month] || 0);

            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Monthly Data',
                        data: counts,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scale: {
                        ticks: {
                            beginAtZero: true
                        }
                    }
                }
            });
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
        app.vue.top_contributors = r.data.top_contributors
        app.vue.checklist_num = r.data.checklist_num;
        app.vue.num_sightings = r.data.num_sightings;
        app.vue.total_items = r.data.species.length;
        app.vue.total_pages = Math.ceil(app.vue.total_items / app.vue.items_per_page);
        const start = (app.vue.page_number - 1) * app.vue.items_per_page
        const end = app.vue.page_number * app.vue.items_per_page
        app.vue.selected_species = app.vue.species.slice(start,end)
        const first_entry = app.vue.selected_species[0].sightings.id
        self.bird_chart_label_name = app.vue.selected_species[0].sightings.name
        app.vue.display_location_data(first_entry)
    });
}

app.load_radar_data = function () {
    axios.get(get_radar_data_url, {
        params: {
            top: app.vue.border_top,
            bottom: app.vue.border_down,
            left: app.vue.border_left,
            right: app.vue.border_right,
            name: '',
        }
    }).then(function (r) {
        r.data.radar_data.forEach(item => {
            const date = new Date(item.date);
            const month = date.toLocaleString('default', { month: 'long' });
            if (!app.vue.radar_data[month]) {
                app.vue.radar_data[month] = 0;
            }

            app.vue.radar_data[month] += item.count;
        })
        app.vue.createRadarChart();
    });
}


app.load_data();
app.load_radar_data();

