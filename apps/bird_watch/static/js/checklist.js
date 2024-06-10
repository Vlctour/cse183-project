"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            checklist: [],
            bird_count: {},
            new_date: null,         
            new_time: null,         
            new_duration: null,     
            new_latitude: null,      
            new_longitude: null,    
            validationError: false, // New property to track validation state
            showModal: false,
            search_query: null, 
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function() {
            // This is an example.
            this.my_value += 1;
        },
        delete_checklist: function(event_id) {
            let self = this;
            axios.post(delete_checklist_url, {event_id: event_id}).then(function(r){
                for (let i = self.checklist.length - 1; i >= 0; i--) {
                    if (self.checklist[i].event_id === event_id) {
                        self.checklist.splice(i, 1);
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
                console.log(r.data.checklist);
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
        app.vue.bird_count = r.data.bird_count;
        
    });
}

app.load_data();
