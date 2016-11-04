/**
 * Created by ghassaei on 11/3/16.
 */

var membraneMaterial = new THREE.MeshBasicMaterial({color: 0xb67df0, side: THREE.DoubleSide});

function Membrane(edges, parent){

    var geometry = new THREE.Geometry();
    var averageVertex = new THREE.Vector3();
    geometry.vertices.push(averageVertex);
    for (var i=0;i<edges.length;i++){
        for (var j=0;j<2;j++){
            var nodePosition = edges[i].getNodes()[j].getPosition();
            averageVertex.add(nodePosition);
            geometry.vertices.push(nodePosition);
        }
        geometry.faces.push(new THREE.Face3(0, geometry.vertices.length-2, geometry.vertices.length-1));
    }
    averageVertex.multiplyScalar(1/(geometry.vertices.length-1));
    geometry.computeVertexNormals();

    this.object3D = new THREE.Object3D();
    this.object3D.add(new THREE.Mesh(geometry, membraneMaterial));
    parent.add(this.object3D);
    this.parent = parent;

    this.edges = edges;

    this.simMembrane = new SimMembrane(this.object3D);
}

Membrane.prototype.getOuterNodes = function(edges){
    var vertices = [];
};

Membrane.prototype.mesh = function(numLayers){
    var outerNodes = [];
};

Membrane.prototype.destroy = function(){
    parent.remove(this.object3D);
    parent = null;
    this.object3D = null;
    this.edges = null;
    this.simMembrane.destroy();
};