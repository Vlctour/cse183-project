"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            checklist: [],
            selected_checklist: [],
            bird_count: {},
            new_date: null,         
            new_time: null,         
            new_duration: null,     
            new_latitude: null,      
            new_longitude: null,    
            validationError: false, // New property to track validation state
            showModal: false,
            search_query: null,
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
        update_page: function(val) {
            let last_page = this.total_pages;
            if ((this.page_number == 1 && val == -1) || (this.page_number >= last_page && val == 1)) {
                return;
            }
            this.page_number += val;

            this.first_page = this.page_number == 1;
            this.last_page = this.page_number >= last_page;

            const start = (this.page_number - 1) * this.items_per_page;
            const end = this.page_number * this.items_per_page;
            this.selected_checklist = this.checklist.slice(start, end);
        },
        delete_checklist: function(event_id) {
            let self = this;
            axios.post(delete_checklist_url, {event_id: event_id}).then(function(r){
                for (let i = self.selected_checklist.length - 1; i >= 0; i--) {
                    if (self.selected_checklist[i].event_id === event_id) {
                        self.selected_checklist.splice(i, 1);
                    }
                }
                
            });

        },
        openModal: function() {
            this.showModal = true;
          },
        closeModal: function() {
            this.showModal = false;
            this.validationError = false;
        },
        handle_redirect: function(event_id) {
            // return `checklist/sightings?event_id=${event_id}`;
            axios.get(handle_redirect_url, {
                params: {
                    event_id: event_id
                }
            }).then(function (r) {
                window.location.href = r.data.url; 
            });
            // return `/checklist/sightings/${event_id}`
        },
        save_button: function() {
            this.validationError = false;

            if (this.new_date === null || this.new_time === null || this.new_duration === null || this.new_latitude === null || this.new_longitude === null) {
                this.validationError = true;
                return;
            }

            this.add_checklist();
        },
        add_checklist: function(){
            let self = this;
            this.closeModal();
            axios.post(add_checklist_url, {
                date: self.new_date,        
                time: self.new_time,         
                duration: self.new_duration,     
                latitude: self.new_latitude,      
                longitude: self.new_longitude,    
 
            }).then(function (r) {
                app.load_data();
                self.new_date = null;       
                self.new_time = null;         
                self.new_duration = null;     
                self.new_latitude = null;    
                self.new_longitude = null;
                
            });
        },
        search_checklist: function() {
            let self = this;
            axios.get(search_checklist_url, {
                params : {
                    bird_name: self.search_query
                }
            }).then(function (r) {
                self.checklist = r.data.checklist;
                self.bird_count = r.data.bird_count;
            });
            
        }
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_checklist_url, {
    }).then(function (r) {
        app.vue.checklist = r.data.checklist;
        // console.log(r.data.checklist);
        app.vue.bird_count = r.data.bird_count;

        app.vue.total_items = r.data.checklist.length;
        app.vue.total_pages = Math.ceil(app.vue.total_items / app.vue.items_per_page);
        
        // Handle case where there's only one page
        if (app.vue.total_pages <= 1) {
            app.vue.first_page = true;
            app.vue.last_page = true;
        }

        const start = (app.vue.page_number - 1) * app.vue.items_per_page;
        const end = app.vue.page_number * app.vue.items_per_page;
        app.vue.selected_checklist = r.data.checklist.slice(start, end);
    });
}

app.load_data();
