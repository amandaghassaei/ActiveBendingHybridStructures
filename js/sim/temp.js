/**
 * Created by ghassaei on 11/18/16.
 */


 function _stepViscous(){
        _calcMoment();

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
            var lastVelocity = new THREE.Vector3(velocity[rgbaIndex], velocity[rgbaIndex+1], velocity[rgbaIndex+2]);

            var forceSum = new THREE.Vector3(externalForces[rgbaIndex], externalForces[rgbaIndex+1], externalForces[rgbaIndex+2]);
            var neighborMappingIndex = nodeMeta[2];
            for (var j=0;j<nodeMeta[1];j++){

                var neighbor1Index = 4*neighborIndices[neighborMappingIndex+2*j];
                var neighbor2Index = 4*neighborIndices[neighborMappingIndex+2*j+1];

                if (neighbor1Index>=0){
                    var neighbor1moment = new THREE.Vector3(moment[neighbor1Index], moment[neighbor1Index+1], moment[neighbor1Index+2]);
                    var neighbor1position = new THREE.Vector3(position[neighbor1Index], position[neighbor1Index+1], position[neighbor1Index+2]);
                    var neighbor1velocity = new THREE.Vector3(velocity[neighbor1Index], velocity[neighbor1Index+1], velocity[neighbor1Index+2]);
                    var length1 = edgeLengths[neighborMappingIndex+2*j];
                    var dist1 = neighbor1position.clone().sub(nodePosition);
                    var dVel1 = neighbor1velocity.sub(lastVelocity);
                    var dist1Length = dist1.length();
                    var damping1 = damping[neighborMappingIndex+2*j];

                    forceSum.add(dist1.normalize().multiplyScalar(EA*(dist1Length-length1)/dist1Length));
                    forceSum.add(nodeMoment.clone().sub(neighbor1moment).multiplyScalar(1/length1));
                    forceSum.add(dVel1.multiplyScalar(damping1));
                }
                if (neighbor2Index>=0){
                    var neighbor2moment = new THREE.Vector3(moment[neighbor2Index], moment[neighbor2Index+1], moment[neighbor2Index+2]);
                    var neighbor2position = new THREE.Vector3(position[neighbor2Index], position[neighbor2Index+1], position[neighbor2Index+2]);
                    var neighbor2velocity = new THREE.Vector3(velocity[neighbor2Index], velocity[neighbor2Index+1], velocity[neighbor2Index+2]);
                    var length2 = edgeLengths[neighborMappingIndex+2*j+1];
                    var dist2 = neighbor2position.clone().sub(nodePosition);
                    var dVel2 = neighbor2velocity.sub(lastVelocity);
                    var dist2Length = dist2.length();
                    var damping2 = damping[neighborMappingIndex+2*j+1];

                    forceSum.add(dist2.normalize().multiplyScalar(EA*(dist2Length-length2)/dist2Length));
                    forceSum.add(nodeMoment.clone().sub(neighbor2moment).multiplyScalar(1/length2));
                    forceSum.add(dVel2.multiplyScalar(damping2));
                }
            }

            var _velocity = forceSum.multiplyScalar(dt).add(lastVelocity);
            velocity[rgbaIndex] = _velocity.x;
            velocity[rgbaIndex+1] = _velocity.y;
            velocity[rgbaIndex+2] = _velocity.z;
            var velocityMag = _velocity.length();
            velocity[rgbaIndex+3] = velocityMag*velocityMag;

        }
        _calcPosition();
    }



//kinetic damping


        return;
        //calc velocity
        for (var i=0;i<numNodes;i++) {

            var rgbaIndex = i * 4;

            var nodeMeta = [meta[rgbaIndex], meta[rgbaIndex+1], meta[rgbaIndex+2], meta[rgbaIndex+3]];//fixed, numBeams, neighborStartIndex, momentStartIndex
            if (nodeMeta[0] == 1) {//fixed
                velocity[rgbaIndex] = 0;
                velocity[rgbaIndex+1] = 0;
                velocity[rgbaIndex+2] = 0;
                velocity[rgbaIndex+3] = 0;
                continue;
            }

            var nodePosition = new THREE.Vector3(position[rgbaIndex], position[rgbaIndex+1], position[rgbaIndex+2]);

            var forceSum = new THREE.Vector3(externalForces[rgbaIndex], externalForces[rgbaIndex+1], externalForces[rgbaIndex+2]);
            var neighborMappingIndex = nodeMeta[2];
            for (var j=0;j<nodeMeta[1];j++){

                var nodeMoment = new THREE.Vector3(moment[4*(nodeMeta[3]+j)], moment[4*(nodeMeta[3]+j)+1], moment[4*(nodeMeta[3]+j)+2]);

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
        _calcPosition();