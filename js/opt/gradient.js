/**
 * Created by amandaghassaei on 12/5/16.
 */


function initGradient(globals){

    function gradientDescent(variables, _fitness){
        if (_fitness === undefined) _fitness = globals.fitness.calcFitness();
        var solved = true;
        for (var i=0;i<variables.length;i++){
            var objects = variables[i].objects;
            var length = objects[0].getLength();

            for (var j=0;j<objects.length;j++){
                globals.optimization.setEdgeLengthAtIndex(i, length + variables[i].stepSize);
            }
            globals.solver.staticSolve(true);

            var newFitness = globals.fitness.calcFitness();
            if (newFitness < _fitness){
                _fitness = newFitness;
                solved = false;
                continue;
            }

            for (var j=0;j<objects.length;j++){
                globals.optimization.setEdgeLengthAtIndex(i, length - variables[i].stepSize);
            }
            globals.solver.staticSolve(true);

            var newFitness = globals.fitness.calcFitness();
            if (newFitness < _fitness){
                _fitness = newFitness;
                solved = false;
                continue;
            }
            for (var j=0;j<objects.length;j++){
                globals.optimization.setEdgeLengthAtIndex(i, length);
            }
        }

        return solved;
    }

    return {
        gradientDescent: gradientDescent
    }
}