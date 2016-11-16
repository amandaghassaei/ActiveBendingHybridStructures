/**
 * Created by ghassaei on 11/9/16.
 */



function initSimulationView(globals){

    return new (Backbone.View.extend({

        el: "#simulationControls",

        events: {
            "click #stepForward": "stepForward",
            "click #resetSim": "reset",
            "click #startSim": "start",
            "click #pauseSim": "pause"
        },

        initialize: function(){
        },

        reset: function(e){
            e.preventDefault();
            globals.solver.reset();
        },

        start: function(e){
            e.preventDefault();
            globals.solver.start();
        },

        pause: function(e){
            e.preventDefault();
            globals.solver.pause();
        },

        stepForward: function(e){
            e.preventDefault();
            globals.solver.step();
        }

    }))({model:globals.structure});
}