/**
 * Created by ghassaei on 11/3/16.
 */


function Beam(node, parent, edgeParent){
    this.nodes = [];
    this.nodes.push(node);

    this.edges = [];

    this.object3D = new THREE.Object3D();
    parent.add(this.object3D);
    this.parent = parent;
    this.edgeParent = edgeParent;

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
        this.edges.push(new Edge([this.edgeInProgress.getNode(), node], this.edgeParent));
        this.edgeInProgress.setNode(node);
    }

};

Beam.prototype.stopEditing = function(){
    this.edgeInProgress.hide();
};

Beam.prototype.setMaterial = function(material){
    _.each(this.edges, function(edge){
        edge.setMaterial(material);
    });
};


Beam.prototype.destroy = function(){
    this.nodes = null;
    this.parent.remove(this.object3D);
    this.parent = null;
    _.each(this.edges, function(edge){
        edge.destroy();
    });
    this.edgeParent = null;
    this.edges = null;
    this.edgeInProgress.destroy();
    this.edgeInProgress = null;
};