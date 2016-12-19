/**
 * Created by ghassaei on 11/4/16.
 */


//var simEdgeMaterial = new THREE.LineBasicMaterial({color:0xaaaaaa, linewidth:4});

function SimBeamEl(nodes, parent, parentEdge){
    Edge.call(this, nodes, parent);
    this.object3D.material = edgeMaterialGrey;//.clone();
    this.type = "beamElement";
    this.parentEdge = parentEdge;
}
SimBeamEl.prototype = Object.create(Edge.prototype);

SimBeamEl.prototype.setSimEdgeIndex = function(index){
    this.simEdgeIndex = index;
};
SimBeamEl.prototype.getSimEdgeIndex = function(){
    return this.simEdgeIndex;
};

SimBeamEl.prototype.setSimBeamIndex = function(index){
    this.simBeamIndex = index;
};

SimBeamEl.prototype.getSimBeamIndex = function(){
    return this.simBeamIndex;
};

SimBeamEl.prototype.isConnected = function(element, closedLoop, numEdges){
    if (this.getSimBeamIndex() != element.getSimBeamIndex()) return false;
    var simEdgeIndex = this.getSimEdgeIndex();
    var otherSimEdgeIndex = element.getSimEdgeIndex();
    if (Math.abs(simEdgeIndex - otherSimEdgeIndex) <= 1) return true;
    return (closedLoop && (simEdgeIndex == 0 || otherSimEdgeIndex == 0) && (simEdgeIndex == numEdges || otherSimEdgeIndex == numEdges));
};

SimBeamEl.prototype.setSimIndex = function(index){
    this.simIndex = index;
};
SimBeamEl.prototype.getSimIndex = function(){
    return this.simIndex;
};

SimBeamEl.prototype.setHSLColor = function(val, max, min){
    if (val === null){
        this.object3D.material.color.setHex(0x000000);
        return;
    }
    var scaledVal = (val - min)/(max - min) * 0.7;
    var color = new THREE.Color();
    color.setHSL(scaledVal, 1, 0.5);
    this.object3D.material.color.set(color);
};

SimBeamEl.prototype.getSimLength = function(){
    return this.parentEdge.getElLength();
};

SimBeamEl.prototype.getDampingConstant = function(EA, EI){
    if (EA<EI) return 2*Math.sqrt(EA/this.getSimLength());
    return 2*Math.sqrt(EI/this.getSimLength());
};

SimBeamEl.prototype.getCylinderGeo = function(){
    var geo = new THREE.CylinderGeometry(1, 1, 1);
    var position1 = this.nodes[0].getPosition();
    var position2 = this.nodes[1].getPosition();
    var position = position1.clone().add(position2).multiplyScalar(0.5);
    var vector = position1.clone().sub(position2);
    var rad = globals.get("stockRadius");
    geo.scale(rad, vector.length()/2, rad);

    var axis = (new THREE.Vector3(0,1,0)).cross(vector).normalize();
    var angle = Math.acos(new THREE.Vector3(0,1,0).dot(vector.normalize()));
    var quaternion = (new THREE.Quaternion()).setFromAxisAngle(axis, angle);
    geo.applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(quaternion));
    
    geo.applyMatrix(new THREE.Matrix4().makeTranslation(position.x, position.y, position.z));
    return geo;
};

SimBeamEl.prototype.destroy = function(){
    this.parent = null;
    this.parentEdge = null;
    this.object3D._myEdge = null;
    this.object3D = null;
    this.nodes = null;
    this.vertices = null;
};