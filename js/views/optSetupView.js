/**
 * Created by amandaghassaei on 11/27/16.
 */


function initOptSetupView(globals) {

    var edgeVariableTemplate = _.template("<% _.each(edgeVariables, function(edges, index){ %>" +
            '<div class="edgeEntry" id="<%= index%>">'+
                'Edge<% if (edges.length>1){ %>s<% } %> <% _.each(edges, function(edgeNum, edgeNumIndex){ %>' +
                    '<% if (edgeNumIndex>0){ %>, <% } %>' +
                    '<%=edgeNum%>' +
                '<% }); %>' +
            '</div>' +
            "<% });%>");


    return new (Backbone.View.extend({

        el: "#optSetupControls",

        events: {
            "click .resetSim": "reset",
            "click .startSim": "start",
            "click .pauseSim": "pause"
        },

        initialize: function () {

            setCheckbox("#includeBeams", globals.get("optIncludeBeams"), function(state){
                globals.set("optIncludeBeams", state);
            });
            setCheckbox("#includeMembranes", globals.get("optIncludeMembranes"), function(state){
                globals.set("optIncludeMembranes", state);
            });
            setCheckbox("#includeForces", globals.get("optIncludeForces"), function(state){
                globals.set("optIncludeForces", state);
            });

            this.listenTo(globals, "change:mode", function(){
                var mode = globals.get("mode");
                if (mode == "optSetup"){
                    globals.optimization.refreshEdges();
                    this.setEdges(globals.optimization.getEdgeVariableData());
                }
            });
        },

        setEdges: function(data){
            $("#optBeams").html(edgeVariableTemplate({edgeVariables: data}));
        },

        reset: function (e) {
            e.preventDefault();
            globals.solver.pause();
            globals.solver.reset();
        },

        start: function (e) {
            e.preventDefault();
            globals.set("simNeedsReset", true);
            globals.solver.start();
        },

        // staticSolve: function(e){
        //     e.preventDefault();
        //     globals.set("simNeedsReset", true);
        //     globals.solver.pause();
        //     globals.solver.staticSolve();
        // },

        pause: function (e) {
            e.preventDefault();
            globals.solver.pause();
        }

    }))({model: globals.structure});
}