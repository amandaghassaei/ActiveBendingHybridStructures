/**
 * Created by amandaghassaei on 11/27/16.
 */


function initOptimization(globals){

    var allEdges;
    var edgeVariables;
    resetEdgeVariables();

    function refreshEdges(){
        var _allEdges = [];
        for (var i=0;i<globals.structure.simBeams.length;i++){
            _allEdges = _allEdges.concat(globals.structure.simBeams[i].getEdges());
        }
        var _edgeVariables = [];
        for (var i=0;i<_allEdges.length;i++){
            _edgeVariables.push({
                edges: [_allEdges[i]],
                active: true
            });
        }
        edgeVariables = _edgeVariables;
        allEdges = _allEdges;
    }

    function resetEdgeVariables(){
        var _allEdges = [];
        for (var i=0;i<globals.structure.simBeams.length;i++){
            _allEdges = _allEdges.concat(globals.structure.simBeams[i].getEdges());
        }
        var _edgeVariables = [];
        for (var i=0;i<_allEdges.length;i++){
            _edgeVariables.push({
                edges: [_allEdges[i]],
                active: true
            });
        }
        edgeVariables = _edgeVariables;
        allEdges = _allEdges;
    }

    function getEdgeVariableData(){//for ui
        var data = [];
        for (var i=0;i<edgeVariables.length;i++){
            var entry = {};
            entry.indices = [];
            entry.active = edgeVariables[i].active;
            entry.length = edgeVariables[i].edges[0].getLength();
            for (var j=0;j<edgeVariables[i].edges.length;j++){
                var index = allEdges.indexOf(edgeVariables[i].edges[j]);
                if (index<0){
                    console.warn("bad index");
                    continue;
                }
                entry.indices.push(index+1);
            }
            data.push(entry);
        }
        return data;
    }

    function linkEdges(){
        //set length to avg
    }
    function unlinkEdges(){
    }

    function setEdgeLengthAtIndex(index, length){
        if (edgeVariables.length<= index){
            console.warn("inde out of range");
            return;
        }
        var edges = edgeVariables[index].edges;
        for (var i=0;i<edges.length;i++){
            edges[i].setLength(length);
        }
        //update sim
        globals.solver.updateBeamLengths();
    }

    return {
        refreshEdges: refreshEdges,
        resetEdgeVariables: resetEdgeVariables,
        getEdgeVariableData: getEdgeVariableData,
        setEdgeLengthAtIndex: setEdgeLengthAtIndex
    }
}