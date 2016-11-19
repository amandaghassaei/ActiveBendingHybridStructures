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
    var edgeForces, edgeMeta, edgeMeta2;//numConnections - edgeMeta = {node1index, node2index, moment1index, moment2index}, edgeMeta2 = {edgeLength, damping}
    var nodeEdgeMapping;//???  groups of four

    var lastKineticEnergy, solved;
    var dt = 0.1;
    var E = 1;
    var I = 1;
    var A = 1;
    var EI = E*I;
    var EA = E*A;

    function setExternalForces(){

    }

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
        for (var i=0;i<_allEdges.length;i++){
            if (_allEdges[i]) _allEdges[i].setSimIndex(i);
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
        nodeMeta = new Uint16Array(numNodes*4);//nodeMeta = {fixed, numEdges/2, edgesMappingStart, momentStart}
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
                return edge.getBeamSimIndex();
            });

            for (var j=0;j<nodeEdgesOrdered.length/2;j++) {
                if (nodeEdgesOrdered.length-2<2*j || (nodeEdgesOrdered[2*j].getBeamSimIndex() != nodeEdgesOrdered[2*j+1].getBeamSimIndex())) {
                    if (nodeEdgesOrdered.length>2*j+1) nodeEdgesOrdered.splice(2 * j + 1, 0, null);
                    else nodeEdgesOrdered.push(null);
                }
            }
            orderedEdges.push(nodeEdgesOrdered);
            nodeMeta[rgbaIndex+1] = nodeEdgesOrdered.length/2;
            _numConnections += nodeEdgesOrdered.length;
        }
        setExternalForces();

        numConnections = _numConnections;

        //allEdges.length * 4
        edgeForces = new Float32Array(allEdges.length*4);
        edgeMeta = new Uint16Array(allEdges.length*4);//edgeMeta = {node1index, node2index, moment1index, moment2index}
        edgeMeta2 = new Float32Array(allEdges.length*4);//edgeMeta2 = {edgeLength, damping}

        for (var i=0;i<allEdges.length;i++){
            var rgbaIndex = i*4;
            var edge = allEdges[i];
            edgeMeta[rgbaIndex] = edge.nodes[0].getSimIndex();
            edgeMeta[rgbaIndex+1] = edge.nodes[1].getSimIndex();
            edgeMeta[rgbaIndex+2] = -1;
            edgeMeta[rgbaIndex+3] = -1;
            edgeMeta2[rgbaIndex] = edge.getSimLength();
            edgeMeta2[rgbaIndex+1] = edge.getDampingConstant(EA, EI);
        }

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
                else {
                    momentMeta[4*(momentMetaIndex+j)+1] = edge1.getOtherNode(node).getSimIndex();
                    var edge1Index = edge1.getSimIndex();
                    if (edgeMeta[edge1Index*4] == node.getSimIndex()){
                        edgeMeta[edge1Index*4 + 2] = momentMetaIndex+j;
                    } else if (edgeMeta[edge1Index*4+1] == node.getSimIndex()){
                        edgeMeta[edge1Index*4 + 3] = momentMetaIndex+j;
                    }
                }
                var edge2 = nodeEdgesOrdered[2*j+1];
                if (edge2 == null) momentMeta[4*(momentMetaIndex+j)+2] = -1;
                else {
                    momentMeta[4*(momentMetaIndex+j)+2] = edge2.getOtherNode(node).getSimIndex();
                    var edge2Index = edge2.getSimIndex();
                    if (edgeMeta[edge2Index*4] == node.getSimIndex()){
                        edgeMeta[edge2Index*4 + 2] = momentMetaIndex+j;
                    } else if (edgeMeta[edge2Index*4+1] == node.getSimIndex()){
                        edgeMeta[edge2Index*4 + 3] = momentMetaIndex+j;
                    }
                }
            }
            momentMetaIndex += nodeEdgesOrdered.length/2;
        }
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

    function _calcForcesKE(){
        for (var i=0;i<numConnections;i++) {

            var rgbaIndex = i * 4;
            var _edgeMeta = [edgeMeta[rgbaIndex], edgeMeta[rgbaIndex+1], edgeMeta[rgbaIndex+2], edgeMeta[rgbaIndex+3]];
            var _edgeMeta2 = [edgeMeta2[rgbaIndex], edgeMeta2[rgbaIndex+1], edgeMeta2[rgbaIndex+2], edgeMeta2[rgbaIndex+3]];

            var node1Index = _edgeMeta[0]*4;
            var node1Position = [position[node1Index], position[node1Index+1], position[node1Index+2]];
            var node1MomentIndex = _edgeMeta[3]*4;
            var node1Moment = [moment[node1MomentIndex], moment[node1MomentIndex+1], moment[node1MomentIndex+2]];

            var node2Index = _edgeMeta[1]*4;
            var node2Position = [position[node2Index], position[node2Index+1], position[node2Index+2]];
            var node2MomentIndex = _edgeMeta[4]*4;
            var node2Moment = [moment[node2MomentIndex], moment[node2MomentIndex+1], moment[node2MomentIndex+2]];

            var vector = node1Position.sub(node2Position);
            var dist = vector.length();

            var edgeForce = vector.normalize().multiplyScalar(EA*(dist-_edgeMeta2[0])/dist);
            edgeForce.add(node2Moment.clone().sub(node1Moment).multiplyScalar(1/_edgeMeta2[0]));

            edgeForces[rgbaIndex] = edgeForce.x;
            edgeForces[rgbaIndex+1] = edgeForce.y;
            edgeForces[rgbaIndex+2] = edgeForce.z;
        }
    }

    function _calcPosition(){
        for (var i=0;i<numNodes;i++) {

            var rgbaIndex = i * 4;

            var nodePosition = new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]);
            var nodeMeta = [nodeMeta[rgbaIndex], nodeMeta[rgbaIndex+1], nodeMeta[rgbaIndex+2], nodeMeta[rgbaIndex+3]];//fixed, numBeams, neighborStartIndex, momentStartIndex
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
        for (var i=0;i<numNodes;i++){

            var rgbaIndex = i*4;

            var nodeMeta = [nodeMeta[rgbaIndex], nodeMeta[rgbaIndex+1], nodeMeta[rgbaIndex+2], nodeMeta[rgbaIndex+3]];
            if (nodeMeta[0] == 1) {//fixed
                velocity[rgbaIndex] = 0;
                velocity[rgbaIndex+1] = 0;
                velocity[rgbaIndex+2] = 0;
                velocity[rgbaIndex+3] = 0;
                continue;
            }

            var forceSum = new THREE.Vector3(externalForces[rgbaIndex], externalForces[rgbaIndex+1], externalForces[rgbaIndex+2]);
            for (var j=0;j<nodeMeta[1];j++){
                //contribution form each beam el

            }

            var lastVelocity = new THREE.Vector3(velocity[rgbaIndex], velocity[rgbaIndex+1], velocity[rgbaIndex+2]);
            var _velocity = forceSum.multiplyScalar(dt).add(lastVelocity);
            velocity[rgbaIndex] = _velocity.x;
            velocity[rgbaIndex+1] = _velocity.y;
            velocity[rgbaIndex+2] = _velocity.z;
            var velocityMag = _velocity.length();
            velocity[rgbaIndex+3] = velocityMag*velocityMag;
        }
    }

    function _stepKE(){

        _calcMoment();

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

        _calcForcesKE();
        _calcVelocity();
        _calcPosition();
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