/**
 * Created by amandaghassaei on 11/27/16.
 */


function initOptimization(globals){

    var allEdges;
    var edgeVariables;
    resetEdgeVariables();

    function refreshEdges(){
        var _allEdges = [];
        for (var i=0;i<globals.structure.beams.length;i++){
            _allEdges = _allEdges.concat(globals.structure.beams[i].getEdges());
        }
        var _edgeVariables = [];
        for (var i=0;i<_allEdges.length;i++){
            _edgeVariables.push([_allEdges[i]]);
        }
        edgeVariables = _edgeVariables;
        allEdges = _allEdges;
    }

    function resetEdgeVariables(){
        var _allEdges = [];
        for (var i=0;i<globals.structure.beams.length;i++){
            _allEdges = _allEdges.concat(globals.structure.beams[i].getEdges());
        }
        var _edgeVariables = [];
        for (var i=0;i<_allEdges.length;i++){
            _edgeVariables.push([_allEdges[i]]);
        }
        edgeVariables = _edgeVariables;
        allEdges = _allEdges;
    }

    function getEdgeVariableData(){//for ui
        var data = [];
        for (var i=0;i<edgeVariables.length;i++){
            var entry = [];
            for (var j=0;j<edgeVariables[i].length;j++){
                var index = allEdges.indexOf(edgeVariables[i][j]);
                if (index<0){
                    console.warn("bad index");
                    continue;
                }
                entry.push(index);
            }
            data.push(entry);
        }
        return data;
    }

    function linkEdges(){
    }
    function unlinkEdges(){
    }

    return {
        refreshEdges: refreshEdges,
        resetEdgeVariables: resetEdgeVariables,
        getEdgeVariableData: getEdgeVariableData
    }
}