/**
 * Created by ghassaei on 11/3/16.
 */

var membraneMaterial = new THREE.MeshLambertMaterial({color: 0xb67df0, side: THREE.DoubleSide});

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
    this.object3D = new THREE.Mesh(geometry, membraneMaterial);

    parent.add(this.object3D);
    this.parent = parent;
}

Membrane.prototype.destroy = function(){
    parent.remove(this.object3D);
    parent = null;
    this.object3D = null;
};