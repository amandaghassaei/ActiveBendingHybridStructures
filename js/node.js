/**
 * Created by ghassaei on 9/16/16.
 */

var nodeMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
var nodeMaterialFixed = new THREE.MeshBasicMaterial({color: 0x000000});
var nodeMaterialDelete = new THREE.MeshBasicMaterial({color: 0xff0000});
var nodeMaterialHighlight = new THREE.MeshBasicMaterial({color: 0xffffff});
var nodeGeo = new THREE.SphereGeometry(0.2);
var nodeFixedGeo = new THREE.CubeGeometry(0.5, 0.5, 0.5);


function Node(position, parent){

    this.type = "node";

    this.object3D = new THREE.Mesh(nodeGeo, nodeMaterial);
    this.object3D._myNode = this;
    parent.add(this.object3D);
    this.parent = parent;

    this.edges = [];
    this.externalForce = null;
    this.setFixed(false);

    this.move(position);
}


Node.prototype.setFixed = function(fixed){
    this.fixed = fixed;
    if (fixed) {
        this.object3D.material = nodeMaterialFixed;
        this.object3D.geometry = nodeFixedGeo;
    }
    else {
        this.object3D.material = nodeMaterial;
        this.object3D.geometry = nodeGeo;
    }
    if (this.externalForce){
        if (fixed) this.externalForce.hide();
        else this.externalForce.show();
    }
};




//forces

Node.prototype.addExternalForce = function(force){
    this.externalForce = force;
    force.setNode(this);
    force.setOrigin(this.getPosition());
    if (this.fixed) force.hide();
};

Node.prototype.removeExternalForce = function(){
    this.externalForce = null;
};

Node.prototype.getExternalForce = function(){
    if (this.externalForce) return this.externalForce.getForce();
    return new THREE.Vector3(0,0,0);
};





//edges

Node.prototype.addEdge = function(edge){
    this.edges.push(edge);
};

Node.prototype.removeEdge = function(edge){
    if (this.edges === null) return;
    var index = this.edges.indexOf(edge);
    if (index>=0) this.edges.splice(index, 1);
    if (this.edges.length == 0) globals.removeNode(this);
};

Node.prototype.getEdges = function(){
    return this.edges;
};





Node.prototype.getObject3D = function(){
    return this.object3D;
};

Node.prototype.setDeleteMode = function(){
    this.object3D.material = nodeMaterialDelete;
};

Node.prototype.highlight = function(){
    this.object3D.material = nodeMaterialHighlight;
};

Node.prototype.unhighlight = function(){
    if (this.fixed) {
        this.object3D.material = nodeMaterialFixed;
    }
    else {
        this.object3D.material = nodeMaterial;
    }
};

Node.prototype.hide = function(){
    this.object3D.visible = false;
};
Node.prototype.show = function(){
    this.object3D.visible = true;
};
Node.prototype.isVisible = function(){
    return this.object3D.visible;
};

Node.prototype.move = function(position){
    this.object3D.position.set(position.x, position.y, position.z);
    _.each(this.edges, function(edge){
        edge.update();
    });
    if (this.externalForce) this.externalForce.setOrigin(position.clone());
};

Node.prototype.getPosition = function(){
    return this.object3D.position.clone();
};





//deallocate

Node.prototype.destroy = function(){
    this.parent.remove(this.object3D);
    this.parent = null;
    this.object3D._myNode = null;
    this.object3D = null;
    for (var i=this.edges.length-1;i>=0;i--){
        var edge = this.edges[i];
        edge.destroy()
    }
    this.edges = null;
    if (this.externalForce) this.externalForce.destroy();
    this.externalForce = null;
};