"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data() {
        return {
            heatmap_data: [],
            search_query: null,
            map: null,
            heatmapLayer: null,  // Add a property to store the heatmap layer
        };
    },
    methods: {
        stats_redirect: function() {
            axios.get(handle_redirect_stats_url, {
            }).then(function(r){
                window.location.href = r.data.url;
            });
        },
        checklists_redirect: function () {
            axios.get(handle_redirect_checklists_url, {
                params: {
                    observer_id: 'obs1171407',
                }
            }).then(function(r){
                window.location.href = r.data.url;
            });
        },
        locations_redirect: function () {
            axios.get(handle_redirect_locations_url, {
            }).then(function(r){
                window.location.href = r.data.url;
            });
        },
        update_heatmap: function () {
            app.load_data();
            this.search_query = null;
        }
    },
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_heatmap_url, {
        params: {
            bird_name: app.vue.search_query
        }
    }).then(function (r) {
        app.vue.heatmap_data = r.data.density;
        if (!app.vue.map) {
            // Initialize the map if not already initialized
            app.vue.map = L.map('map').setView([37.7749, -122.4194], 13);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(app.vue.map);

            var startPoint = null;
            var drawnRectangle = null;
            var markers = []; // Array to store markers

            // Listen for clicks on the map
            app.vue.map.on('click', function (e) {
                var clickedPoint = e.latlng;

                // Remove all existing markers
                for (var i = 0; i < markers.length; i++) {
                    app.vue.map.removeLayer(markers[i]);
                }
                markers = []; // Clear the markers array

                if (drawnRectangle) {
                    app.vue.map.removeLayer(drawnRectangle);
                }

                if (!startPoint) {
                    // First click: store the starting point and add marker
                    startPoint = clickedPoint;
                    markers.push(L.marker(clickedPoint).addTo(app.vue.map)); // Add marker to markers array
                } else {
                    // Second click: draw the rectangle, reset starting point, and add marker
                    var rectBounds = [startPoint, clickedPoint];
                    drawnRectangle = L.rectangle(rectBounds, {color: 'red'}).addTo(app.vue.map);
                    startPoint = null; // Reset the starting point for the next rectangle
                    markers.push(L.marker(clickedPoint).addTo(app.vue.map)); // Add marker to markers array
                }
            });
        }

        // Remove the existing heatmap layer if it exists
        if (app.vue.heatmapLayer) {
            app.vue.map.removeLayer(app.vue.heatmapLayer);
        }

        // Create the heatmap layer with the loaded data
        app.vue.heatmapLayer = L.heatLayer(app.vue.heatmap_data, {
            radius: 25, // Radius of each "point" of the heatmap
            blur: 15,   // Amount of blur
            maxZoom: 17 // Max zoom level for the heatmap layer
        }).addTo(app.vue.map);
    });
}

app.load_data();
