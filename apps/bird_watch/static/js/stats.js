"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            stats: [], 
            selected_stats: [],
            map: null,
            page_number: 1,
            items_per_page: 10,
            first_page: true,
            last_page: false,
            total_items: null,
            total_pages: null,
            sort_most_recent: true,
            is_loading: false,
        };
    },
    
    methods: {
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
            this.selected_stats = this.stats.slice(start,end)
        },
        update_sort_by: function() {
            this.is_loading = true
            app.load_data()
            this.sort_most_recent = !this.sort_most_recent
        },

    },

    mounted() {
        // Initialize the Leaflet map here
        this.map = L.map('map').setView([51.505, -0.09], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        // Add a marker for demonstration purposes
        L.marker([51.5, -0.09]).addTo(this.map)
            .bindPopup('Hi its me')
            .openPopup();
        
    },
};


app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_stats_url, {
        params: {
            observer_id: 'obs1644106',
            sort_most_recent: app.vue.sort_most_recent
        }
    }).then(function (r) {
        app.vue.stats = r.data.birds_seen;
        app.vue.total_items = r.data.size;
        app.vue.total_pages = Math.ceil(app.vue.total_items / app.vue.items_per_page);
        const start = (app.vue.page_number - 1) * app.vue.items_per_page
        const end = app.vue.page_number * app.vue.items_per_page
        app.vue.selected_stats = app.vue.stats.slice(start,end)
        app.vue.is_loading = false
    });
}

app.load_data();

