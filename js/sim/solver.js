/**
 * Created by ghassaei on 11/9/16.
 */

function initSolver(globals){

    var listener = _.extend({}, Backbone.Events);
    listener.listenTo(globals, "change:mode", function(){
        var mode = globals.get("mode");
        if (mode === "simulation"){
            setupSolver();
        }
    });

    var structure = globals.structure;

    var allNodes, numNodes;
    var position, edgeLengths, moment, force, velocity, externalForces, neighborIndices, meta;

    function setupSolver(){

        var nodes = structure.simNodes;
        var beams = structure.simBeams;
        var membranes = structure.simMembranes;

        var _allNodes = nodes;
        for (var i=0;i<beams.length;i++){
            _allNodes = _allNodes.concat(beams[i].getInnerNodes());
        }
        numNodes = _allNodes.length;
        for (var i=0;i<numNodes;i++){
            _allNodes[i].setSimIndex(i);
        }
        allNodes = _allNodes;

        position = new Float32Array(numNodes*4);

        moment = new Float32Array(numNodes*4);
        velocity = new Float32Array(numNodes*4);
        force = new Float32Array(numNodes*4);
        externalForces = new Float32Array(numNodes*4);
        meta = new Uint8Array(numNodes*4);//fixed, numNeighbors, neighborStartIndex

        for (var i=0;i<beams.length;i++){
            beams[i].setSimIndex(i);
        }

        var numConnections = 0;
        var orderedEdges = [];
        for (var i=0;i<numNodes;i++) {

            var node = allNodes[i];
            var nodePosition = node.getOriginalPosition();
            var rgbaIndex = i * 4;
            position[rgbaIndex] = nodePosition.x;
            position[rgbaIndex + 1] = nodePosition.y;
            position[rgbaIndex + 2] = nodePosition.z;
            meta[rgbaIndex] = node.fixed ? 1 : 0;

            var nodeEdges = node.getEdges();
            var nodeEdgesOrdered = [];
            for (var j = 0; j < nodeEdges.length; j++) {
                var edge = nodeEdges[j];
                if (edge.type === "beamElement") {
                    nodeEdgesOrdered.push(edge);
                }
            }
            _.sortBy(nodeEdgesOrdered, function (edge) {
                return edge.getSimIndex();
            });
            for (var j=0;j<nodeEdgesOrdered.length/2;j++) {
                if (nodeEdgesOrdered.length-1<j || (nodeEdgesOrdered[2*j].getSimIndex() != nodeEdgesOrdered[2*j+1].getSimIndex())) {
                    nodeEdgesOrdered.splice(2 * j + 1, 0, null);
                }
            }
            orderedEdges.push(nodeEdgesOrdered);
            numConnections += nodeEdgesOrdered.length;
        }
        neighborIndices = new Uint16Array(numConnections);
        edgeLengths = new Float32Array(numConnections);

        var edgeIndex = 0;
        for (var i=0;i<numNodes;i++) {

            var rgbaIndex = i * 4;
            var node = allNodes[i];
            var nodeEdgesOrdered = orderedEdges[i];

            for (var j=0;j<nodeEdgesOrdered.length;j++) {
                var edge = nodeEdgesOrdered[j];
                if (edge === null){
                    neighborIndices[edgeIndex+j] = -1;
                } else {
                    edgeLengths[edgeIndex+j] = edge.getSimLength();
                    neighborIndices[edgeIndex+j] = edge.getOtherNode(node).getSimIndex();
                }
            }
            meta[rgbaIndex + 1] = nodeEdgesOrdered.length/2;//num beams
            meta[rgbaIndex + 2] = edgeIndex;//start index
            edgeIndex += nodeEdgesOrdered.length;
        }

        step();
    }

    function step(){

        for (var i=0;i<numNodes;i++){

            var rgbaIndex = i*4;

            var nodeMeta = [meta[rgbaIndex], meta[rgbaIndex+1], meta[rgbaIndex+2]];

            if (nodeMeta[0] == 1) {//fixed
                moment[rgbaIndex] = 0;
                moment[rgbaIndex+1] = 0;
                moment[rgbaIndex+2] = 0;
                continue;
            }

            var nodePosition = new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]);
            var neighborMappingIndex = nodeMeta[2];
            var mVect = new THREE.Vector3();
            for (var j=0;j<nodeMeta[1];j++){
                var neighbor1Index = 4*neighborIndices[neighborMappingIndex+2*j];
                var neighbor2Index = 4*neighborIndices[neighborMappingIndex+2*j+1];

                if (neighbor1Index<0 || neighbor2Index<0){
                    //todo only one connection
                    console.warn("here");
                    continue;
                }

                var neighbor1 = new THREE.Vector3(position[neighbor1Index], position[neighbor1Index+1], position[neighbor1Index+2]);
                var neighbor2 = new THREE.Vector3(position[neighbor2Index], position[neighbor2Index+1], position[neighbor2Index+2]);
                var aVect = neighbor1.clone().sub(nodePosition);
                var bVect = neighbor2.clone().sub(nodePosition);

                var aSq = aVect.lengthSq();
                var bSq = bVect.lengthSq();
                var aCrossB = aVect.clone().cross(bVect);

                var rVect = (bVect.clone().multiplyScalar(aSq).sub(aVect.clone().multiplyScalar(bSq))).cross(aCrossB).multiplyScalar(1/(2*aCrossB.lengthSq()));
                mVect.add(rVect.clone().multiplyScalar(1/rVect.lengthSq()));
            }
            moment[rgbaIndex] = mVect.x;
            moment[rgbaIndex+1] = mVect.y;
            moment[rgbaIndex+2] = mVect.z;
        }

        //for (var i=0;i<numNodes;i++){
        //    var rgbaIndex = i*4;
        //    allNodes[i].setBendingForce(new THREE.Vector3(moment[rgbaIndex], moment[rgbaIndex+1], moment[rgbaIndex+2]));
        //}

        for (var i=0;i<numNodes;i++) {

            var rgbaIndex = i * 4;

            var nodeMeta = [meta[rgbaIndex], meta[rgbaIndex+1], meta[rgbaIndex+2]];
            if (nodeMeta[0] == 1) {//fixed
                force[rgbaIndex] = 0;
                force[rgbaIndex+1] = 0;
                force[rgbaIndex+2] = 0;
                continue;
            }

            var nodeMoment = new THREE.Vector3(moment[rgbaIndex], moment[rgbaIndex+1], moment[rgbaIndex+2]);

            var forceSum = new THREE.Vector3(externalForces[rgbaIndex], externalForces[rgbaIndex+1], externalForces[rgbaIndex+2]);
            var neighborMappingIndex = nodeMeta[2];
            for (var j=0;j<nodeMeta[1];j++){

                var neighbor1Index = 4*neighborIndices[neighborMappingIndex+2*j];
                var neighbor2Index = 4*neighborIndices[neighborMappingIndex+2*j+1];

                if (neighbor1Index<0 || neighbor2Index<0){
                    //todo only one connection
                    console.warn("here");
                    continue;
                }

                var neighbor1moment = new THREE.Vector3(moment[neighbor1Index], moment[neighbor1Index+1], moment[neighbor1Index+2]);
                var neighbor2moment = new THREE.Vector3(moment[neighbor2Index], moment[neighbor2Index+1], moment[neighbor2Index+2]);

                forceSum.add(nodeMoment.clone().sub(neighbor1moment).multiplyScalar(1/edgeLengths[neighborMappingIndex+2*j]));
                forceSum.add(nodeMoment.clone().sub(neighbor2moment).multiplyScalar(1/edgeLengths[neighborMappingIndex+2*j+1]));
            }
            force[rgbaIndex] = forceSum.x;
            force[rgbaIndex+1] = forceSum.y;
            force[rgbaIndex+2] = forceSum.z;
        }

        for (var i=0;i<numNodes;i++){
            var rgbaIndex = i*4;
            allNodes[i].setBendingForce(new THREE.Vector3(force[rgbaIndex], force[rgbaIndex+1], force[rgbaIndex+2]));
        }

        //https://learning-modules.mit.edu/service/materials/groups/144285/files/a270219e-4017-4381-90d5-dd7ecb9d9af5/link?errorRedirect=%2Fmaterials%2Findex.html

    }

    return {
        step: step
    }
}