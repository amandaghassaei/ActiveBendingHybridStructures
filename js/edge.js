/**
 * Created by ghassaei on 9/16/16.
 */

var edgeMaterialHighlight = new THREE.MeshBasicMaterial({color: 0xffffff});
var edgeMaterialSelected = new THREE.MeshBasicMaterial({color: 0xb67df0});
var edgeMaterialDelete = new THREE.MeshBasicMaterial({color:0xff0000});
var edgeMaterialBeamEditing = new THREE.MeshBasicMaterial({color:0xb67df0});
var edgeMaterial = new THREE.MeshBasicMaterial({color:0x555555});
var edgeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1);

function Edge(nodes, parent){

    this.type = "edge";
    nodes[0].addEdge(this);
    nodes[1].addEdge(this);
    this.nodes = nodes;

    this.object3D = new THREE.Mesh(edgeGeometry, edgeMaterialBeamEditing);
    this.object3D._myEdge = this;
    parent.add(this.object3D);
    this.parent = parent;
    this.update();
}

Edge.prototype.highlight = function(){
    if (this.object3D.material == edgeMaterialSelected) return;
    this.object3D.material = edgeMaterialHighlight;
};

Edge.prototype.unhighlight = function(){
    if (this.object3D.material == edgeMaterialSelected) return;
    this.object3D.material = edgeMaterial;
};

Edge.prototype.setMaterial = function(material){
    this.object3D.material = material;
};

Edge.prototype.getLength = function(){
    var vertex1Pos = this.nodes[0].getPosition();
    var vertex2Pos = this.nodes[1].getPosition();
    return vertex1Pos.sub(vertex2Pos).length();
};

Edge.prototype.getVector = function(fromNode){
    var toNode = this.nodes[0];
    if (this.nodes[0] == fromNode) toNode = this.nodes[1];
    return toNode.getPosition().sub(fromNode.getPosition());
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
    this.object3D.scale.y = this.getLength();
    var edgeAxis = this.nodes[0].getPosition().sub(this.nodes[1].getPosition());
    var axis = (new THREE.Vector3(0,1,0)).cross(edgeAxis).normalize();
    var angle = Math.acos(new THREE.Vector3(0,1,0).dot(edgeAxis.normalize()));
    var quaternion = (new THREE.Quaternion()).setFromAxisAngle(axis, angle);
    var position = (this.nodes[0].getPosition().add(this.nodes[1].getPosition())).multiplyScalar(0.5);
    this.object3D.position.set(position.x, position.y, position.z);
    this.object3D.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
};



//deallocate

Edge.prototype.destroy = function(){
    var self = this;
    _.each(this.nodes, function(node){
        node.removeEdge(self);
    });
    this.parent.remove(this.object3D);
    this.parent = null;
    this.object3D._myEdge = null;
    this.object3D = null;
    this.nodes = null;
};