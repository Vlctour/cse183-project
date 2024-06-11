"use strict";

let app = {};

app.data = {
    data: function() {
        return {
            stats: [],
            selected_stats: [],
            bird_data: [],
            bird_chart_instance: null,
            chart_loading: false,
            map: null,
            page_number: 1,
            items_per_page: 10,
            first_page: true,
            last_page: false,
            total_items: null,
            total_pages: null,
            sort_most_recent: true,
            is_loading: false,
            search_query: null,
            unique_bird_count: 0,
            total_bird_count: 0,
            time: 0,
        };
    },
    computed: {
        format_time: function() {
            let hours = Math.floor(this.time / 60);
            let minutes = this.time % 60;
            let seconds = 0;
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    },
    methods: {
        stats_redirect: function () {
            axios.get(handle_redirect_stats_url, {}).then(function (r) {
                window.location.href = r.data.url;
            });
        },
        checklists_redirect: function () {
            axios.get(handle_redirect_checklists_url, {}).then(function (r) {
                window.location.href = r.data.url;
            });
        },
        locations_redirect: function () {
            axios.get(handle_redirect_locations_url, {
                params: {
                    north: 90,
                    south: -90,
                    east: 180,
                    west: -180,
                }
            }).then(function (r) {
                window.location.href = r.data.url;
            });
        },
        find_item_idx: function(id) {
            for (let i = 0; i < this.selected_stats.length; i++) {
                if(this.selected_stats[i].sightings.id === id) {
                    return i;
                }
            }
            return null;
        },
        update_page: function(val) {
            let last_page = this.total_pages;
            if ((this.page_number == 1 && val == -1) || (this.page_number >= last_page && val == 1)) {
                return;
            }
            this.page_number += val;

            if (this.page_number != 1 || this.page_number != last_page) {
                this.first_page = this.last_page = false;
            }
            if (this.page_number == 1) {
                this.first_page = true;
            }
            if (this.page_number >= last_page) {
                this.last_page = true;
            }

            const start = (this.page_number - 1) * this.items_per_page;
            const end = this.page_number * this.items_per_page;
            this.selected_stats = this.stats.slice(start,end);
        },
        update_sort_by: function() {
            this.sort_most_recent = !this.sort_most_recent;
            this.is_loading = true;
            app.load_data();
        },
        search_table: function(query) {
            app.load_data();
            app.vue.search_query = null;
            app.vue.page_number = 1;
            app.vue.items_per_page = 10;
            app.vue.first_page = true;
            app.vue.last_page = false;
        },
        display_data: function(item_id) {
            let self = this;
            let i = self.find_item_idx(item_id);
            self.chart_loading = true;
            axios.get(display_data_url, {
                params: {
                    bird_name: self.selected_stats[i].sightings.name
                }
            }).then(function (r){
                self.bird_data = r.data.bird_data;
                self.render_chart(r.data.bird_name);
                self.chart_loading = false;
            });
        },
        render_chart: function(bird_name) {
            const ctx = document.getElementById('birdChart').getContext('2d');
            const labels = this.bird_data.map(entry => entry.checklists.date);
            const data = this.bird_data.map(entry => entry.sightings.count);

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
                        stepped: true,
                        pointRadius: 5,
                        pointHoverRadius: 8
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
        }
    },
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_stats_url, {
        params: {
            sort_most_recent: app.vue.sort_most_recent,
            search_query: app.vue.search_query,
        }
    }).then(function (r) {
        app.vue.stats = r.data.birds_seen;
        app.vue.total_items = r.data.size;
        app.vue.total_pages = Math.ceil(app.vue.total_items / app.vue.items_per_page);
        if (app.vue.total_pages <= 1) {
            app.vue.first_page = true;
            app.vue.last_page = true;
        }
        const start = (app.vue.page_number - 1) * app.vue.items_per_page;
        const end = app.vue.page_number * app.vue.items_per_page;
        app.vue.selected_stats = app.vue.stats.slice(start,end);
        app.vue.is_loading = false;
        const first_entry = app.vue.selected_stats[0].sightings.id;
        app.vue.display_data(first_entry);
    });
};

app.load_card_data = function () {
    axios.get(get_card_data_url, {}).then(function (r) {
        app.vue.unique_bird_count = r.data.unique_bird_count;
        app.vue.total_bird_count = r.data.total_bird_count;
        app.vue.time = r.data.total;
    });
};

app.load_data();
app.load_card_data();
