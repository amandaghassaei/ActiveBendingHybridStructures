/**
 * Created by ghassaei on 11/3/16.
 */


function Beam(node, parent, edgeParent){
    this.nodes = [];
    this.nodes.push(node);

    this.edges = [];
    this.closedLoop = false;

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
        this.setMaterial(edgeMaterialPurple);
    }

};

Beam.prototype.getNodes = function(){
    return this.nodes;
};

Beam.prototype.getEdges = function(){
    return this.edges;
};

Beam.prototype.contains = function(edge){
    return this.edges.indexOf(edge) != -1;
};

Beam.prototype.removeEdge = function(edge, node){
    var edgeIndex = this.edges.indexOf(edge);
    var nodeIndex = this.nodes.indexOf(node);
    if (edgeIndex < 0 || nodeIndex < 0) {
        console.warn("bad index");
        return;
    }
    this.edges.splice(edgeIndex, 1);
    this.nodes.splice(nodeIndex, 1);
    edge.destroy();
};

Beam.prototype.stopEditing = function(){
    this.edgeInProgress.hide();
    this.unhighlight();
};

Beam.prototype.setMaterial = function(material){
    _.each(this.edges, function(edge){
        edge.setMaterial(material);
    });
};

Beam.prototype.highlight = function(){
    this.setMaterial(edgeMaterialPurple);
};
Beam.prototype.unhighlight = function(){
    this.setMaterial(edgeMaterialGrey);
};


Beam.prototype.isLoop = function(){
    var edges = this.getEdges();
    if (edges.length<3) return false;
    return (edges[0].nodes[0] == edges[edges.length-1].nodes[1]);
};

Beam.prototype.toJSON = function(){
    return {
        numNodes: _.uniq(this.getNodes()).length,
        numEdges: this.getEdges().length,
        isLoop: this.isLoop(),
        closedLoop: this.closedLoop
    }
};

Beam.prototype.destroy = function(clear){
    this.nodes = null;
    if (clear === undefined){
        this.parent.remove(this.object3D);
    }
    this.parent = null;
    _.each(this.edges, function(edge){
        edge.destroy(clear);
    });
    this.edgeParent = null;
    this.edges = null;
    this.edgeInProgress.destroy();
    this.edgeInProgress = null;
};