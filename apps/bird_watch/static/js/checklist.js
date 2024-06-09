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
            my_value: 1, // This is an example.
            showModal: false,
            map: null,
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
        },
        // get_sighting_url: function(event_id) {
        //     // return `checklist/sightings?event_id=${event_id}`;
        //     return `/checklist/sightings/${event_id}`
        // },
        save_button: function() {
            if ((this.new_date === null) || (this.new_time === null) || (this.new_duration == null) || (this.new_latitude === null) || (this.new_longitude === null)) {
                console.log("jello")
            }
            else {
                this.add_checklist();   
            }
        },
        add_checklist: function(){
            
            this.closeModal();

        }
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_checklist_url, {
        params: {
            observer_id: 'obs1644106'
        }
    }).then(function (r) {
        app.vue.checklist = r.data.checklist;
        app.vue.bird_count = r.data.bird_count;
        console.log(app.vue.checklist)
        console.log(app.vue.bird_count)
        
    });
}

app.load_data();
