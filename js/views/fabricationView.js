/**
 * Created by ghassaei on 11/9/16.
 */



function initFabricationView(globals){

    return new (Backbone.View.extend({

        el: "#fabricationControls",

        events: {
            "click #stepForward": "stepForward",
            "click .resetSim": "reset",
            "click .startSim": "start",
            "click .pauseSim": "pause",
            "click #staticSolve": "staticSolve",
            "click #saveSTL": "saveSTL"
        },

        initialize: function(){

            this.listenTo(globals, "change:isAnimating", this.setButtonVis);
            this.listenTo(globals, "change:simNeedsReset", this.setResetVis);

            setSliderInput("#baseThickness", globals.get("baseThickness"), 0.1, 100, 0.01, function(val){
                globals.set("baseThickness", val);
            });
            setSliderInput("#edgeThickness", globals.get("edgeThickness"), 0.1, 10, 0.01, function(val){
                globals.set("edgeThickness", val);
            });
            setSliderInput("#mountDepth", globals.get("mountDepth"), 0.1, 1, 0.01, function(val){
                globals.set("mountDepth", val);
            });
            setSliderInput("#stockRadius", globals.get("stockRadius"), 0.0001, 1, 0.0001, function(val){
                globals.set("stockRadius", val);
            });

            this.setButtonVis();
            this.setResetVis();
        },

        setButtonVis: function(){
            var state = globals.get("isAnimating");
            if (state){
                $(".startSim").hide();
                $(".pauseSim").show();
            } else {
                $(".startSim").show();
                $(".pauseSim").hide();
            }
        },

        setResetVis: function(){
            var state = globals.get("simNeedsReset");
            if (state){
                $(".resetSim").show();
            } else {
                $(".resetSim").hide();
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

        pause: function(e){
            e.preventDefault();
            globals.solver.pause();
        },

        saveSTL: function(e){
            e.preventDefault();
            globals.fab.saveSTL();
        }

    }))({model:globals.structure});
}