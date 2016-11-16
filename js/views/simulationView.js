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
            "click #pauseSim": "pause",
            "click #staticSolve": "staticSolve"
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

        staticSolve: function(e){
            e.preventDefault();
            globals.solver.staticSolve();
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