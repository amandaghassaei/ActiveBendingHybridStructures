/**
 * Created by amandaghassaei on 11/30/16.
 */


function initFitness(globals){

    var nodes;
    var vertices;

    var listener = _.extend({}, Backbone.Events);
    listener.listenTo(globals, "change:mode", function(){
        var mode = globals.get("mode");
        if (mode === "optimization"){
            //precalc fitness params
            nodes = globals.structure.getAllSimBeamNodes();
            for (var i=0;i<nodes.length;i++){
                nodes[i].hideMoments();
            }
            var mesh = globals.mesh.getObject3D();
            vertices = mesh.geometry.vertices;

            calcFitness();
        } else if (globals.previous("mode") == "optimization"){
            nodes = globals.structure.getAllSimBeamNodes();
            for (var i=0;i<nodes.length;i++){
                nodes[i].hideFitness();
            }
        }
    });

    function calcFitness(){
        var fitness = 0;
        //naive form for now
        //todo do this in shader
        for (var j=0;j<nodes.length;j++){
            var node = nodes[j];
            var nodePosition = node.getPosition();
            var diff = vertices[0].clone().sub(nodePosition);
            var dist = diff.lengthSq();
            for (var i=1;i<vertices.length;i++){
                var _diff = vertices[i].clone().sub(nodePosition);
                var _dist = _diff.lengthSq();
                if (_dist<dist) {
                    dist = _dist;
                    diff = _diff;
                }
            }
            fitness += dist;
            node.setNearestPos(diff);
        }

        globals.set("fitness", fitness);
    }

    function distance(from, to){
        return to.clone().sub(from).length();
    }



    return{
        calcFitness: calcFitness
    }
}