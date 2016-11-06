/**
 * Created by ghassaei on 11/3/16.
 */


function initStructure(globals){

    return new (Backbone.Model.extend({

        defaults: {
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

            this.numFixed = 0;

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

            initIntersector3D(globals, this);

            this.listenTo(globals, "change:mode", this.updateForMode);
            this.listenTo(globals, "change:radialMembraneLayers", this.radialMembraneLayersChanged);
            this.listenTo(globals, "change:segmentLength", this.segmentLengthChanged);
            this.listenTo(this, "change:beams change:membranes", function(){
                globals.set("needsRemesh", true);
            });
            this.updateForMode();
        },

        updateForMode: function(){
            this.currentEditingBeam = null;
            this.selectedEdges = [];
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
                });
            } else if (mode === "boundaryEditing"){
                if (globals.get("needsRemesh")) this.syncSim();
                _.each(this.simMembranes, function(membrane){
                    membrane.setEdgeMaterial(edgeMaterialGrey);
                });
            }
            this.simContainer.visible = mode === "meshing" || mode === "boundaryEditing";
            this.nodesContainer.visible = !(mode === "boundaryEditing" || mode === "meshing");
            this.beamsContainer.visible =  !(mode === "boundaryEditing" || mode === "meshing");
            this.edgesContainer.visible =  !(mode === "boundaryEditing" || mode === "meshing");
            this.membraneContainer.visible = !(mode === "boundaryEditing" || mode === "meshing") && (mode === "membraneEditing");
            globals.threeView.render();
        },

        newBeam: function(node){
            var beam = new Beam(node, this.beamsContainer, this.edgesContainer);
            this.beams.push(beam);
            this.trigger("change:beams");
            return beam;
        },
        removeBeamAtIndex: function(index){
            if (!this.beams[index]) return;
            this.beams[index].destroy();
            this.beams.splice(index, 1);
            this.trigger("change:beams");
            globals.set("needsRemesh", true);
            globals.threeView.render();
        },
        removeBeam: function(beam){
            var index = this.beams.indexOf(beam);
            if (index<0) return;
            this.removeBeamAtIndex(index);
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
                edge.setMaterial(edgeMaterialGrey);
            });
            this.selectedEdges = [];
            globals.threeView.render();
        },
        removeMembraneAtIndex: function(index){
            if (!this.membranes[index]) return;
            this.membranes[index].destroy();
            this.membranes.splice(index, 1);
            this.trigger("change:membranes");
            globals.threeView.render();
        },
        removeMembrane: function(membrane){
            var index = this.membranes.indexOf(membrane);
            if (index<0) return;
            this.removeMembraneAtIndex(index);
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

        getNumFixed: function(){
            return this.numFixed;
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
                edge.setMaterial(edgeMaterialLightPurple);
                this.selectedEdges.push(edge);
            } else {
                edge.setMaterial(edgeMaterialGrey);
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
                simNode.setIsBeamNode(true);
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
                    var nextEdge = this._getNextEdge(lastNode, simEdges, orientedEdges);
                    orientedEdges.push(nextEdge);
                    orientedNodes.push(nextEdge.getOtherNode(lastNode));
                }
                orientedNodes.pop();
                var simMembrane = new SimMembrane(orientedEdges, orientedNodes, parent);
                this.simMembranes.push(simMembrane);
            }

            var segmentLength = globals.get("segmentLength");
            for (var i=0;i<this.simBeams.length;i++){
                this.simBeams[i].mesh(segmentLength);
            }
            var numLayers = globals.get("radialMembraneLayers");
            for (var i=0;i<this.simMembranes.length;i++){
                this.simMembranes[i].setBorderNodes();
                this.simMembranes[i].mesh(numLayers);
            }

            globals.set("needsRemesh", false);
        },

        radialMembraneLayersChanged: function(){
            var numLayers = globals.get("radialMembraneLayers");
            for (var i=0;i<this.simMembranes.length;i++){
                this.simMembranes[i].mesh(numLayers);
            }
            globals.threeView.render();
        },
        segmentLengthChanged: function(){
            var segmentLength = globals.get("segmentLength");
            for (var i=0;i<this.simBeams.length;i++){
                this.simBeams[i].mesh(segmentLength);
            }
            var numLayers = globals.get("radialMembraneLayers");
            for (var i=0;i<this.simMembranes.length;i++){
                this.simMembranes[i].setBorderNodes();
                this.simMembranes[i].mesh(numLayers);
            }
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
        }

    }))();
}