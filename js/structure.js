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

            this.simNodes = [];
            this.simBeams = [];
            this.simMembranes = [];

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
            this.simContainer = new THREE.Object3D();
            this.object3D.add(this.simContainer);
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
            } else if (mode === "meshing"){
                this.syncSim();
            }
            _.each(this.beams, function(beam){
                beam.setMaterial(beamMaterial);
            });
            this.simContainer.visible = mode === "meshing";
            this.nodesContainer.visible = mode !== "meshing";
            this.beamsContainer.visible =  mode !== "meshing";
            this.edgesContainer.visible =  mode !== "meshing";
            this.membraneContainer.visible = mode !== "meshing" && (mode === "membraneEditing" || mode === "forceEditing");
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
        },

        syncSim: function(){

            var nodes = this.nodes;
            var beams = this.beams;
            var membranes = this.membranes;

            this.simContainer.children = [];
            var parent = this.simContainer;

            for (var i=0;i<this.simNodes.length;i++){
                this.simNodes[i].destroy();
            }
            this.simNodes = [];
            for (var i=0;i<this.simBeams.length;i++){
                this.simBeams[i].destroy();
            }
            this.simBeams = [];
            for (var i=0;i<this.simMembranes.length;i++){
                this.simMembranes[i].destroy();
            }
            this.simMembranes = [];

            for (var i=0;i<nodes.length;i++){
                var simNode = new SimNode(nodes[i].getPosition(), parent);
                simNode.setFixed();
                this.simNodes.push(simNode);
            }
            var allEdges = [];
            var allSimEdges = [];
            for (var i=0;i<beams.length;i++){
                var edges = beams[i].getEdges();
                var simEdges = [];
                for (var j=0;j<edges.length;j++){
                    allEdges.push(edges[j]);
                    var edgeNodes = edges[j].getNodes();
                    var index1 = nodes.indexOf(edgeNodes[0]);
                    var index2 = nodes.indexOf(edgeNodes[1]);
                    var simEdge = new SimEdge([this.simNodes[index1], this.simNodes[index2]], parent);
                    allSimEdges.push(simEdge);
                    simEdges.push(simEdge);
                }
                var simBeam = new SimBeam(simEdges);
                this.simBeams.push(simBeam);
            }
            for (var i=0;i<membranes.length;i++){
                var edges = membranes[i].getEdges();
                var simEdges = [];
                for (var j=0;j<edges.length;j++){
                    var index = allEdges.indexOf(edges[j]);
                    simEdges.push(allSimEdges[index]);
                }
                //orient edges (assume closed loops)
                var orientedEdges = [];
                var orientedNodes = [];
                orientedNodes.push(simEdges[0].getNodes()[0]);
                for (var j=0;j<simEdges.length;j++){
                    var lastNode = orientedNodes[orientedNodes.length-1];
                    var nextEdge = this._getNextEdge(lastNode, simEdges);
                    orientedEdges.push(nextEdge);
                    orientedNodes.push(nextEdge.getOtherNode(lastNode));
                }
                var simMembrane = new SimMembrane(orientedEdges, orientedNodes, parent);
                this.simMembranes.push(simMembrane);
            }

            var elementLength = globals.get("segmentLength");
            for (var i=0;i<this.simBeams.length;i++){
                this.simBeams[i].mesh(elementLength);
            }
            var numLayers = globals.get("radialMembraneElements");
            for (var i=0;i<this.simMembranes.length;i++){
                this.simMembranes[i].mesh(numLayers);
            }
        },

        _getNextEdge: function(lastNode, edges){
            for (var j=1;j<edges.length;j++){
                var nodes = edges[j].getNodes();
                if (nodes.indexOf(lastNode) > -1){
                    return edges[j];
                }
            }
            console.warn("couldn't find next edge");
            return null;
        }

    }))();
}