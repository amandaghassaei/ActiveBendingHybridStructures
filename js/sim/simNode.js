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

SimNode.prototype.destroy = function(){
    this.parent = null;
    this.object3D._myNode = null;
    this.object3D = null;
    this.edges = null;
    this.externalForce = null;
};