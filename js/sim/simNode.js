/**
 * Created by ghassaei on 11/4/16.
 */


function SimNode(position, parent){
    Node.call(this, position, parent);
    this.object3D._myNode = null;
}
SimNode.prototype = Object.create(Node.prototype);

SimNode.prototype.setIsBeamNode = function(state){
    this.isBeamNode = state;
};

SimNode.prototype.destroy = function(){
    this.parent = null;
    this.object3D = null;
    this.edges = null;
    this.externalForce = null;
};