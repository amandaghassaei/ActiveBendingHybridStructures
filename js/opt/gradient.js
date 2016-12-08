/**
 * Created by amandaghassaei on 12/5/16.
 */


function initGradient(globals){

    function gradientDescent(variables, _fitness){
        if (_fitness === undefined) {
            _fitness = globals.fitness.calcFitness();
        }
        var solved = true;
        for (var i=0;i<variables.length;i++){
            var objects = variables[i].objects;
            var length = objects[0].getSimLength();

            globals.optimization.setEdgeLengthAtIndex(i, length + variables[i].stepSize);
            globals.solver.staticSolve(true);

            var newFitness = globals.fitness.calcFitness();
            if (newFitness < _fitness){
                _fitness = newFitness;
                solved = false;
                continue;
            }

            globals.optimization.setEdgeLengthAtIndex(i, length - variables[i].stepSize);
            globals.solver.staticSolve(true);

            newFitness = globals.fitness.calcFitness();
            if (newFitness < _fitness){
                _fitness = newFitness;
                solved = false;
                continue;
            }
            globals.optimization.setEdgeLengthAtIndex(i, length);
            globals.solver.staticSolve(true);
        }
        return solved;
    }

    return {
        gradientDescent: gradientDescent
    }
}