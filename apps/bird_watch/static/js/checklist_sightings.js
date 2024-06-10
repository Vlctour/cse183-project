"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            showModal: show_modal,
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function() {
            // This is an example.
            return
        },
        openModal: function() {
            this.showModal = true;
        },
        closeModal: function() {
            this.showModal = false;
        },
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    return
    // axios.get(my_callback_url).then(function (r) {
    //     app.vue.my_value = r.data.my_value;
    // });
}

app.load_data();

document.addEventListener("DOMContentLoaded", function() {
    const addButton = document.getElementById('addButton');
    if (window.location.href.includes('/edit')) {
        addButton.style.display = 'none';
    }
});