/**
 * Created by ghassaei on 9/16/16.
 */

var edgeMaterialWhite = new THREE.LineBasicMaterial({color: 0xffffff, linewidth:4});
var edgeMaterialLightPurple = new THREE.LineBasicMaterial({color: 0xdabef7, linewidth:4});
var edgeMaterialDelete = new THREE.LineBasicMaterial({color:0xff0000, linewidth:4});
var edgeMaterialGrey = new THREE.LineBasicMaterial({color:0x444444, linewidth:4});
var edgeMaterialLightGray = new THREE.LineBasicMaterial({color:0x777777, linewidth:4});
var edgeMaterialPurple = new THREE.LineBasicMaterial({color:0xb67df0, linewidth:4});

function Edge(nodes, parent){

    this.type = "edge";
    nodes[0].addEdge(this);
    nodes[1].addEdge(this);
    this.nodes = nodes;
    this.vertices = [nodes[0].getPosition(true), nodes[1].getPosition(true)];

    var lineGeometry = new THREE.Geometry();
    lineGeometry.dynamic = true;
    lineGeometry.vertices = this.vertices;

    this.object3D = new THREE.Line(lineGeometry, edgeMaterialPurple);
    this.object3D._myEdge = this;
    parent.add(this.object3D);
    this.parent = parent;
    this.update();
}

Edge.prototype.highlight = function(){
    if (this.object3D.material == edgeMaterialLightPurple) return;
    this.object3D.material = edgeMaterialWhite;
};

Edge.prototype.unhighlight = function(){
    if (this.object3D.material == edgeMaterialLightPurple) return;
    this.object3D.material = edgeMaterialGrey;
};

Edge.prototype.setMaterial = function(material){
    this.object3D.material = material;
};

Edge.prototype.getLength = function(){
    var vertex1Pos = this.nodes[0].getPosition();
    var vertex2Pos = this.nodes[1].getPosition();
    return vertex1Pos.sub(vertex2Pos).length();
};

Edge.prototype.isFixed = function(){
    return this.nodes[0].fixed && this.nodes[1].fixed;
};

Edge.prototype.getOtherNode = function(node){
    if (this.nodes[0] == node) return this.nodes[1];
    return this.nodes[0];
};

Edge.prototype.setDeleteMode = function(){
    this.object3D.material = edgeMaterialDelete;
};




//render

Edge.prototype.getObject3D = function(){
    return this.object3D;
};

Edge.prototype.getNodes = function(){
    return this.nodes;
};

Edge.prototype.update = function(){
    this.object3D.geometry.verticesNeedUpdate = true;
    this.object3D.geometry.computeBoundingSphere();
};



//deallocate

Edge.prototype.destroy = function(clear){
    var self = this;
    if (clear === undefined){
        _.each(this.nodes, function(node){
            node.removeEdge(self);
        });
        this.parent.remove(this.object3D);
    }
    this.parent = null;
    this.object3D._myEdge = null;
    this.object3D = null;
    this.nodes = null;
    this.vertices = null;
};