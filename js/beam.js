/**
 * Created by ghassaei on 11/3/16.
 */


function Beam(node, parent){
    this.nodes = [];
    this.nodes.push(node);

    this.edges = [];

    this.object3D = new THREE.Object3D();
    parent.add(this.object3D);

    this.edgeInProgress = new EdgeBuilding(node, node.getPosition(), this.object3D);
}

Beam.prototype.setEnd = function(end){
    this.edgeInProgress.setEnd(end);
};

Beam.prototype.addNode = function(node){
    if (!this.edgeInProgress) {
        console.warn("this shouldn't happen");
        return;
    }
    if (this.edgeInProgress.shouldBuildEdge(node)){
        this.nodes.push(node);
        this.edges.push(new Edge([this.edgeInProgress.getNode(), node], this.object3D));
        this.edgeInProgress.setNode(node);
    }

};

Beam.prototype.stopEditing = function(){
    this.edgeInProgress.hide();
};


Beam.prototype.destroy = function(){
    this.nodes = null;
};