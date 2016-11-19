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

    var allNodes, numNodes, allEdges, numConnections;

    var position, velocity, externalForces, nodeMeta;//numNodes - nodeMeta = {fixed, numEdges/2, edgesMappingStart, momentStart}
    var moment, momentMeta;//numConnections/2 - momentMeta = {nodeIndex, neighb1index, neighb2index}
    var internalForces, edgeMeta, edgeMeta2;//numConnections - edgeMeta = {node1index, node2index, moment1index, moment2index}, edgeMeta2 = {edgeLength, damping}
    var nodeEdgeMapping;//???

    var lastKineticEnergy, solved;
    var dt = 0.1;
    var E = 1;
    var I = 1;
    var A = 1;
    var EI = E*I;
    var EA = E*A;

    function reset(){

        globals.set("simNeedsReset", false);

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
            if (_allNodes[i]) _allNodes[i].setSimIndex(i);
        }
        allNodes = _allNodes;
        allEdges = _allEdges;

        position = new Float32Array(numNodes*4);
        velocity = new Float32Array(numNodes*4);
        externalForces = new Float32Array(numNodes*4);
        nodeMeta = new Uint8Array(numNodes*4);//nodeMeta = {fixed, numEdges/2, edgesMappingStart, momentStart}
        for (var i=0;i<numNodes;i++){
            nodeMeta[i*4] = 1;//set all fixed by default
        }

        for (var i=0;i<beams.length;i++){
            beams[i].setSimIndex(i);//all edges in beam know they are connected through node
        }

        var _numConnections = 0;
        var orderedEdges = [];
        for (var i=0;i<numNodes;i++) {

            if (allNodes[i] === null){//free nodes not connected to anything
                orderedEdges.push([]);
                continue;
            }

            var node = allNodes[i];
            var nodePosition = node.getOriginalPosition();
            var rgbaIndex = i * 4;
            position[rgbaIndex] = nodePosition.x;
            position[rgbaIndex + 1] = nodePosition.y;
            position[rgbaIndex + 2] = nodePosition.z;
            //todo init externalForces
            nodeMeta[rgbaIndex] = node.fixed ? 1 : 0;

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
                if (nodeEdgesOrdered.length-2<2*j || (nodeEdgesOrdered[2*j].getSimIndex() != nodeEdgesOrdered[2*j+1].getSimIndex())) {
                    if (nodeEdgesOrdered.length>2*j+1) nodeEdgesOrdered.splice(2 * j + 1, 0, null);
                    else nodeEdgesOrdered.push(null);
                }
            }
            orderedEdges.push(nodeEdgesOrdered);
            nodeMeta[rgbaIndex+1] = nodeEdgesOrdered.length/2;
            _numConnections += nodeEdgesOrdered.length;
        }

        numConnections = _numConnections;

        //numConnections/2 * 4
        moment = new Float32Array(numConnections*2);
        momentMeta = new Int16Array(numConnections*2);// momentMeta = {nodeIndex, neighb1index, neighb2index}

        var momentMetaIndex = 0;
        for (var i=0;i<numNodes;i++){

            var rgbaIndex = i * 4;
            var node = allNodes[i];
            if (node === null) continue;

            var nodeEdgesOrdered = orderedEdges[i];
            for (var j=0;j<nodeEdgesOrdered.length/2;j++){
                momentMeta[4*(momentMetaIndex+j)] = node.getSimIndex();//middle node
                var edge1 = nodeEdgesOrdered[2*j];
                if (edge1 == null) momentMeta[4*(momentMetaIndex+j)+1] = -1;
                else momentMeta[4*(momentMetaIndex+j)+1] = edge1.getOtherNode(node).getSimIndex();
                var edge2 = nodeEdgesOrdered[2*j+1];
                if (edge2 == null) momentMeta[4*(momentMetaIndex+j)+2] = -1;
                else momentMeta[4*(momentMetaIndex+j)+2] = edge2.getOtherNode(node).getSimIndex();
            }
            momentMetaIndex += nodeEdgesOrdered.length/2;
        }

        //neighborIndices = new Int16Array(numConnections);
        //for (var i=0;i<neighborIndices.length;i++){
        //    neighborIndices[i] = -1;//set all -1 by default
        //}
        //edgeLengths = new Float32Array(numConnections);
        //damping = new Float32Array(numConnections);

        //var edgeIndex = 0;
        //var momentMetaIndex = 0;
        //for (var i=0;i<numNodes;i++) {
        //
        //    var rgbaIndex = i * 4;
        //    var node = allNodes[i];
        //    if (node === null) continue;
        //    var nodeEdgesOrdered = orderedEdges[i];
        //
        //    for (var j=0;j<nodeEdgesOrdered.length;j++) {
        //        var edge = nodeEdgesOrdered[j];
        //        if (edge === null){
        //            neighborIndices[edgeIndex+j] = -1;
        //        } else {
        //            edgeLengths[edgeIndex+j] = edge.getSimLength();
        //            neighborIndices[edgeIndex+j] = edge.getOtherNode(node).getSimIndex();
        //            damping[edgeIndex+j] = edge.getDampingConstant(EA, EI);
        //        }
        //    }
        //    meta[rgbaIndex + 1] = nodeEdgesOrdered.length/2;//num beams
        //    meta[rgbaIndex + 2] = edgeIndex;//start index
        //    meta[rgbaIndex + 3] = momentMetaIndex;//moment meta start index
        //    edgeIndex += nodeEdgesOrdered.length;
        //    momentMetaIndex += nodeEdgesOrdered.length/2;
        //}

        //momentNeighbors = new Int16Array(numConnections*2);//neighbor 1, neighbor 2 position in moment array
        //for (var i=0;i<numNodes;i++){
        //
        //    var rgbaIndex = i * 4;
        //    var node = allNodes[i];
        //    if (node === null) continue;
        //    var nodeEdgesOrdered = orderedEdges[i];
        //
        //    momentMetaIndex = meta[rgbaIndex + 3];//moment meta start index
        //
        //    for (var j=0;j<nodeEdgesOrdered.length/2;j++){
        //        var edge1 = nodeEdgesOrdered[2*j];
        //        if (edge1 == null) momentNeighbors[4*(momentMetaIndex+j)] = -1;
        //        else {
        //            var node1Index = edge1.getOtherNode(node).getSimIndex();
        //            var node1MomentMetaStart = meta[node1Index*4+3];
        //            var node1MomentOffset = 0;
        //            for (var k=0;k<orderedEdges[node1Index].length;k++){
        //                if (orderedEdges[node1Index][k] == edge1) node1MomentOffset = k;
        //            }
        //            momentNeighbors[4*(momentMetaIndex+j)] = node1MomentMetaStart+node1MomentOffset;
        //        }
        //        var edge2 = nodeEdgesOrdered[2*j+1];
        //        if (edge2 == null) momentMeta[4*(momentMetaIndex+j)+1] = -1;
        //        else {
        //            var node2Index = edge2.getOtherNode(node).getSimIndex();
        //            var node2MomentMetaStart = meta[node2Index*4+3];
        //            var node2MomentOffset = 0;
        //            for (var k=0;k<orderedEdges[node2Index].length;k++){
        //                if (orderedEdges[node2Index][k] == edge2) node2MomentOffset = k;
        //            }
        //            momentNeighbors[4*(momentMetaIndex+j)+1] = node2MomentMetaStart+node2MomentOffset;
        //        }
        //    }
        //}
        console.log(momentMeta);
        render();
    }

    function singleStep(){
        if (globals.get("dampingType") == "kinetic") {
            stepKE();
        } else {
            stepViscous();
        }
    }

    function stepKE(){
        _stepKE();
        render();
    }

    function stepViscous(){
        _stepViscous();
        render();
    }

    function _calcMoment(){
        for (var i=0;i<numConnections/2;i++){

            var rgbaIndex = i*4;
            var _momentMeta = [momentMeta[rgbaIndex], momentMeta[rgbaIndex+1], momentMeta[rgbaIndex+2]];

            var nodeIndex = _momentMeta[0]*4;
            var neighbor1Index = _momentMeta[1]*4;
            var neighbor2Index = _momentMeta[2]*4;

            //only one connection
            if (neighbor1Index<0 || neighbor2Index<0){
                moment[rgbaIndex] = 0;
                moment[rgbaIndex+1] = 0;
                moment[rgbaIndex+2] = 0;
                continue;
            }

            var nodePosition = new THREE.Vector3(position[nodeIndex], position[nodeIndex+1], position[nodeIndex+2]);

            var neighbor1Position = new THREE.Vector3(position[neighbor1Index], position[neighbor1Index+1], position[neighbor1Index+2]);
            var neighbor2Position = new THREE.Vector3(position[neighbor2Index], position[neighbor2Index+1], position[neighbor2Index+2]);
            var aVect = neighbor1Position.sub(nodePosition);
            var bVect = neighbor2Position.sub(nodePosition);

            var aSq = aVect.lengthSq();
            var bSq = bVect.lengthSq();
            var aCrossB = aVect.clone().cross(bVect);

            var rVect = (bVect.clone().multiplyScalar(aSq).sub(aVect.clone().multiplyScalar(bSq))).cross(aCrossB).multiplyScalar(1/(2*aCrossB.lengthSq()));
            var mVect = rVect.clone().multiplyScalar(EI/rVect.lengthSq());

            moment[rgbaIndex] = mVect.x;
            moment[rgbaIndex+1] = mVect.y;
            moment[rgbaIndex+2] = mVect.z;
        }
    }

    function _calcPosition(){
        for (var i=0;i<numNodes;i++) {

            var rgbaIndex = i * 4;

            var nodePosition = new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]);
            var nodeMeta = [meta[rgbaIndex], meta[rgbaIndex+1], meta[rgbaIndex+2], meta[rgbaIndex+3]];//fixed, numBeams, neighborStartIndex, momentStartIndex
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

    function _calcVelocity(){

    }

    function _stepKE(){
        _calcMoment();
        solved = true;
    }

    function staticSolve(){
        solved = false;
        while (solved == false) {
            _stepKE();
        }
        render();
    }

    function start(){
        globals.set("isAnimating", true);
        var numSteps = globals.get("numStepsPerFrame");
        if (globals.get("dampingType") == "kinetic"){
            globals.threeView.startAnimation(function(){
                for (var i=0;i<numSteps;i++){
                    _stepKE()
                }
                render();
            });
        } else {
            globals.threeView.startAnimation(function(){
                for (var i=0;i<numSteps;i++){
                    _stepViscous();
                }
                render();
            });
        }

    }
    function pause(){
        globals.threeView.stopAnimation();
        globals.set("isAnimating", false);
    }

    function render(){

        var momentIndex = 0;
        for (var i=0;i<numNodes;i++){

            var rgbaIndex = i * 4;
            var node = allNodes[i];
            if (node === null) continue;

            var numBeams = nodeMeta[rgbaIndex+1];
            for (var j=0;j<numBeams;j++){
                var index = 4*(momentIndex+j);
                var nodeMoment = new THREE.Vector3(moment[index], moment[index+1], moment[index+2]);
                allNodes[i].setBendingForce(nodeMoment.multiplyScalar(10), j);
            }
            allNodes[i].move(new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]));
            momentIndex += numBeams;
        }

        for (var i=0;i<allEdges.length;i++){
            allEdges[i].update();
        }
        globals.threeView.render();
    }

    return {
        singleStep: singleStep,
        reset: reset,
        start: start,
        pause: pause,
        staticSolve: staticSolve
    }
}