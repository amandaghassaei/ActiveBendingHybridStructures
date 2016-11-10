/**
 * Created by ghassaei on 11/4/16.
 */


function SimNode(position, parent){
    Node.call(this, position, parent);
    this.object3D.scale.set(0.7,0.7,0.7);
    this.originalPosition = position.clone();
}
SimNode.prototype = Object.create(Node.prototype);

SimNode.prototype.setIsBeamNode = function(state){
    this.isBeamNode = state;
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

SimNode.prototype.setSimIndex = function(index){
    this.simIndex = index;
};

SimNode.prototype.getSimIndex = function(){
    return this.simIndex;
};

SimNode.prototype.setBendingForce = function(vect){
    if (!this.bendingForce){
        this.bendingForce = new THREE.ArrowHelper(new THREE.Vector3(1,1,1), new THREE.Vector3(), 1, 0xb67df0, 0.5, 0.5);
        this.bendingForce.line.material.linewidth = 4;
        this.object3D.add(this.bendingForce);
    }
    this.bendingForce.setDirection(vect);
    this.bendingForce.visible = vect.length() > 0.0001;
};


SimNode.prototype.destroy = function(){
    this.parent = null;
    if (this.bendingForce) this.bendingForce = null;
    this.object3D._myNode = null;
    this.object3D = null;
    this.edges = null;
    this.externalForce = null;
};