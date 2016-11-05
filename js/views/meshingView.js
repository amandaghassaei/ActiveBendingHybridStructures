/**
 * Created by ghassaei on 11/4/16.
 */


function initMeshingView(globals){

    return new (Backbone.View.extend({

        el: "#meshingControls",

        events: {
        },

        initialize: function(){

            setSliderInput("#radialMembraneLayers", globals.get("radialMembraneLayers"), 0, 5, 1, this.radialMembraneLayersChanged);
            setSliderInput("#segmentLength", globals.get("segmentLength"), 0.01, 5, 0.01, this.beamSegmentLengthChanged);
        },

        radialMembraneLayersChanged: function(val){
            globals.set("radialMembraneLayers", val);
        },

        beamSegmentLengthChanged: function(val){
            globals.set("segmentLength", val);
        }

    }))({model:globals.structure});
}