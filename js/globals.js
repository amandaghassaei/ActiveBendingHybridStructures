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

            //opt params
            optIncludeBeams: true,
            optIncludeMembranes: false,
            optIncludeForces: false,
            optNeedsReset: true,
            optimizationRunning: false,
            fitnessTol: 1,
            fitness: null,

            //meshing  params
            segmentLength: 2,
            radialMembraneLayers: 1,
            numEdgeElements: 4,
            needsRemesh: true,
            meshingChanged: true,
            numFixedChanged: true,

            //simulation params
            isAnimating: false,
            simNeedsReset: true,
            simNeedsSetup: true,
            dampingType: "kinetic",
            kineticDampingTolerance: 0.00001,
            numStepsPerFrame: 20,
            simE: 10000,
            simA: 0.1,
            simI: 0.05,
            simDt: 0.01,
            simMembraneFD: 0.05
        },

        initialize: function(){
            this.threeView = initThreeView(this);
            this.mesh = initMesh(this);
            this.structure = initStructure(this);
            this.intersector3D = initIntersector3D(this, this.structure);
            this.view = initView(this);
            this.solver = initSolver(this);
            this.optimization = initOptimization(this);
            this.fitness = initFitness(this);
            this.gradient = initGradient(this);
            initMeshEditingView(this);
            this.beamEditingView = initBeamEditingView(this);
            this.membraneEditingView = initMembraneEditingView(this);
            initMeshingView(this);
            this.boundaryEditingView = initBoundaryEditingView(this);
            initSimulationView(this);
            this.optSetup = initOptSetupView(this);
            this.optimizationView = initOptimizationView(this);

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
                } else if (mode == "optSetup"){
                    if (e.keyCode == 13){
                        self.optSetup.linkVariables();
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
        },

        getSaveSettings: function(){
            return _.omit(this.toJSON(), ["mode", "snapToVertex", "autoDeleteGeo", "deleteNodeMode", "deleteBeamMode",
                "boundaryEditingMode", "optNeedsReset", "optimizationRunning", "fitness", "needsRemesh", "meshingChanged",
                "numFixedChanged", "isAnimating", "simNeedsReset", "simNeedsSetup"]);
        }

    }))();
}