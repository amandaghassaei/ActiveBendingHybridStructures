/**
 * Created by ghassaei on 11/4/16.
 */


var simEdgeMaterial = new THREE.LineBasicMaterial({color:0x777777, linewidth:4});

function SimBeamEl(nodes, parent){
    Edge.call(this, nodes, parent);
    this.object3D.material = simEdgeMaterial;
}
SimBeamEl.prototype = Object.create(Edge.prototype);

//SimBeamEl.prototype.destroy = function(){
//
//};