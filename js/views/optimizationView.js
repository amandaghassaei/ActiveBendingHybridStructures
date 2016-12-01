/**
 * Created by amandaghassaei on 11/30/16.
 */


function initOptimizationView(globals){

    return new (Backbone.View.extend({

        el: "#optimizationControls",

        events: {
            "click .resetOpt": "reset",
            "click .startOpt": "start",
            "click .pauseOpt": "pause"
        },

        initialize: function(){

            this.listenTo(globals, "change:optimizationRunning", this.setButtonVis);
            this.listenTo(globals, "change:optNeedsReset", this.setResetVis);
            this.listenTo(globals, "change:fitness", this.setFitness);

            this.listenTo(globals, "change:mode", function(){
                if (globals.previous("mode") === "optimization"){
                    globals.optimization.resetOptimization();
                }
            });

            setInput("#fitnessTol", globals.get("fitnessTol"), function(val){
                globals.set("fitnessTol", val);
            }, 0);

            this.setButtonVis();
            this.setResetVis();
            this.setFitness();
        },

        setFitness: function(){
            var fitness = globals.get("fitness");
            if (fitness === null) {
                $("#currentFitness").html("null");
                return;
            }
            $("#currentFitness").html(fitness.toFixed(2) + " m<sup>2</sup>");
        },

        setButtonVis: function(){
            var state = globals.get("optimizationRunning");
            if (state){
                $(".startOpt").hide();
                $(".pauseOpt").show();
            } else {
                $(".startOpt").show();
                $(".pauseOpt").hide();
            }
        },

        setResetVis: function(){
            var state = globals.get("optNeedsReset");
            if (state){
                $(".resetOpt").show();
            } else {
                $(".resetOpt").hide();
            }
        },

        reset: function(e){
            e.preventDefault();
            globals.optimization.resetOptimization();
        },

        start: function(e){
            e.preventDefault();
            globals.optimization.startOptimization();
        },

        pause: function(e){
            e.preventDefault();
            globals.optimization.pauseOptimization();
        }



    }))({model:globals.structure});
}