/**
 * Created by ghassaei on 11/3/16.
 */


function Beam(node, parent){
    this.nodes = [];
    this.nodes.push(node);

    this.object3D = new THREE.Object3D();
    parent.add(this.object3D);
}

Beam.prototype.addNode = function(node){
    this.nodes.push(node);
};


Beam.prototype.destroy = function(){
    this.nodes = null;
};