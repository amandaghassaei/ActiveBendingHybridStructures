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
            setCheckbox("#constantNumElements", globals.get("constantNumElements"), this.switchConstantNumElements);

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
            var $segmentLength = $("#segmentLength");
            var $numEdgeElements = $("#numEdgeElements");
            var $parallelOptions = $(".parallelMeshingOption");
            var $constantElementsCheckbox = $("#constantNumElements");
            if (val === "radialMeshing"){
                $constantElementsCheckbox.removeAttr("disabled");
                $radialOptions.show();
                $parallelOptions.hide();
                if (globals.get("constantNumElements")) {
                    $numEdgeElements.show();
                    $segmentLength.hide();
                }
                else {
                    $numEdgeElements.hide();
                    $segmentLength.show();
                }
            } else if (val === "parallelMeshing"){
                $constantElementsCheckbox.attr("disabled", true);
                $numEdgeElements.show();
                $radialOptions.hide();
                $segmentLength.hide();
                $parallelOptions.show();
            } else {
                console.warn("invalid meshing mode");
                return;
            }
            globals.set("meshingMode", val);
        },

        switchConstantNumElements: function(state){
            var $segmentLength = $("#segmentLength");
            var $numEdgeElements = $("#numEdgeElements");
            if (state){
                $numEdgeElements.show();
                $segmentLength.hide();
            } else {
                $numEdgeElements.hide();
                $segmentLength.show();
            }
            globals.set("constantNumElements", state);
        }

    }))({model:globals.structure});
}