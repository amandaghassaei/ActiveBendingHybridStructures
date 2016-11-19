/**
 * Created by ghassaei on 11/2/16.
 */

function initGlobals(){

    return new (Backbone.Model.extend({

        defaults: {
            mode: "meshEditing",

            snapToVertex: true,
            autoDeleteGeo: true,
            deleteNodeMode: false,
            deleteBeamMode: false,

            meshingMode: "radialMeshing",
            boundaryEditingMode: "fixed",
            constantNumElements: true,

            isAnimating: false,
            simNeedsReset: false,
            dampingType: "kinetic",
            kineticDampingTolerance: 0.00001,
            numStepsPerFrame: 20,
            simE: 1,
            simA: 1,
            simI: 1,

            //simulation params
            segmentLength: 2,
            radialMembraneLayers: 1,
            numEdgeElements: 4,
            needsRemesh: false,
            meshingChanged: true,
            numFixedChanged: true
        },

        initialize: function(){
            this.threeView = initThreeView(this);
            this.mesh = initMesh(this);
            this.structure = initStructure(this);
            this.view = initView(this);
            this.solver = initSolver(this);
            initMeshEditingView(this);
            initBeamEditingView(this);
            initMembraneEditingView(this);
            initMeshingView(this);
            initBoundaryEditingView(this);
            initSimulationView(this);

            var self = this;
            $(window).bind('keyup', function(e) {
                var mode = self.get("mode");
                if (mode === "membraneEditing"){
                    if (e.keyCode == 13){
                        self.structure.newMembrane();
                    }
                } else if (mode === "beamEditing"){
                    if (e.keyCode == 68){
                        self.set("deleteNodeMode", false);
                    }
                }
            });
            $(window).bind('keydown', function(e) {
                var mode = self.get("mode");
                if (mode === "beamEditing"){
                    if (e.keyCode == 68){
                        self.set("deleteNodeMode", true);
                    }
                }
            });
        }

    }))();
}