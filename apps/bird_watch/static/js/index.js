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
            heatmapLayer: null,
            drawn_rectangles: [],
            new_date: null,         
            new_time: null,              
            new_duration: null,
            validationError: false, 
            showModal: false,
            coords: null,
            bounds: null,
            loading: true,
            north: 90,
            south: -90,  
            east: 180,   
            west: -180,
        };
    },
    methods: {
        index_redirect: function() {
            axios.get(handle_redirect_index_url, {}).then(function (r) {
                window.location.href = r.data.url;
            });
        },
        stats_redirect: function () {
            axios.get(handle_redirect_stats_url, {}).then(function (r) {
                window.location.href = r.data.url;
            });
        },
        checklists_redirect: function () {
            axios.get(handle_redirect_checklists_url, {
            }).then(function (r) {
                window.location.href = r.data.url;
            });
        },
        reset_coord_data: function() {
            this.north = 90;
            this.south = -90;  
            this.east = 180;  
            this.west = -180; 
            this.locations_redirect();
        },
        locations_redirect: function () {
            let self = this;
            axios.get(handle_redirect_locations_url, {
                params: {
                    north: self.north,   
                    south: self.south, 
                    east: self.east,   
                    west: self.west,  
                }
            }).then(function (r) {
                window.location.href = r.data.url;
                self.north = 90;
                self.south = -90;  
                self.east = 180;  
                self.west = -180; 
            });
        },
        add_checklist: function(){
            let self = this;
            this.closeModal();
            axios.post(add_checklist_url, {
                date: self.new_date,        
                time: self.new_time,         
                duration: self.new_duration ,     
                latitude: self.coords.lat,      
                longitude: self.coords.lng,    
 
            }).then(function (r) {
                app.load_data();
                self.new_date = null;       
                self.new_time = null;         
                self.new_duration = null;     
                self.new_latitude = null;    
                self.new_longitude = null;
                self.checklists_redirect();
            });
        },
        openModal: function() {
            if (this.coords) {
                this.showModal = true;
            }
          },
        closeModal: function() {
            this.showModal = false;
            this.validationError = false;
        },
        update_heatmap() {
            app.load_data(); 
            this.search_query = null;
        },
        render_heatmap() {
            if (!this.map) {
                var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                osm = L.tileLayer(osmUrl, {
                    maxZoom: 18,
                    attribution: osmAttrib
                });
            
                this.map = L.map('map', {
                    layers: [osm],
                    center: [36.9741, -122.0308],
                    zoom: 15
                });
                var drawnItems = L.featureGroup().addTo(this.map);
                this.map.addControl(new L.Control.Draw({
                    draw: {
                        polygon: false,
                        marker: true,
                        polyline: false,
                        circle: false,
                        circlemarker: false,
                    },
                    edit: {
                        featureGroup: drawnItems
                    }
                }));
                this.map.on('draw:created', function (event) {
                    var layer = event.layer;
                    
                    // Check if the layer is a marker
                    if(layer instanceof L.Marker){
                        // Check if there are existing markers and remove them
                        drawnItems.eachLayer(function(existingLayer) {
                            if(existingLayer instanceof L.Marker) {
                                drawnItems.removeLayer(existingLayer);
                            }
                        });

                        app.vue.coords = layer.getLatLng();
                        // console.log("lat lang is:", this.coords.lat, this.coords.lng)
                    }

                    // Check if the layer is a rectangle
                    if(layer instanceof L.Rectangle){
                        // Check if there are existing rectangles and remove them
                        drawnItems.eachLayer(function(existingLayer) {
                            if(existingLayer instanceof L.Rectangle) {
                                drawnItems.removeLayer(existingLayer);
                            }
                        });
                        
                        var bounds = layer.getBounds();
                        // Get the bounds of the new rectangle
                        app.vue.north = bounds.getNorth();
                        app.vue.south = bounds.getSouth();
                        app.vue.west = bounds.getWest();
                        app.vue.east = bounds.getEast();
                        
                        // console.log(bounds);
                    }
                    
                    drawnItems.addLayer(layer);
                    console.log("left draw:created");
                });
                this.map.on('draw:deleted', function (event) {
                    var layers = event.layers;
                    layers.eachLayer(function (layer) {
                        if(layer instanceof L.Marker){
                            app.vue.coords = null;
                        } else if (layer instanceof L.Rectangle) {
                            app.vue.bounds = null
                        }
                    });
                });
                var customControl = L.Control.extend({
                    options: {
                        position: 'topright' // Change position as needed
                    },
                    onAdd: function () {
                        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                        
                        // Add your custom buttons here
                        container.innerHTML += '<button onclick="app.vue.locations_redirect()">Location Data On Region</button>';
                        container.innerHTML += '<button onclick="app.vue.openModal()">Submit Checklist At Pin</button>';                        
                        return container;
                    }
                });

                this.map.addControl(new customControl());

                function getCircleMarkers(bounds){
                    var layers = [];
                    drawnItems.eachLayer((layer)=>{
                        if(layer instanceof L.Circle){ //only circleMarkers, exclude Circles
                            if(bounds.contains(layer.getLatLng())){
                                layers.push(layer);
                            }
                        }
                    });
                    console.log(layers);
                    return layers;
                }
            }
            
            if (this.heatmapLayer) {
                this.map.removeLayer(this.heatmapLayer);
            }

            // Create the heatmap layer with the loaded data
            this.heatmapLayer = L.heatLayer(this.heatmap_data, {
                radius: 25, // Radius of each "point" of the heatmap
                blur: 15,   // Amount of blur
                maxZoom: 17 // Max zoom level for the heatmap layer
            }).addTo(this.map);
        }
    }
};
// Mount the Vue app to the element with id 'app'
app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    app.vue.loading = true;
    axios.get(get_heatmap_url, {
        params: {
            bird_name: app.vue.search_query
        }
    }).then((response) => {
        app.vue.heatmap_data = response.data.density;
        app.vue.render_heatmap();
        app.vue.loading = true;
    }).catch((error) => {
        console.error('Error loading heatmap data:', error);
    });
}

app.load_data();