/**
 * Created by ghassaei on 11/9/16.
 */



function initSimulationView(globals){

    return new (Backbone.View.extend({

        el: "#simulationControls",

        events: {
            "click #stepForward": "stepForward"
        },

        initialize: function(){
        },

        reset: function(e){
            e.preventDefault();
            globals.solver.reset();
        },

        stepForward: function(e){
            e.preventDefault();
            globals.solver.step();
        }

    }))({model:globals.structure});
}