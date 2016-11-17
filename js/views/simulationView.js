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

            this.listenTo(globals, "change:isAnimating", this.setButtonVis);
            this.listenTo(globals, "change:simNeedsReset", this.setResetVis);

            setRadio("dampingType", globals.get("dampingType"), function(val){
                globals.set("dampingType", val);
            });
            setInput("#kineticDampingTolerance", globals.get("kineticDampingTolerance"), function(val){
                globals.set("kineticDampingTolerance", val);
            }, 0);
            setInput("#numStepsPerFrame", globals.get("numStepsPerFrame"), function(val){
                globals.set("numStepsPerFrame", val);
            }, 1);

            this.setButtonVis();
            this.setResetVis();
        },

        setButtonVis: function(){
            var state = globals.get("isAnimating");
            if (state){
                $("#startSim").hide();
                $("#pauseSim").show();
            } else {
                $("#startSim").show();
                $("#pauseSim").hide();
            }
        },

        setResetVis: function(){
            var state = globals.get("simNeedsReset");
            if (state){
                $("#resetSim").show();
            } else {
                $("#resetSim").hide();
            }
        },

        reset: function(e){
            e.preventDefault();
            globals.solver.pause();
            globals.solver.reset();
        },

        start: function(e){
            e.preventDefault();
            globals.set("simNeedsReset", true);
            globals.solver.start();
        },

        staticSolve: function(e){
            e.preventDefault();
            globals.set("simNeedsReset", true);
            globals.solver.pause();
            globals.solver.staticSolve();
        },

        pause: function(e){
            e.preventDefault();
            globals.solver.pause();
        },

        stepForward: function(e){
            e.preventDefault();
            globals.set("simNeedsReset", true);
            globals.solver.pause();
            globals.solver.singleStep();
        }

    }))({model:globals.structure});
}