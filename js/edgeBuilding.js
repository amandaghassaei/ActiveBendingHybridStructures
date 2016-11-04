/**
 * Created by ghassaei on 11/1/16.
 */


var edgeMaterialLine = new THREE.LineBasicMaterial({color:0xb67df0, linewidth:4});

function EdgeBuilding(startNode, end, parent){

    this.type = "edgeBuilding";

    this.node = startNode;
    this.vertices = [startNode.getPosition(), end];

    var lineGeometry = new THREE.Geometry();
    lineGeometry.dynamic = true;
    lineGeometry.vertices = this.vertices;

    this.object3D = new THREE.Line(lineGeometry, edgeMaterialLine);
    parent.add(this.object3D);
    this.parent = parent;
    this.update();
}

EdgeBuilding.prototype.setEnd = function(end){
    this.vertices[1].set(end.x, end.y, end.z);
    this.update();
};

EdgeBuilding.prototype.setNode = function(node){
    this.node = node;
    var position = node.getPosition();
    this.vertices[0].set(position.x, position.y, position.z);
    this.vertices[1].set(position.x, position.y, position.z);
    this.update();
    this.show();
};





//render

EdgeBuilding.prototype.hide = function(){
    this.object3D.visible = false;
};
EdgeBuilding.prototype.show = function(){
    this.object3D.visible = true;
};

EdgeBuilding.prototype.update = function(){
    this.object3D.geometry.verticesNeedUpdate = true;
    this.object3D.geometry.computeBoundingSphere();
};




EdgeBuilding.prototype.shouldBuildEdge = function(otherNode){
    if (otherNode == this.node) return false;
    for (var i=0;i<this.node.edges.length;i++){
        var edge = this.node.edges[i];
        if (edge.getOtherNode(this.node) == otherNode) return false;
    }
    return true;
};

EdgeBuilding.prototype.getNode = function(){
    return this.node;
};



//deallocate

EdgeBuilding.prototype.destroy = function(){
    this.parent.remove(this.object3D);
    this.parent = null;
    this.object3D = null;
    this.node = null;
};