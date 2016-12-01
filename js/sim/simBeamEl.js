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

SimBeamEl.prototype.isConnected = function(element){
    if (this.getSimBeamIndex() != element.getSimBeamIndex()) return false;
    // console.log(this.getSimEdgeIndex());
    // console.log(element.getSimEdgeIndex());
    // console.log("");
    if (Math.abs(this.getSimEdgeIndex() - element.getSimEdgeIndex()) <= 1) return true;
    return false;
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

SimBeamEl.prototype.destroy = function(){
    this.parent = null;
    this.parentEdge = null;
    this.object3D._myEdge = null;
    this.object3D = null;
    this.nodes = null;
    this.vertices = null;
};