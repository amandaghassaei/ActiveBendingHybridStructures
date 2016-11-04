/**
 * Created by ghassaei on 11/3/16.
 */


function initStructure(globals){

    return new (Backbone.Model.extend({

        defaults: {
        },

        initialize: function(){

            this.nodes = [];
            this.beams = [];
            this.membranes = [];

            this.currentEditingBeam = null;
            this.selectedEdges = [];

            this.object3D = new THREE.Object3D();
            this.nodesContainer = new THREE.Object3D();
            this.object3D.add(this.nodesContainer);
            this.beamsContainer = new THREE.Object3D();
            this.object3D.add(this.beamsContainer);
            this.edgesContainer = new THREE.Object3D();
            this.object3D.add(this.edgesContainer);
            this.membraneContainer = new THREE.Object3D();
            this.object3D.add(this.membraneContainer);
            globals.threeView.sceneAdd(this.object3D);

            this.intersector = initIntersector3D(globals, this);

            this.listenTo(globals, "change:mode", this.updateForMode);
            this.updateForMode();
        },

        updateForMode: function(){
            this.currentEditingBeam = null;
            this.selectedEdges = [];
            var mode = globals.get("mode");
            this.object3D.visible = mode !== "meshEditing";
            var beamMaterial = edgeMaterial;
            if (mode == "beamEditing"){
                beamMaterial = edgeMaterialBeamEditing;
            }
            _.each(this.beams, function(beam){
                beam.setMaterial(beamMaterial);
            });
            this.membraneContainer.visible = mode === "membraneEditing" || mode === "forceEditing";
            globals.threeView.render();
        },

        newBeam: function(node){
            var beam = new Beam(node, this.beamsContainer, this.edgesContainer);
            this.beams.push(beam);
            this.trigger("change:beams");
            return beam;
        },
        getNumBeams: function(){
            return this.beams.length;
        },

        newNode: function(position){
            if (this.nodeAtPosition(position)) return;
            var node = new Node(position, this.nodesContainer);
            this.nodes.push(node);
            this.trigger("change:nodes");
            globals.threeView.render();
        },
        getNumNodes: function(){
            return this.nodes.length;
        },
        nodeAtPosition: function(position){
            for (var i=0;i<this.nodes.length;i++){
                if (this.nodes[i].getPosition().equals(position)) return true;
            }
            return false;
        },

        newMembrane: function(){
            if (this.selectedEdges.length < 2) return;
            var membrane = new Membrane(this.selectedEdges, this.membraneContainer);
            this.membranes.push(membrane);
            this.trigger("change:membranes");
            _.each(this.selectedEdges, function(edge){
                edge.setMaterial(edgeMaterial);
            });
            this.selectedEdges = [];
            globals.threeView.render();
        },
        getNumMembranes: function(){
            return this.membranes.length;
        },

        getNodesToIntersect: function(){
            return this.nodesContainer.children;
        },
        getEdgesToIntersect: function(){
            return this.edgesContainer.children;
        },

        addNodeToBeam: function(node){
            if (this.currentEditingBeam){
                this.currentEditingBeam.addNode(node);
            } else {
                this.currentEditingBeam = this.newBeam(node);
            }
        },
        stopEditingBeam: function(){
            if (this.currentEditingBeam) this.currentEditingBeam.stopEditing();
            this.currentEditingBeam = null;
        },

        selectEdge: function(edge){
            var index = this.selectedEdges.indexOf(edge);
            if (index<0){
                edge.setMaterial(edgeMaterialSelected);
                this.selectedEdges.push(edge);
            } else {
                edge.setMaterial(edgeMaterial);
                this.selectedEdges.splice(index, 1);
            }
        }

    }))();
}