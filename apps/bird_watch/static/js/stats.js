"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            stats: [], 
            map: null,
        };
    },
    
    methods: {
        back_button_clicked: function(item) {
            // Implement your click handler logic here
            alert('You clicked on ' + item.name);
            // You can also use window.location.href to navigate to another page
            // window.location.href = 'some_url_based_on_' + item.name;
        }
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
    console.log("start");
    axios.get(get_stats_url).then(function (r) {
        app.vue.stats = r.data.birds_seen;
    });
    console.log("end");
}

app.load_data();

