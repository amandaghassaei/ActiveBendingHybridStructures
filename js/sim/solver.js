/**
 * Created by ghassaei on 11/9/16.
 */

function initSolver(globals){

    var listener = _.extend({}, Backbone.Events);
    listener.listenTo(globals, "change:mode", function(){
        var mode = globals.get("mode");
        if (mode != "simulation" && mode != "optSetup"){
            pause();
            if (allNodes){//if we've inited at least once
                reset(globals.previous("mode") !== "simulation" && globals.previous("mode") !== "optSetup");
                globals.threeView.render();
            }
        }
        if ((mode === "simulation" || mode == "optSetup" || mode == "optimization") && globals.get("simNeedsSetup")){
            setup();
        }
    });
    listener.listenTo(globals, "change:simE", function(){
        var E = globals.get("simE");
        EI = E*I;
        EA = E*A;
        updateBeamDamping();
        calcDT();
    });
    listener.listenTo(globals, "change:simI", function(){
        var I = globals.get("simI");
        EI = E*I;
        updateBeamDamping();
        calcDT();
    });
    listener.listenTo(globals, "change:simA", function(){
        var A = globals.get("simA");
        EA = E*A;
        updateBeamDamping();
        calcDT();
    });
    listener.listenTo(globals, "change:simDt", function(){
        dt = globals.get("simDt");
    });

    function calcDT(){
        if (!allEdges) {
            dt = globals.get("simDt");
            return;
        }
        var _dt = 1/(2*Math.PI*Math.sqrt(globals.get("simMembraneFD")));
        var edgeDt;
        for (var i=0;i<allEdges.length;i++){
            var length = edgeMeta2[i*4];
            if (EA>EI) edgeDt = 1/(2*Math.PI*Math.sqrt(EA/length));
            else edgeDt = 1/(2*Math.PI*Math.sqrt(EI/length));
            if (edgeDt<_dt) _dt = edgeDt;
        }
        dt = _dt/2;
        globals.set("simDt", dt, {silent:true});
        $("#simDt").val(dt.toFixed(10));
    }

    var E = globals.get("simE");
    var I = globals.get("simI");
    var A = globals.get("simA");
    var EI = E*I;
    var EA = E*A;
    var dt = globals.get("simDt");
    calcDT();

    var structure = globals.structure;

    var allNodes, numNodes, allEdges, allMembranes, numConnections, numInnerNodes, maxMembraneBoundaryNodes;

    var position, velocity, membraneForces, externalForces, nodeMeta;//numNodes - nodeMeta = {fixed, numEdges/2, edgesMappingStart, momentStart}
    var moment, momentMeta;//numConnections/2 - momentMeta = {nodeIndex, neighb1index, neighb2index}
    var edgeForces, edgeMeta, edgeMeta2;//numConnections - edgeMeta = {node1index, node2index, moment1index, moment2index}, edgeMeta2 = {edgeLength, damping}
    var edgeMapping;//groups of two, {pointer to edges array, sign}

    var membraneForcesMeta;//numNodes = {startIndex, num}
    var membraneMapping;//numEdgeNodes * numMembrane
    var membranePositions;//inner nodes, all membranes
    var membraneMetaArray, membraneSolveArray;//innerNodes x maxBoundaryNodes - static matrix val, pointer to nodes array - num edge membrane nodes

    var lastKineticEnergy, solved;

    function setExternalForces(){

    }

    function setup(){

        globals.set("simNeedsReset", false);
        globals.set("simNeedsSetup", false);

        lastKineticEnergy = -1;
        solved = false;

        var nodes = structure.simNodes;
        var beams = structure.simBeams;

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
        allMembranes = structure.simMembranes;

        position = new Float32Array(numNodes*4);
        velocity = new Float32Array(numNodes*4);
        externalForces = new Float32Array(numNodes*4);
        membraneForces = new Float32Array(numNodes*4);
        nodeMeta = new Uint16Array(numNodes*4);//nodeMeta = {fixed, numEdges/2, momentStart, edgesMappingStart}
        for (var i=0;i<numNodes;i++){
            nodeMeta[i*4] = 1;//set all fixed by default
        }

        for (var i=0;i<beams.length;i++){
            beams[i].setSimIndex(i);//all edges in beam know they are connected through node
        }

        updateNodePositions();
        updateFixedNodes();

        var _numConnections = 0;
        var _numEdgeMappingGroups = 0;
        var _momentIndex = 0;
        var orderedEdges = [];
        for (var i=0;i<numNodes;i++) {

            if (allNodes[i] === null){//free nodes not connected to anything
                orderedEdges.push([]);
                continue;
            }

            var node = allNodes[i];
            var rgbaIndex = i * 4;

            var nodeEdges = node.getEdges();
            var nodeEdgesOrdered = [];
            for (var j = 0; j < nodeEdges.length; j++) {
                var edge = nodeEdges[j];
                if (edge.type === "beamElement") {
                    nodeEdgesOrdered.push(edge);
                }
            }

            var nodeEdgesOrderedByBeam = {};
            for (var j=0;j<nodeEdgesOrdered.length;j++){
                var beamIndex = nodeEdgesOrdered[j].getSimBeamIndex();
                if (nodeEdgesOrderedByBeam[beamIndex] === undefined) nodeEdgesOrderedByBeam[beamIndex] = [];
                nodeEdgesOrderedByBeam[beamIndex].push(nodeEdgesOrdered[j]);
            }
            for (var j=0;j<_.keys(nodeEdgesOrderedByBeam).length;j++){
                _.sortBy(nodeEdgesOrderedByBeam[j], function (edge) {
                    return edge.getSimEdgeIndex();
                });
            }

            nodeEdgesOrdered = [];
            for (var j=0;j<structure.beams.length;j++){
                if (nodeEdgesOrderedByBeam[j]){
                    var edges = nodeEdgesOrderedByBeam[j];
                    if (structure.beams[j].closedLoop){
                        var lastEdge = edges[edges.length-1];
                        edges.splice(edges.length-1, 1);
                        edges.unshift(lastEdge);//add to front
                    }
                    nodeEdgesOrdered = nodeEdgesOrdered.concat(edges);
                }
            }

            _numEdgeMappingGroups += Math.ceil((nodeEdgesOrdered.length*2)/4);

            for (var j=0;j<nodeEdgesOrdered.length/2;j++) {
                var beam = structure.beams[nodeEdgesOrdered[2*j].getSimBeamIndex()];
                if (nodeEdgesOrdered.length-2<2*j || !(nodeEdgesOrdered[2*j].isConnected(nodeEdgesOrdered[2*j+1], beam.closedLoop, beam.edges.length-1))) {
                    if (nodeEdgesOrdered.length>2*j+1) nodeEdgesOrdered.splice(2 * j + 1, 0, null);
                    else nodeEdgesOrdered.push(null);
                }
            }
            orderedEdges.push(nodeEdgesOrdered);
            nodeMeta[rgbaIndex+1] = nodeEdgesOrdered.length/2;
            nodeMeta[rgbaIndex+2] = _momentIndex;
            _momentIndex += nodeEdgesOrdered.length/2;
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
            // edgeMeta2[rgbaIndex] = edge.getSimLength();//updateBeamLengths
            // edgeMeta2[rgbaIndex+1] = edge.getDampingConstant(EA, EI);
        }
        updateBeamDamping();
        updateBeamLengths();

        //numConnections/2 * 4
        moment = new Float32Array(numConnections*2);
        momentMeta = new Int16Array(numConnections*2);// momentMeta = {nodeIndex, neighb1index, neighb2index}

        var momentMetaIndex = 0;
        for (var i=0;i<numNodes;i++){

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

        edgeMapping = new Int16Array(_numEdgeMappingGroups*4); // {edgeIndex, sign}

        var edgeMappingIndex = 0;
        for (var i=0;i<numNodes;i++){

            var rgbaIndex = i * 4;
            var node = allNodes[i];
            if (node === null) continue;

            nodeMeta[rgbaIndex+3] = edgeMappingIndex;

            var nodeEdgesOrdered = orderedEdges[i];
            var index = 0;
            for (var j=0;j<nodeEdgesOrdered.length;j++){
                var edge = nodeEdgesOrdered[j];
                if (edge === null) continue;

                edgeMapping[edgeMappingIndex*4 + index*2] = edge.getSimIndex();
                var sign = edge.nodes[0] == node ? -1 : 1;
                edgeMapping[edgeMappingIndex*4 + index*2 + 1] = sign;
                index++;
            }
            edgeMappingIndex += Math.ceil(index*2/4);
        }

        membraneForcesMeta = new Int16Array(numNodes*4);
        var allMembraneConnections = {};
        for (var i=0;i<numNodes;i++){
            membraneForcesMeta[i*4] = -1;//no membrane by default
        }
        var _maxMembraneBoundaryNodes = 0;
        var _numInnerNodes = 0;
        var allInnerNodes = [];
        for (var i=0;i<allMembranes.length;i++){
            var membrane = allMembranes[i];
            _numInnerNodes += membrane.innerNodes.length;
            allInnerNodes = allInnerNodes.concat(membrane.innerNodes);
            if (membrane.borderNodes.length>_maxMembraneBoundaryNodes) _maxMembraneBoundaryNodes = membrane.borderNodes.length;
        }
        for (var i=0;i<allMembranes.length;i++){
            var membrane = allMembranes[i];
            for (var j=0;j<membrane.borderNodes.length;j++){
                var borderNode = membrane.borderNodes[j];
                var nodesIndex = allNodes.indexOf(borderNode);
                if (nodesIndex<0){
                    console.warn("not found in nodes array");
                }
                if (allMembraneConnections[nodesIndex]) continue;
                allMembraneConnections[nodesIndex] = [];
                //connecting node index in membranePositions array
                for (var k=0;k<borderNode.edges.length;k++){
                    if (borderNode.edges[k].type == "tensionEdge"){
                        var otherNode = borderNode.edges[k].getOtherNode(borderNode);
                        var otherNodeIndex = allInnerNodes.indexOf(otherNode);
                        if (otherNodeIndex<0){
                            console.warn("not found in nodes array");
                        }
                        allMembraneConnections[nodesIndex].push(otherNodeIndex);
                    }
                }

            }
        }
        numInnerNodes = _numInnerNodes;
        maxMembraneBoundaryNodes = _maxMembraneBoundaryNodes;

        var allMembraneConnectionsLength = 0;
        _.each(allMembraneConnections, function(data){
            allMembraneConnectionsLength += Math.ceil(data.length/4);
        });
        membraneMapping = new Int16Array(allMembraneConnectionsLength*4);
        for (var i=0;i<allMembraneConnectionsLength*4;i++){
            membraneMapping[i] = -1;
        }

        var allMembraneConnectionsKeys = _.keys(allMembraneConnections);
        var membraneMappingIndex = 0;
        for (var i=0;i<allMembraneConnectionsKeys.length;i++){
            var key = allMembraneConnectionsKeys[i];
            var data = allMembraneConnections[key];
            for (var j=0;j<data.length;j++){
                membraneMapping[membraneMappingIndex*4 + j] = data[j];
            }
            membraneForcesMeta[key*4] = membraneMappingIndex;
            membraneForcesMeta[key*4+1] = data.length;
            membraneMappingIndex += Math.ceil(data.length/4);
        }

        membranePositions = new Float32Array(numInnerNodes*4);
        membraneMetaArray = new Float32Array(numInnerNodes*maxMembraneBoundaryNodes*4);
        membraneSolveArray = new Float32Array(numInnerNodes*maxMembraneBoundaryNodes*4);
        var rgbaIndex = 0;
        var membraneSolveIndex = 0;
        for (var i=0;i<allMembranes.length;i++){
            var staticMatrix = allMembranes[i].inv_Ctrans_Q_C_Ctrans_Q_Cf;
            var boundaryNodes = allMembranes[i].borderNodes;
            for (var j=0;j<staticMatrix.length;j++){//inner nodes
                for (var k=0;k<maxMembraneBoundaryNodes;k++){//boundary nodes
                    membraneMetaArray[membraneSolveIndex+1] = -1;
                    if (k<staticMatrix[j].length){
                        membraneMetaArray[membraneSolveIndex] = -staticMatrix[j][k];
                        var boundaryNodeIndex = allNodes.indexOf(boundaryNodes[k]);
                        if (boundaryNodeIndex < 0) {
                            console.warn("node index not found");
                        }
                        membraneMetaArray[membraneSolveIndex + 1] = boundaryNodeIndex;//position in nodes array
                    }
                    membraneSolveIndex += 4;
                }
            }
            for (var j=0;j<allMembranes[i].innerNodes.length;j++){
                var innerNodePosition = allMembranes[i].innerNodes[j].getPosition();
                membranePositions[rgbaIndex] = innerNodePosition.x;
                membranePositions[rgbaIndex+1] = innerNodePosition.y;
                membranePositions[rgbaIndex+2] = innerNodePosition.z;
                rgbaIndex += 4;
            }
        }

        render();
        calcDT();
    }

    function updateNodePositions(){
        for (var i=0;i<numNodes;i++){
            var node = allNodes[i];
            if (node === null) continue;//free nodes not connected to anything
            var nodePosition = node.getOriginalPosition();
            var rgbaIndex = i * 4;
            position[rgbaIndex] = nodePosition.x;
            position[rgbaIndex + 1] = nodePosition.y;
            position[rgbaIndex + 2] = nodePosition.z;
        }
    }

    function updateFixedNodes(){
        for (var i=0;i<numNodes;i++){
            var node = allNodes[i];
            if (node === null) continue;//free nodes not connected to anything
            var rgbaIndex = i * 4;
            nodeMeta[rgbaIndex] = node.fixed ? 1 : 0;
        }
    }

    function updateBeamDamping(){
        if (!allEdges) return;
        for (var i=0;i<allEdges.length;i++){
            var rgbaIndex = i*4;
            edgeMeta2[rgbaIndex+1] = allEdges[i].getDampingConstant(EA, EI);
        }
    }

    function updateBeamLengths(){
        for (var i=0;i<allEdges.length;i++){
            var rgbaIndex = i*4;
            edgeMeta2[rgbaIndex] = allEdges[i].getSimLength();
        }
    }

    function reset(noRender){

        globals.set("simNeedsReset", false);
        $("#kineticEnergy").html("0");

        position = new Float32Array(numNodes*4);
        velocity = new Float32Array(numNodes*4);
        membraneForces = new Float32Array(numNodes*4);
        membranePositions = new Float32Array(numInnerNodes*4);

        edgeForces = new Float32Array(allEdges.length*4);
        moment = new Float32Array(numConnections*2);

        for (var i=0;i<numNodes;i++) {
            var node = allNodes[i];
            if (node === null) continue;//free nodes not connected to anything
            var nodePosition = node.getOriginalPosition();
            var rgbaIndex = i * 4;
            position[rgbaIndex] = nodePosition.x;
            position[rgbaIndex + 1] = nodePosition.y;
            position[rgbaIndex + 2] = nodePosition.z;
        }

        _updateMembranes();

        solved = false;
        lastKineticEnergy = -1;

        if (!noRender || noRender === undefined) render();
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

    function _calcForcesViscous(){
        for (var i=0;i<allEdges.length;i++) {

            var rgbaIndex = i * 4;
            var _edgeMeta = [edgeMeta[rgbaIndex], edgeMeta[rgbaIndex+1], edgeMeta[rgbaIndex+2], edgeMeta[rgbaIndex+3]];
            var _edgeMeta2 = [edgeMeta2[rgbaIndex], edgeMeta2[rgbaIndex+1], edgeMeta2[rgbaIndex+2], edgeMeta2[rgbaIndex+3]];

            var node1Index = _edgeMeta[0]*4;
            var node1Position = new THREE.Vector3(position[node1Index], position[node1Index+1], position[node1Index+2]);
            var node1Velocity = new THREE.Vector3(velocity[node1Index], velocity[node1Index+1], velocity[node1Index+2]);
            var node1MomentIndex = _edgeMeta[2]*4;
            var node1Moment = new THREE.Vector3(moment[node1MomentIndex], moment[node1MomentIndex+1], moment[node1MomentIndex+2]);

            var node2Index = _edgeMeta[1]*4;
            var node2Position = new THREE.Vector3(position[node2Index], position[node2Index+1], position[node2Index+2]);
            var node2Velocity = new THREE.Vector3(velocity[node2Index], velocity[node2Index+1], velocity[node2Index+2]);
            var node2MomentIndex = _edgeMeta[3]*4;
            var node2Moment = new THREE.Vector3(moment[node2MomentIndex], moment[node2MomentIndex+1], moment[node2MomentIndex+2]);

            var posDiff = node1Position.sub(node2Position);
            var velDiff = node1Velocity.sub(node2Velocity);
            var dist = posDiff.length();

            var edgeForce = posDiff.normalize().multiplyScalar(EA/_edgeMeta2[0]*(dist-_edgeMeta2[0]));
            edgeForce.add(node2Moment.clone().sub(node1Moment).multiplyScalar(1/dist));
            edgeForce.add(velDiff.multiplyScalar(_edgeMeta2[1]));

            edgeForces[rgbaIndex] = edgeForce.x;
            edgeForces[rgbaIndex+1] = edgeForce.y;
            edgeForces[rgbaIndex+2] = edgeForce.z;
            //edgeForces[rgbaIndex+3] = ((dist-_edgeMeta2[0])/dist);
        }
    }

    function _calcForcesKE(){
        for (var i=0;i<allEdges.length;i++) {

            var rgbaIndex = i * 4;
            var _edgeMeta = [edgeMeta[rgbaIndex], edgeMeta[rgbaIndex+1], edgeMeta[rgbaIndex+2], edgeMeta[rgbaIndex+3]];
            var _edgeMeta2 = [edgeMeta2[rgbaIndex], edgeMeta2[rgbaIndex+1], edgeMeta2[rgbaIndex+2], edgeMeta2[rgbaIndex+3]];

            var node1Index = _edgeMeta[0]*4;
            var node1Position = new THREE.Vector3(position[node1Index], position[node1Index+1], position[node1Index+2]);
            var node1MomentIndex = _edgeMeta[2]*4;
            var node1Moment = new THREE.Vector3(moment[node1MomentIndex], moment[node1MomentIndex+1], moment[node1MomentIndex+2]);

            var node2Index = _edgeMeta[1]*4;
            var node2Position = new THREE.Vector3(position[node2Index], position[node2Index+1], position[node2Index+2]);
            var node2MomentIndex = _edgeMeta[3]*4;
            var node2Moment = new THREE.Vector3(moment[node2MomentIndex], moment[node2MomentIndex+1], moment[node2MomentIndex+2]);

            var posDiff = node1Position.sub(node2Position);
            var dist = posDiff.length();

            var edgeForce = posDiff.normalize().multiplyScalar(EA/_edgeMeta2[0]*(dist-_edgeMeta2[0]));
            edgeForce.add(node2Moment.clone().sub(node1Moment).multiplyScalar(1/dist));

            edgeForces[rgbaIndex] = edgeForce.x;
            edgeForces[rgbaIndex+1] = edgeForce.y;
            edgeForces[rgbaIndex+2] = edgeForce.z;
            //edgeForces[rgbaIndex+3] = ((dist-_edgeMeta2[0])/dist);
        }
    }

    function _calcPosition(){
        for (var i=0;i<numNodes;i++) {

            var rgbaIndex = i * 4;

            var nodePosition = new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]);
            var _nodeMeta = [nodeMeta[rgbaIndex], nodeMeta[rgbaIndex+1], nodeMeta[rgbaIndex+2], nodeMeta[rgbaIndex+3]];//fixed, numBeams, neighborStartIndex, momentStartIndex
            if (_nodeMeta[0] == 1) {//fixed
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

            var _nodeMeta = [nodeMeta[rgbaIndex], nodeMeta[rgbaIndex+1], nodeMeta[rgbaIndex+2], nodeMeta[rgbaIndex+3]];
            if (_nodeMeta[0] == 1) {//fixed
                velocity[rgbaIndex] = 0;
                velocity[rgbaIndex+1] = 0;
                velocity[rgbaIndex+2] = 0;
                velocity[rgbaIndex+3] = 0;
                continue;
            }

            var forceSum = new THREE.Vector3(externalForces[rgbaIndex], externalForces[rgbaIndex+1], externalForces[rgbaIndex+2]);
            forceSum.add(new THREE.Vector3(membraneForces[rgbaIndex], membraneForces[rgbaIndex+1], membraneForces[rgbaIndex+2]));
            var edgeStartIndex = _nodeMeta[3];
            for (var j=0;j<_nodeMeta[1]*2;j++){
                //contribution from each beam el
                var edgeIndex = edgeMapping[edgeStartIndex*4 + 2*j];
                var edgeSign = edgeMapping[edgeStartIndex*4 + 2*j + 1];
                var edgeForce = new THREE.Vector3(edgeForces[edgeIndex*4], edgeForces[edgeIndex*4+1], edgeForces[edgeIndex*4+2]);
                forceSum.add(edgeForce.multiplyScalar(edgeSign));
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

    function _updateMembranes(){

        for (var i=0;i<numInnerNodes;i++){
            for (var j=0;j<maxMembraneBoundaryNodes;j++){
                var rgbaIndex = (i*maxMembraneBoundaryNodes+j)*4;
                var membraneMeta = [membraneMetaArray[rgbaIndex], membraneMetaArray[rgbaIndex+1]];
                if (membraneMeta[1]<0) continue;
                var nodeIndex = membraneMeta[1]*4;
                var membPosition = (new THREE.Vector3(position[nodeIndex], position[nodeIndex+1], position[nodeIndex+2])).multiplyScalar(membraneMeta[0]);
                membraneSolveArray[rgbaIndex] = membPosition.x;
                membraneSolveArray[rgbaIndex+1] = membPosition.y;
                membraneSolveArray[rgbaIndex+2] = membPosition.z;
            }
        }

        for (var i=0;i<numInnerNodes;i++){
            var val = new THREE.Vector3(0,0,0);
            for (var j=0;j<maxMembraneBoundaryNodes;j++) {
                var rgbaIndex = (i * maxMembraneBoundaryNodes + j) * 4;
                var membraneMeta = [membraneMetaArray[rgbaIndex], membraneMetaArray[rgbaIndex + 1]];
                if (membraneMeta[1] < 0) break;
                val.add(new THREE.Vector3(membraneSolveArray[rgbaIndex], membraneSolveArray[rgbaIndex + 1], membraneSolveArray[rgbaIndex + 2]));
            }
            membranePositions[4*i] = val.x;
            membranePositions[4*i+1] = val.y;
            membranePositions[4*i+2] = val.z;
        }

        var forceDensity = globals.get("simMembraneFD");
        for (var i=0;i<numNodes;i++){
            var rgbaIndex = i*4;
            var forcesLookup = [membraneForcesMeta[rgbaIndex], membraneForcesMeta[rgbaIndex+1]];//start, length
            if (forcesLookup[0]<0) {
                membraneForces[rgbaIndex] = 0;
                membraneForces[rgbaIndex+1] = 0;
                membraneForces[rgbaIndex+2] = 0;
                continue;
            }
            var force = new THREE.Vector3(0,0,0);
            var nodePosition = new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]);
            for (var j=0;j<forcesLookup[1];j++){
                var membNodeIndex = 4*membraneMapping[forcesLookup[0]*4 + j];
                var membNodePosition = new THREE.Vector3(membranePositions[membNodeIndex], membranePositions[membNodeIndex+1], membranePositions[membNodeIndex+2]);
                force.add((membNodePosition.sub(nodePosition)).multiplyScalar(forceDensity));
            }
            membraneForces[rgbaIndex] = force.x;
            membraneForces[rgbaIndex+1] = force.y;
            membraneForces[rgbaIndex+2] = force.z;
        }
    }

    function _stepViscous(){
        _calcMoment();
        _calcForcesViscous();
        _calcVelocity();

        var kineticEnergy = 0;
        for (var i=0;i<numNodes;i++) {
            var rgbaIndex = i * 4;
            kineticEnergy += velocity[rgbaIndex+3];
        }
        $("#kineticEnergy").html(kineticEnergy.toFixed(12));
        if (kineticEnergy < globals.get("kineticDampingTolerance")) solved = true;

        _calcPosition();
        _updateMembranes();
    }

    function _stepKE(){

        _calcMoment();
        _calcForcesKE();
        _calcVelocity();

        var kineticEnergy = 0;
        for (var i=0;i<numNodes;i++) {
            var rgbaIndex = i * 4;
            kineticEnergy += velocity[rgbaIndex+3];
        }
        $("#kineticEnergy").html(kineticEnergy.toFixed(12));
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

        _calcPosition();
        _updateMembranes();
    }

    function staticSolve(noPause){
        if (!noPause) pause();
        solved = false;
        var numIter = 0;
        if (globals.get("dampingType") == "kinetic"){
            while (solved == false) {
                _stepKE();
                if (numIter++>100000) {
                    console.warn("num iter");
                    solved = true;
                }
            }
        } else {
            while (solved == false) {
                _stepViscous();
                if (numIter++>100000) {
                    console.warn("num iter");
                    solved = true;
                }
            }
        }
        render();
        printDataOut();
    }

    function printDataOut(){
        var points = [];
        var startingNode = globals.structure.simNodes[0];
        var position = startingNode.getPosition();
        points.push([position.x, position.y, position.z]);
        var lastNode = startingNode;
        var lastEdge = startingNode.edges[1];
        var finished = false;
        while(!finished){
            var edge = lastNode.edges[0];
            if (edge == lastEdge) edge = lastNode.edges[1];
            var node = edge.getOtherNode(lastNode);
            var position = node.getPosition();
            points.push([position.x, position.y, position.z]);
            if (node == startingNode) finished = true;
            lastNode = node;
            lastEdge = edge;
        }
        var rearrange = [[], []];
        for (var i=0;i<points.length;i++){
            rearrange[0].push(points[i][0]);
            rearrange[1].push(points[i][2]);
        }
        console.log(JSON.stringify(rearrange));
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

        for (var i=0;i<numNodes;i++){

            var rgbaIndex = i * 4;
            var node = allNodes[i];
            if (node === null) continue;

            var numBeams = nodeMeta[rgbaIndex+1];
            var momentIndex = nodeMeta[rgbaIndex+2];
            for (var j=0;j<numBeams;j++){
                var index = 4*(momentIndex+j);
                var nodeMoment = new THREE.Vector3(moment[index], moment[index+1], moment[index+2]);
                allNodes[i].setBendingForce(nodeMoment.multiplyScalar(10/EI), j);
            }
            allNodes[i].move(new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]));
        }

        //var data = [];
        //for (var i=0;i<allEdges.length;i++){
        //    data.push(edgeForces[i*4+3]);
        //}
        //var max = _.max(data);
        //var min = _.min(data);

        for (var i=0;i<allEdges.length;i++){
            //allEdges[i].setHSLColor(data[i], max, min);
            allEdges[i].update();
        }
        var rgbaIndex = 0;
        for (var j=0;j<allMembranes.length;j++){
            for (var i=0;i<allMembranes[j].innerNodes.length;i++){
                var nodePosition = new THREE.Vector3(membranePositions[rgbaIndex], membranePositions[rgbaIndex+1], membranePositions[rgbaIndex+2]);
                allMembranes[j].innerNodes[i].move(nodePosition);
                rgbaIndex += 4;
            }
            for (var i=0;i<allMembranes[j].innerEdges.length;i++){
                allMembranes[j].innerEdges[i].update();
            }
        }

        globals.threeView.render();
    }

    return {
        singleStep: singleStep,
        reset: reset,
        start: start,
        pause: pause,
        staticSolve: staticSolve,
        updateBeamLengths:updateBeamLengths,
        updateNodePositions: updateNodePositions,
        updateFixedNodes: updateFixedNodes
    }
}