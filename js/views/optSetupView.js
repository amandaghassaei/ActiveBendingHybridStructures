/**
 * Created by amandaghassaei on 11/27/16.
 */


function initOptSetupView(globals) {

    var edgeVariableTemplate = _.template("<% _.each(edgeVariables, function(variable, index){ %>" +
            '<div class="edgeEntry" id="edgeEntry<%= index%>">'+
                'Edge<% if (variable.indices.length>1){ %>s<% } %> <% _.each(variable.indices, function(edgeNum, edgeNumIndex){ %>' +
                    '<% if (edgeNumIndex>0){ %>, <% } %>' +
                    '<%=edgeNum%>' +
                '<% }); %>' +
                '<span class="floatRight"> Length (m): &nbsp;&nbsp;<input placeholder="Length" class="form-control" type="text" value="<%= variable.length.toFixed(2) %>">' +
                    '<label class="checkbox" for="edgeEntryCheck<%= index%>">' +
                        '<input id="edgeEntryCheck<%= index%>" <% if(variable.active){ %>checked="checked" <% } %>data-toggle="checkbox" class="custom-checkbox" type="checkbox"><span class="icons"><span class="icon-unchecked"></span><span class="icon-checked"></span></span>' +
                    '</label>' +
                '</span>' +
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
                    this.setEdgeEntries();
                }
            });
        },

        setEdgeEntries: function(){
            $("#optBeams").html(edgeVariableTemplate(globals.optimization.getEdgeVariableData()));
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