/**
 * Created by amandaghassaei on 11/27/16.
 */


function initOptSetupView(globals) {

    return new (Backbone.View.extend({

        el: "#optSetupControls",

        events: {
            "click .resetSim": "reset",
            "click .startSim": "start",
            "click .pauseSim": "pause"
        },

        initialize: function () {

        },

        reset: function (e) {
            e.preventDefault();
            globals.solver.pause();
            globals.solver.reset();
        },

        start: function (e) {
            e.preventDefault();
            globals.set("simNeedsReset", true);
            globals.solver.start();
        },

        // staticSolve: function(e){
        //     e.preventDefault();
        //     globals.set("simNeedsReset", true);
        //     globals.solver.pause();
        //     globals.solver.staticSolve();
        // },

        pause: function (e) {
            e.preventDefault();
            globals.solver.pause();
        }

    }))({model: globals.structure});
}