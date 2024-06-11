"use strict";

let app = {};

app.data = {    
    data: function() {
        return {
            showModal: show_modal,
        };
    },
    methods: {
        openModal: function() {
            this.showModal = true;
        },
        closeModal: function() {
            this.showModal = false;
        },
        checklists_redirect: function () {
            axios.get(handle_redirect_checklists_url, {
            }).then(function (r) {
                window.location.href = r.data.url;
            });
        },
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

// if user failed to fill out modal, remember state of keeping modal open/closed
document.addEventListener("DOMContentLoaded", function() {
    const addButton = document.getElementById('addButton');
    if (window.location.href.includes('/edit')) {
        addButton.style.display = 'none';
    }
});