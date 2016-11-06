/**
 * Created by ghassaei on 11/4/16.
 */


function SimTensionEl(nodes, membrane, parent){
    Edge.call(this, nodes, parent);
}
SimTensionEl.prototype = Object.create(Edge.prototype);

SimTensionEl.prototype.getForceDensity = function(){
    return 1;
};

SimTensionEl.prototype.destroy = function(){
    Edge.prototype.destroy.call(this);
};