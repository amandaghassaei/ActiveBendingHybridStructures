/**
 * Created by ghassaei on 11/9/16.
 */

function initSolver(globals){

    var listener = _.extend({}, Backbone.Events);
    listener.listenTo(globals, "change:mode", function(){
        var mode = globals.get("mode");
        if (mode === "simulation"){
            reset();
        }
    });

    var structure = globals.structure;

    var allNodes, numNodes, allEdges;
    var position, edgeLengths, moment, velocity, externalForces, neighborIndices, meta;
    var lastKineticEnergy, solved;
    var dt = 0.1;
    var E = 1;
    var I = 1;
    var EI = E*I;
    var A = 1;
    var EA = E*A;

    function reset(){

        lastKineticEnergy = -1;
        solved = false;

        var nodes = structure.simNodes;
        var beams = structure.simBeams;
        var membranes = structure.simMembranes;

        var _allNodes = nodes;
        var _allEdges = [];
        for (var i=0;i<beams.length;i++){
            _allNodes = _allNodes.concat(beams[i].getInnerNodes());
            _allEdges = _allEdges.concat(beams[i].getElements());
        }
        numNodes = _allNodes.length;
        for (var i=0;i<numNodes;i++){
            _allNodes[i].setSimIndex(i);
        }
        allNodes = _allNodes;
        allEdges = _allEdges;

        position = new Float32Array(numNodes*4);

        moment = new Float32Array(numNodes*4);
        velocity = new Float32Array(numNodes*4);
        externalForces = new Float32Array(numNodes*4);
        meta = new Uint8Array(numNodes*4);//fixed, numNeighbors/2, neighborStartIndex

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
                if (nodeEdgesOrdered.length-2<j || (nodeEdgesOrdered[2*j].getSimIndex() != nodeEdgesOrdered[2*j+1].getSimIndex())) {
                    if (nodeEdgesOrdered.length>2*j+1) nodeEdgesOrdered.splice(2 * j + 1, 0, null);
                    else nodeEdgesOrdered.push(null);
                }
            }
            orderedEdges.push(nodeEdgesOrdered);
            numConnections += nodeEdgesOrdered.length;
        }
        neighborIndices = new Int16Array(numConnections);
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
                    edgeLengths[edgeIndex+j] = 0;
                } else {
                    edgeLengths[edgeIndex+j] = edge.getSimLength();
                    neighborIndices[edgeIndex+j] = edge.getOtherNode(node).getSimIndex();
                }
            }
            meta[rgbaIndex + 1] = nodeEdgesOrdered.length/2;//num beams
            meta[rgbaIndex + 2] = edgeIndex;//start index
            edgeIndex += nodeEdgesOrdered.length;
        }
        render();
    }

    function step(){
        _stepKE();
        render();
    }

    function _stepKE(){
         //calc moment
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

                //only one connection
                if (neighbor1Index<0 || neighbor2Index<0){
                    moment[rgbaIndex] = 0;
                    moment[rgbaIndex+1] = 0;
                    moment[rgbaIndex+2] = 0;
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
                mVect.add(rVect.clone().multiplyScalar(EI/rVect.lengthSq()));
            }
            moment[rgbaIndex] = mVect.x;
            moment[rgbaIndex+1] = mVect.y;
            moment[rgbaIndex+2] = mVect.z;
        }

        //kinetic damping
        var kineticEnergy = 0;
        for (var i=0;i<numNodes;i++) {
            var rgbaIndex = i * 4;
            kineticEnergy += velocity[rgbaIndex+3];
        }
        if (kineticEnergy<lastKineticEnergy){
            if (kineticEnergy < globals.get("kineticDampingTolerance")) solved = true;
            //reset velocity
            for (var i=0;i<numNodes;i++) {
                var rgbaIndex = i * 4;
                velocity[rgbaIndex] = 0;
                velocity[rgbaIndex+1] = 0;
                velocity[rgbaIndex+2] = 0;
                velocity[rgbaIndex+3] = 0;
            }
            kineticEnergy = -1;
        }
        lastKineticEnergy = kineticEnergy;

        //calc velocity
        for (var i=0;i<numNodes;i++) {

            var rgbaIndex = i * 4;

            var nodeMeta = [meta[rgbaIndex], meta[rgbaIndex+1], meta[rgbaIndex+2]];
            if (nodeMeta[0] == 1) {//fixed
                velocity[rgbaIndex] = 0;
                velocity[rgbaIndex+1] = 0;
                velocity[rgbaIndex+2] = 0;
                velocity[rgbaIndex+3] = 0;
                continue;
            }

            var nodeMoment = new THREE.Vector3(moment[rgbaIndex], moment[rgbaIndex+1], moment[rgbaIndex+2]);
            var nodePosition = new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]);

            var forceSum = new THREE.Vector3(externalForces[rgbaIndex], externalForces[rgbaIndex+1], externalForces[rgbaIndex+2]);
            var neighborMappingIndex = nodeMeta[2];
            for (var j=0;j<nodeMeta[1];j++){

                var neighbor1Index = 4*neighborIndices[neighborMappingIndex+2*j];
                var neighbor2Index = 4*neighborIndices[neighborMappingIndex+2*j+1];

                if (neighbor1Index>=0){
                    var neighbor1moment = new THREE.Vector3(moment[neighbor1Index], moment[neighbor1Index+1], moment[neighbor1Index+2]);
                    var neighbor1position = new THREE.Vector3(position[neighbor1Index], position[neighbor1Index+1], position[neighbor1Index+2]);
                    var length1 = edgeLengths[neighborMappingIndex+2*j];
                    var dist1 = neighbor1position.clone().sub(nodePosition);
                    var dist1Length = dist1.length();

                    forceSum.add(dist1.normalize().multiplyScalar(EA*(dist1Length-length1)/dist1Length));
                    forceSum.add(nodeMoment.clone().sub(neighbor1moment).multiplyScalar(1/length1));
                }
                if (neighbor2Index>=0){
                    var neighbor2moment = new THREE.Vector3(moment[neighbor2Index], moment[neighbor2Index+1], moment[neighbor2Index+2]);
                    var neighbor2position = new THREE.Vector3(position[neighbor2Index], position[neighbor2Index+1], position[neighbor2Index+2]);
                    var length2 = edgeLengths[neighborMappingIndex+2*j+1];
                    var dist2 = neighbor2position.clone().sub(nodePosition);
                    var dist2Length = dist2.length();

                    forceSum.add(dist2.normalize().multiplyScalar(EA*(dist2Length-length2)/dist2Length));
                    forceSum.add(nodeMoment.clone().sub(neighbor2moment).multiplyScalar(1/length2));
                }
            }

            var lastVelocity = new THREE.Vector3(velocity[rgbaIndex], velocity[rgbaIndex+1], velocity[rgbaIndex+2]);
            var _velocity = forceSum.multiplyScalar(dt).add(lastVelocity);
            velocity[rgbaIndex] = _velocity.x;
            velocity[rgbaIndex+1] = _velocity.y;
            velocity[rgbaIndex+2] = _velocity.z;
            var velocityMag = _velocity.length();
            velocity[rgbaIndex+3] = velocityMag*velocityMag;

        }

        //calc position
        for (var i=0;i<numNodes;i++) {

            var rgbaIndex = i * 4;

            var nodePosition = new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]);
            var nodeMeta = [meta[rgbaIndex], meta[rgbaIndex+1], meta[rgbaIndex+2]];
            if (nodeMeta[0] == 1) {//fixed
                position[rgbaIndex] = nodePosition.x;
                position[rgbaIndex+1] = nodePosition.y;
                position[rgbaIndex+2] = nodePosition.z;
                continue;
            }

            var _velocity = new THREE.Vector3(velocity[rgbaIndex], velocity[rgbaIndex+1], velocity[rgbaIndex+2]);

            var _position = _velocity.multiplyScalar(dt).add(nodePosition);
            position[rgbaIndex] = _position.x;
            position[rgbaIndex+1] = _position.y;
            position[rgbaIndex+2] = _position.z;
        }
    }

    function staticSolve(){
        solved = false;
        while (solved == false){
            _stepKE();
        }
        render();
    }

    function start(){
        globals.threeView.startAnimation(step);
    }
    function pause(){
        globals.threeView.stopAnimation();
    }

    function render(){
        for (var i=0;i<numNodes;i++){
            var rgbaIndex = i*4;
            allNodes[i].setBendingForce((new THREE.Vector3(moment[rgbaIndex], moment[rgbaIndex+1], moment[rgbaIndex+2])).multiplyScalar(10));
            allNodes[i].move(new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]));
        }
        for (var i=0;i<allEdges.length;i++){
            allEdges[i].update();
        }
        globals.threeView.render();
    }

    return {
        step: step,
        reset: reset,
        start: start,
        pause: pause,
        staticSolve: staticSolve
    }
}