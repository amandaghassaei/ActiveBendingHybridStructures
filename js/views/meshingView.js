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
            setSliderInput("#segmentLength", globals.get("segmentLength"), 0.1, 5, 0.1, this.beamSegmentLengthChanged);
            setSliderInput("#numEdgeElements", globals.get("numEdgeElements"), 2, 10, 1, this.numElementsChanged);

            setRadio("meshingMode", globals.get("meshingMode"), this.meshingModeChanged);

            this.meshingModeChanged(globals.get("meshingMode"));
        },

        radialMembraneLayersChanged: function(val){
            globals.set("radialMembraneLayers", val);
        },

        beamSegmentLengthChanged: function(val){
            globals.set("segmentLength", val);
        },

        numElementsChanged: function(val){
            globals.set("numEdgeElements", val);
        },

        meshingModeChanged: function(val){
            var $radialOptions = $(".radialMeshingOption");
            var $parallelOptions = $(".parallelMeshingOption");
            if (val === "radialMeshing"){
                $radialOptions.show();
                $parallelOptions.hide();
            } else if (val === "parallelMeshing"){
                $radialOptions.hide();
                $parallelOptions.show();
            } else {
                console.warn("invalid meshing mode");
                return;
            }
            globals.set("meshingMode", val);
        }

    }))({model:globals.structure});
}