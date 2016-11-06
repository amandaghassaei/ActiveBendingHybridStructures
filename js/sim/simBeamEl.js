/**
 * Created by ghassaei on 11/4/16.
 */


//var simEdgeMaterial = new THREE.LineBasicMaterial({color:0xaaaaaa, linewidth:4});

function SimBeamEl(nodes, parent){
    Edge.call(this, nodes, parent);
    this.object3D.material = edgeMaterialGrey;
}
SimBeamEl.prototype = Object.create(Edge.prototype);

SimBeamEl.prototype.destroy = function(){
    this.parent = null;
    this.object3D._myEdge = null;
    this.object3D = null;
    this.nodes = null;
    this.vertices = null;
};