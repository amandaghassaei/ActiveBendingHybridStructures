/**
 * Created by ghassaei on 11/3/16.
 */


function initStructure(globals){

    return new (Backbone.Model.extend({

        defaults: {
            numFixed: 0
        },

        initialize: function(){

            _.bindAll(this, "highlightBeam", "highlightMembrane");

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

            this.simNodesContainer = new THREE.Object3D();
            this.object3D.add(this.simNodesContainer);
            this.simEdgesContainer = new THREE.Object3D();
            this.object3D.add(this.simEdgesContainer);
            this.simMembraneContainer = new THREE.Object3D();
            this.object3D.add(this.simMembraneContainer);
            globals.threeView.sceneAdd(this.object3D);


            initIntersector3D(globals, this);

            this.listenTo(globals, "change:mode", this.updateForMode);
            this.listenTo(globals, "change:radialMembraneLayers", this.radialMembraneLayersChanged);
            this.listenTo(globals, "change:segmentLength", this.mesh);
            this.listenTo(globals, "change:constantNumElements", this.mesh);
            this.listenTo(globals, "change:numEdgeElements", this.mesh);
            this.listenTo(globals, "change:meshingMode", this.mesh);
            this.listenTo(this, "change:beams change:membranes", function(){
                globals.set("needsRemesh", true);
            });
            this.listenTo(globals, "change:boundaryEditingMode", this.boundaryEditingModeChanged);
            this.listenTo(this, "change:numFixed", function(){
                globals.set("numFixedChanged", true);
            });
            this.updateForMode();

            //var node1 = this.newNode(new THREE.Vector3());
            //var node2 = this.newNode(new THREE.Vector3(10,0,0));
            //var node3 = this.newNode(new THREE.Vector3(2,10,0));
            //this.addNodeToBeam(node1);
            //this.addNodeToBeam(node2);
            //this.addNodeToBeam(node3);
            //this.addNodeToBeam(node1);
            //var beam = this.currentEditingBeam;
            //this.selectedEdges = beam.getEdges();
            //this.newMembrane();
            //this.syncSim();
            //this.simNodes[0].setFixed(true);
            //this.simNodes[1].setFixed(true);
            //this.set("numFixed", 2);

            var node1 = this.newNode(new THREE.Vector3(0,10,0));
            var node2 = this.newNode(new THREE.Vector3(10,0,10));
            var node3 = this.newNode(new THREE.Vector3(10,0,-10));
            var node4 = this.newNode(new THREE.Vector3(-10,0,10));
            var node5 = this.newNode(new THREE.Vector3(-10,0,-10));
            this.addNodeToBeam(node2);
            this.addNodeToBeam(node1);
            this.addNodeToBeam(node3);
            var beam1 = this.currentEditingBeam;
            this.currentEditingBeam = null;
            this.addNodeToBeam(node4);
            this.addNodeToBeam(node1);
            this.addNodeToBeam(node5);
            var beam2 = this.currentEditingBeam;
            this.currentEditingBeam = null;
            this.addNodeToBeam(node3);
            this.addNodeToBeam(node5);
            var beam3 = this.currentEditingBeam;
            this.currentEditingBeam = null;
            this.selectEdge(beam3.edges[0]);
            this.selectEdge(beam1.edges[1]);
            this.selectEdge(beam2.edges[1]);
            this.newMembrane();
            this.syncSim();
            this.simNodes[1].setFixed(true);
            this.nodes[1].setFixed(true);
            this.simNodes[2].setFixed(true);
            this.nodes[2].setFixed(true);
            this.simNodes[3].setFixed(true);
            this.nodes[3].setFixed(true);
            this.simNodes[4].setFixed(true);
            this.nodes[4].setFixed(true);
            this.set("numFixed", 4);
        },

        updateForMode: function(){
            this.stopEditingBeam();
            for (var i=0;i<this.selectedEdges.length;i++){
                this.selectedEdges[i].selected = false;
            }
            this.selectedEdges = [];
            globals.set("deleteNodeMode", false);
            globals.set("deleteBeamMode", false);
            var mode = globals.get("mode");
            this.object3D.visible = mode !== "meshEditing";
            if (mode == "beamEditing"){
                _.each(this.beams, function(beam){
                    beam.setMaterial(edgeMaterialGrey);
                });
                this.highlightBeam($("input[name=selectedBeam]:checked").val());
            } else {
                _.each(this.beams, function(beam){
                    beam.setMaterial(edgeMaterialGrey);
                });
            }
            if (mode === "meshing"){
                if (globals.get("needsRemesh")) this.syncSim();
                _.each(this.simMembranes, function(membrane){
                    membrane.setEdgeMaterial(edgeMaterialPurple);
                    membrane.hideNodes();
                });
            } else if (mode === "boundaryEditing"){
                if (globals.get("needsRemesh")) this.syncSim();
                this.boundaryEditingModeChanged();
            } else if (mode === "simulation"){
                if (globals.get("needsRemesh")) this.syncSim();
                _.each(this.simMembranes, function(membrane){
                    membrane.setEdgeMaterial(edgeMaterialLightGray);
                    membrane.hideNodes();
                });
            } else if (mode === "optSetup"){
                if (globals.get("needsRemesh")) this.syncSim();
                _.each(this.simMembranes, function(membrane){
                    membrane.setEdgeMaterial(edgeMaterialLightGray);
                    membrane.hideNodes();
                });
            }
            this.simNodesContainer.visible = mode === "meshing" || mode === "boundaryEditing" || mode === "simulation" || mode === "optSetup";
            this.simEdgesContainer.visible = this.simNodesContainer.visible;
            this.simMembraneContainer.visible = this.simNodesContainer.visible;
            this.nodesContainer.visible = mode === "beamEditing" || mode === "membraneEditing";
            this.beamsContainer.visible =  this.nodesContainer.visible;
            this.edgesContainer.visible =  this.nodesContainer.visible;
            this.membraneContainer.visible = mode === "membraneEditing";
            globals.threeView.render();
        },

        boundaryEditingModeChanged: function(){
            if (globals.get("boundaryEditingMode") === "fixed"){
                _.each(this.simMembranes, function(membrane){
                    membrane.setEdgeMaterial(edgeMaterialLightGray);
                    membrane.hideNodes();
                });
            } else {
                _.each(this.simMembranes, function(membrane){
                    membrane.setEdgeMaterial(edgeMaterialLightGray);
                    membrane.setNodeMaterial(nodeMaterial);
                    membrane.showNodes();
                });
            }
            globals.threeView.render();
        },

        newBeam: function(node){
            var beam = new Beam(node, this.beamsContainer, this.edgesContainer);
            this.beams.push(beam);
            this.trigger("change:beams");
            return beam;
        },
        removeBeamAtIndex: function(index, clear){
            this._removeBeam(this.beams[index], index, clear);
        },
        removeBeam: function(beam, clear){
            var index = this.beams.indexOf(beam);
            if (index<0) return;
            this._removeBeam(beam, index, clear);
        },
        _removeBeam: function(beam, index, clear){
            if (clear === undefined) {
                this.removeMembranesAttachedToEdges(beam.getEdges());
                beam.destroy(clear);
                globals.set("needsRemesh", true);
                this.beams.splice(index, 1);
                this.trigger("change:beams");
                globals.threeView.render();
            } else {
                beam.destroy(clear);
                globals.set("needsRemesh", true);
            }
        },
        getNumBeams: function(){
            return this.beams.length;
        },
        getBeamsJSON: function(){
            var beamsJSON = [];
            _.each(this.beams, function(beam){
                beamsJSON.push(beam.toJSON());
            });
            return {beams:beamsJSON};
        },
        highlightBeam: function(index){
            _.each(this.beams, function(beam){
                beam.unhighlight();
            });
            if (this.beams[index]) this.beams[index].highlight();
            globals.threeView.render();
        },

        newNode: function(position){
            if (this.nodeAtPosition(position)) return;
            var node = new Node(position, this.nodesContainer);
            this.nodes.push(node);
            this.trigger("change:nodes");
            globals.threeView.render();
            return node;
        },
        removeNodeAtIndex: function(index, clear){
            this._removeNode(this.nodes[index], index, clear);
        },
        removeNode: function(node, clear){
            var index = this.nodes.indexOf(node);
            if (index<0) return;
            return this._removeNode(this.nodes[index], index, clear);
        },
        _removeNode: function(node, index, clear){
            if (clear === undefined) {
                var edges = node.getEdges();
                if (edges.length>1) {
                    globals.view.showWarningModal("Can't delete node with multiple edges attached.  Delete edges first.");
                    return false;
                } else if (edges.length == 1){
                    this._removeEdge(edges[0], node);
                }
                node.destroy(clear);
                globals.set("needsRemesh", true);
                this.nodes.splice(index, 1);
                this.trigger("change:nodes");
                globals.threeView.render();
            } else {
                node.destroy(clear);
                globals.set("needsRemesh", true);
            }
            return true;
        },
        _removeEdge: function(edge, node){
            for (var i=0;i<this.beams.length;i++){
                var beam = this.beams[i];
                if (beam.contains(edge)){
                    if (beam.getEdges().length == 1){
                        //remove beam
                        this.removeBeam(beam);
                    } else {
                        this.removeMembranesAttachedToEdges([edge]);
                        beam.removeEdge(edge, node);
                        this.trigger("change:beamsMeta");
                    }
                    return;
                }
            }
            console.warn("no edge removed");
        },
        getNumNodes: function(){
            return this.nodes.length;
        },
        getNodesJSON: function(){
            var nodesJSON = [];
            _.each(this.nodes, function(node){
                nodesJSON.push(node.toJSON());
            });
            return {nodes:nodesJSON};
        },
        nodeAtPosition: function(position){
            for (var i=0;i<this.nodes.length;i++){
                if (this.nodes[i].getPosition().equals(position)) return true;
            }
            return false;
        },

        newMembrane: function(){
            //todo check if selected edges already form a membrane
            if (!this.selectedEdgesFormClosedLoop()) {
                globals.view.showWarningModal("Selected edges must form a closed loop to create a new membrane.");
                return;
            }
            var membrane = new Membrane(this.selectedEdges, this.membraneContainer);
            this.membranes.push(membrane);
            this.trigger("change:membranes");
            _.each(this.selectedEdges, function(edge){
                edge.selected = false;
                edge.setMaterial(edgeMaterialGrey);
            });
            this.selectedEdges = [];
            globals.threeView.render();
        },
        selectedEdgesFormClosedLoop: function(){
            var selectedEdges = this.selectedEdges;
            if (selectedEdges.length < 3) return false;
            var orientedEdges = [];
            var orientedNodes = [];
            orientedNodes.push(selectedEdges[0].getNodes()[0]);
            for (var j=0;j<selectedEdges.length;j++){
                var lastNode = orientedNodes[orientedNodes.length-1];
                var nextEdge = this._getNextEdge(lastNode, selectedEdges, orientedEdges);
                if (nextEdge === null) return false;
                orientedEdges.push(nextEdge);
                orientedNodes.push(nextEdge.getOtherNode(lastNode));
            }
            return orientedNodes[0] == orientedNodes[orientedNodes.length-1];
        },
        removeMembraneAtIndex: function(index, clear){
            this._removeMembrane(this.membranes[index], index, clear);
        },
        removeMembrane: function(membrane, clear){
            var index = this.membranes.indexOf(membrane);
            if (index<0) return;
            this._removeMembrane(membrane, index, clear);
        },
        _removeMembrane: function(membrane, index, clear){
            membrane.destroy(clear);
            if (clear === undefined) {
                this.membranes.splice(index, 1);
                this.trigger("change:membranes");
                globals.threeView.render();
            }
        },
        removeMembranesAttachedToEdges: function(edges){
            var membranes = [];
            for (var i=0;i<this.membranes.length;i++){
                for (var j=0;j<edges.length;j++){
                    var membrane = this.membranes[i];
                    if (membrane.contains(edges[j])){
                        membranes.push(membrane);
                    }
                }
            }
            _.uniq(membranes);
            for (var i=0;i<membranes.length;i++){
                this.removeMembrane(membranes[i]);
            }
        },
        removeAllMembranes: function(){
            this.membraneContainer.children = [];
            var self = this;
            _.each(this.membranes, function(membrane, index){
                self._removeMembrane(membrane, index, true);
            });
            this.membranes = [];
            this.trigger("change:membranes");
        },
        getNumMembranes: function(){
            return this.membranes.length;
        },
        getMembranesJSON: function(){
            var membranesJSON = [];
            _.each(this.membranes, function(membrane){
                membranesJSON.push(membrane.toJSON());
            });
            return {membranes:membranesJSON};
        },
        highlightMembrane: function(index){
            _.each(this.membranes, function(membrane){
                membrane.unhighlight();
            });
            if (this.membranes[index]) this.membranes[index].highlight();
            globals.threeView.render();
        },

        getNodesToIntersect: function(){
            return this.nodesContainer.children;
        },
        getEdgesToIntersect: function(){
            return this.edgesContainer.children;
        },
        getSimNodesToIntersect: function(){
            return this.simNodesContainer.children;
        },
        getSimEdgesToIntersect: function(){
            return this.simEdgesContainer.children;
        },

        addNodeToBeam: function(node){
            if (this.currentEditingBeam){
                this.currentEditingBeam.addNode(node);
            } else {
                this.currentEditingBeam = this.newBeam(node);
            }
            this.trigger("change:beamsMeta");
        },
        stopEditingBeam: function(){
            if (this.currentEditingBeam) {
                this.currentEditingBeam.stopEditing();
                if (this.currentEditingBeam.getEdges().length == 0) this.removeBeam(this.currentEditingBeam);
            }
            this.currentEditingBeam = null;
        },

        selectEdge: function(edge){
            var index = this.selectedEdges.indexOf(edge);
            if (index<0){
                edge.setSelected(true);
                this.selectedEdges.push(edge);
            } else {
                edge.setSelected(false);
                this.selectedEdges.splice(index, 1);
            }
        },


        syncSim: function(){
            this.simNodesContainer.children = [];
            this.simEdgesContainer.children = [];
            this.simMembraneContainer.children = [];
            for (var i=0;i<this.simNodes.length;i++){
                if (this.simNodes[i]) this.simNodes[i].destroy();
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

            var nodes = this.nodes;
            var beams = this.beams;
            var membranes = this.membranes;

            for (var i=0;i<nodes.length;i++){
                if (nodes[i].getEdges().length==0){//no orphans
                    this.simNodes.push(null);
                    continue;
                }
                var simNode = new SimNode(nodes[i].getPosition(), this.simNodesContainer);
                if (nodes[i].fixed) simNode.setFixed(true);
                simNode.setIsBeamNode(true);
                simNode.setNodesIndex(i);
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
                    var simEdge = new SimEdge([this.simNodes[index1], this.simNodes[index2]], edges[j].simLength, this.simEdgesContainer);
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
                    var nextEdge = this._getNextEdge(lastNode, simEdges, orientedEdges);
                    orientedEdges.push(nextEdge);
                    orientedNodes.push(nextEdge.getOtherNode(lastNode));
                }
                orientedNodes.pop();
                var simMembrane = new SimMembrane(orientedEdges, orientedNodes, this.simMembraneContainer);
                this.simMembranes.push(simMembrane);
            }

            this.mesh();
            globals.set("needsRemesh", false);
        },

        mesh: function(){
            globals.set("simNeedsSetup", true);
            for (var i=0;i<this.simNodes.length;i++){
                if (this.simNodes[i]) this.simNodes[i].removeElements();
            }
            var mode = globals.get("meshingMode");
            if (mode === "radialMeshing"){
                this.meshRadial();
            } else if (mode === "parallelMeshing"){
                this.meshParallel()
            }
        },

        meshParallel: function(){
            var numElements = globals.get("numEdgeElements");
            for (var i=0;i<this.simBeams.length;i++){
                    this.simBeams[i].mesh(null, numElements);
            }
            var numLayers = globals.get("radialMembraneLayers");
            for (var i=0;i<this.simMembranes.length;i++){
                this.simMembranes[i].setBorderNodes();
                var simEdges = this.simMembranes[i].getSimEdges();
                if (simEdges.length != 4){
                    this.simMembranes[i].meshRadial(numLayers);
                    continue;
                }
                this.simMembranes[i].meshParallel(numElements);
            }
            var numFixed = 0;
            for (var i=0;i<this.simNodes.length;i++){
                if (this.simNodes[i].fixed) numFixed++;
            }
            this.set("numFixed", numFixed);
            globals.set("meshingChanged", true);
            globals.threeView.render();
        },

        meshRadial: function(){
            var numElements = undefined;
            if (globals.get("constantNumElements")) numElements = globals.get("numEdgeElements");
            var segmentLength = globals.get("segmentLength");
            for (var i=0;i<this.simBeams.length;i++){
                this.simBeams[i].mesh(segmentLength, numElements);
            }
            var numLayers = globals.get("radialMembraneLayers");
            for (var i=0;i<this.simMembranes.length;i++){
                this.simMembranes[i].setBorderNodes();
                this.simMembranes[i].meshRadial(numLayers);
            }
            var numFixed = 0;
            for (var i=0;i<this.simNodes.length;i++){
                if (this.simNodes[i] && this.simNodes[i].fixed) numFixed++;
            }
            this.set("numFixed", numFixed);
            globals.set("meshingChanged", true);
            globals.threeView.render();
        },

        radialMembraneLayersChanged: function() {
            var numLayers = globals.get("radialMembraneLayers");
            if (globals.get("meshingMode") === "radialMeshing"){
                for (var i = 0; i < this.simMembranes.length; i++) {
                    this.simMembranes[i].meshRadial(numLayers);
                }
            } else {
                for (var i=0;i<this.simMembranes.length;i++){
                    if (this.simMembranes[i].getSimEdges().length != 4){
                        this.simMembranes[i].meshRadial(numLayers);
                    }
                }
            }
            globals.set("meshingChanged", true);
            globals.threeView.render();
        },

        _getNextEdge: function(lastNode, edges, orientedEdges){
            for (var j=0;j<edges.length;j++){
                var edge = edges[j];
                var nodes = edge.getNodes();
                if (nodes.indexOf(lastNode) > -1){
                    if (orientedEdges.indexOf(edge) > -1) continue;
                    return edge;
                }
            }
            console.warn("couldn't find next edge");
            return null;
        },

        reset: function(){
            globals.set("needsRemesh", true);
            var self = this;
            this.nodesContainer.children = [];
            this.beamsContainer.children = [];
            this.edgesContainer.children = [];
            this.membraneContainer.children = [];
            _.each(this.membranes, function(membrane, index){
                self._removeMembrane(membrane, index, true);
            });
            _.each(this.beams, function(beam, index){
                self._removeBeam(beam, index, true);
            });
            _.each(this.nodes, function(node, index){
                self._removeNode(node, index, true);
            });
            this.nodes = [];
            this.trigger("change:nodes");
            this.beams = [];
            this.trigger("change:beams");
            this.membranes = [];
            this.trigger("change:membranes");
        }

    }))();
}