/**
 * Created by ghassaei on 11/4/16.
 */


function SimNode(position, parent){
    Node.call(this, position, parent);
    // this.object3D.scale.set(0.7,0.7,0.7);
    var fitnessGeo = new THREE.Geometry();
    fitnessGeo.vertices = [new THREE.Vector3(), new THREE.Vector3()];
    fitnessGeo.dynamic = true;
    this.fitness = new THREE.Line(fitnessGeo, edgeMaterialPurple);
    this.fitness.visible = false;
    this.object3D.add(this.fitness);
    this.originalPosition = position.clone();
}
SimNode.prototype = Object.create(Node.prototype);

SimNode.prototype.setIsBeamNode = function(state){
    this.isBeamNode = state;
};

SimNode.prototype.setNodesIndex = function(index){
    this.nodesIndex = index;
};
SimNode.prototype.getNodesIndex = function(){
    return this.nodesIndex;
};

SimNode.prototype.setMaterial = function(material){
    this.object3D.material = material;
};

SimNode.prototype.reset = function(){
    this.move(this.originalPosition);
};

SimNode.prototype.getOriginalPosition = function(){
    return this.originalPosition.clone();
};

SimNode.prototype.setOriginalPosition = function(val, axis){
    this.originalPosition[axis] = val;
    this.setPosition(val, axis);
};

SimNode.prototype.setSimIndex = function(index){
    this.simIndex = index;
};

SimNode.prototype.getSimIndex = function(){
    return this.simIndex;
};

SimNode.prototype.removeElements = function(){
    this.edges = [];
};

SimNode.prototype.setBendingForce = function(vect, index){
    if (this.fitness.visible) return;
    if (!this.bendingForce) {
        this.bendingForce = [];
    }
    if (this.bendingForce.length-1<index) {
        for (var i=this.bendingForce.length;i<index+1;i++){
            this.bendingForce.push(new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(), 1, 0xb67df0, 0.5, 0.5));
            this.bendingForce[i].line.material.linewidth = 4;
            this.object3D.add(this.bendingForce[i]);
        }
    }
    var length = vect.length();
    this.bendingForce[index].setLength(length, 0.5, 0.5);
    this.bendingForce[index].setDirection(vect.normalize());
    this.bendingForce[index].visible = length > 0.5;
};

SimNode.prototype.hideMoments = function(){
    if (!this.bendingForce) return;
    for (var i=0;i<this.bendingForce;i++){
        this.bendingForce[i].visible = false;
    }
    this.fitness.visible = true;
};

SimNode.prototype.hideFitness = function(){
    this.fitness.visible = false;
};

SimNode.prototype.setNearestPos = function(position){
    this.fitness.geometry.vertices[1].set(position.x, position.y, position.z);
    this.fitness.geometry.verticesNeedUpdate = true;
};

SimNode.prototype.getBeamElements = function(){
    var elements = [];
    for (var i=0;i<this.edges.length;i++){
        if (this.edges[i].type == "beamElement") elements.push(this.edges[i]);
    }
    return elements;
};

SimNode.prototype.toJSON = function(){
    var position = this.originalPosition;
    return {
        position: {x:position.x, y:position.y, z:position.z}
    }
};


SimNode.prototype.destroy = function(){
    this.parent = null;
    if (this.bendingForce) this.bendingForce = null;
    this.object3D._myNode = null;
    this.fitness = null;
    this.object3D = null;
    this.edges = null;
    this.externalForce = null;
};