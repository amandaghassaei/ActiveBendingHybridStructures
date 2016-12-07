/**
 * Created by amandaghassaei on 11/30/16.
 */


function initFitness(globals){

    var nodes;
    var vertices;
    var faces;

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
            faces = mesh.geometry.faces;

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
        return fitness;
    }

    function clamp(num, min, max){
        Math.max(min, Math.min(num, max))
    }

    function distanceToTriangle(vertex1, vertex2, vertex3, position){
        //http://www.gamedev.net/topic/552906-closest-point-on-triangle/
        var edge0 = vertex2.clone().sub(vertex1);
        var edge1 = vertex3.clone().sub(vertex1);
        var v0 = vertex1.clone().sub(position);

        var a = edge0.dot( edge0 );
        var b = edge0.dot( edge1 );
        var c = edge1.dot( edge1 );
        var d = edge0.dot( v0 );
        var e = edge1.dot( v0 );

        var det = a*c - b*b;
        var s = b*e - c*d;
        var t = b*d - a*e;

        if ( s + t < det )
        {
            if ( s < 0)
            {
                if ( t < 0)
                {
                    if ( d < 0)
                    {
                        s = clamp( -d/a, 0, 1);
                        t = 0;
                    }
                    else
                    {
                        s = 0;
                        t = clamp( -e/c, 0, 1);
                    }
                }
                else
                {
                    s = 0;
                    t = clamp( -e/c, 0, 1);
                }
            }
            else if ( t < 0)
            {
                s = clamp( -d/a, 0, 1);
                t = 0.f;
            }
            else
            {
                var invDet = 1/det;
                s *= invDet;
                t *= invDet;
            }
        }
        else
        {
            if ( s < 0)
            {
                var tmp0 = b+d;
                var tmp1 = c+e;
                if ( tmp1 > tmp0 )
                {
                    var numer = tmp1 - tmp0;
                    var denom = a-2*b+c;
                    s = clamp( numer/denom, 0, 1);
                    t = 1-s;
                }
                else
                {
                    t = clamp( -e/c, 0, 1);
                    s = 0;
                }
            }
            else if ( t < 0)
            {
                if ( a+d > b+e )
                {
                    var numer = c+e-b-d;
                    var denom = a-2*b+c;
                    s = clamp( numer/denom, 0, 1);
                    t = 1-s;
                }
                else
                {
                    s = clamp( -e/c, 0, 1);
                    t = 0;
                }
            }
            else
            {
                var numer = c+e-b-d;
                var denom = a-2*b+c;
                s = clamp( numer/denom, 0, 1);
                t = 1 - s;
            }
        }

        return vertex1.clone().add(edge0.multiplyScalar(s)).add(edge1.multiplyScalar(t));
    }


    return{
        calcFitness: calcFitness
    }
}