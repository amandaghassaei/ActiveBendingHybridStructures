/**
 * Created by ghassaei on 11/4/16.
 */


function initMeshingView(globals){

    return new (Backbone.View.extend({

        el: "#meshingControls",

        events: {
        },

        initialize: function(){

            setSliderInput("#radialMembraneElements", globals.get("segmentLength"), 0, 10, 1, this.meshRadialResolutionChanged);
            setSliderInput("#segmentLength", globals.get("segmentLength"), 0.01, 5, 0.01, this.beamSegmentLengthChanged);
        },

        meshRadialResolutionChanged: function(val){
            globals.set("radialMembraneElements", val);
        },

        beamSegmentLengthChanged: function(val){
            globals.set("segmentLength", val);
        }

    }))({model:globals.structure});
}