/**
 * Created by amandaghassaei on 11/27/16.
 */


function initOptSetupView(globals) {

    var edgeVariableTemplate = _.template("<% _.each(edgeVariables, function(variable, index){ %>" +
            '<a href="#" class="edgeEntry" data-index="<%= index%>">'+
                'Edge<% if (variable.indices.length>1){ %>s<% } %> <% _.each(variable.indices, function(edgeNum, edgeNumIndex){ %>' +
                    '<% if (edgeNumIndex>0){ %>, <% } %>' +
                    '<%= edgeNum +1 %>' +
                '<% }); %>' +
                '<span class="floatRight"> Length (m): &nbsp;&nbsp;<input placeholder="Length" data-index="<%= index%>" class="form-control inlineInput edgeLengthInput" type="text" value="<%= variable.length.toFixed(2) %>">' +
                    '<label class="checkbox" for="edgeEntryCheck<%= index%>">' +
                        '<input data-index="<%= index%>" id="edgeEntryCheck<%= index%>" <%if(!enabled){%> disabled="disabled"<% } %> <% if(variable.active){ %>checked="checked" <% } %>data-toggle="checkbox" class="edgeEntryCheck custom-checkbox" type="checkbox"><span class="icons"><span class="icon-unchecked"></span><span class="icon-checked"></span></span>' +
                    '</label>' +
                '</span>' +
            '</a>' +
            "<% });%>");


    return new (Backbone.View.extend({

        el: "#optSetupControls",

        events: {
            "click .resetSim": "reset",
            "click .startSim": "start",
            "click .pauseSim": "pause",
            "change .edgeLengthInput": "edgeLengthChanged",
            "change .edgeEntryCheck": "edgeStatusChanged",
            "mouseenter .edgeEntry": "highlightEdge",
            "mouseout .edgeEntry": "unhighlightEdge",
            "click .edgeEntry": "selectEdgeVariable",
            "click #restoreDefaults": "restoreDefaults"
        },

        initialize: function () {

            this.selected = [];

            var self = this;
            setCheckbox("#includeBeams", globals.get("optIncludeBeams"), function(state){
                globals.set("optIncludeBeams", state);
                self.setEdgeEntries();
            });
            setCheckbox("#includeMembranes", globals.get("optIncludeMembranes"), function(state){
                globals.set("optIncludeMembranes", state);
            });
            setCheckbox("#includeForces", globals.get("optIncludeForces"), function(state){
                globals.set("optIncludeForces", state);
            });

            this.listenTo(globals, "change:mode", function(){
                var mode = globals.get("mode");
                this.model.unhighlightSimEdges();
                if (mode == "optSetup"){
                    globals.optimization.refreshEdges();
                    this.setEdgeEntries();
                    this.selected = [];
                }
            });
        },

        setEdgeEntries: function(){
            var json = {
                edgeVariables: globals.optimization.getEdgeVariableData(),
                enabled: globals.get("optIncludeBeams")
            };
            $("#optBeams").html(edgeVariableTemplate(json));
        },

        edgeStatusChanged: function(e){
            var $target = $(e.target);
            var index = $target.data("index");
            var state = $target.is(":checked");
            globals.optimization.setEdgeStateAtIndex(index, state);
        },

        edgeLengthChanged: function(e){
            var $target = $(e.target);
            var val = parseFloat($target.val());
            if (isNaN(val)) return;
            var index = $target.data("index");
            globals.optimization.setEdgeLengthAtIndex(index, val);
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

        highlightEdge: function(e){
            var $target = $(e.target);
            $("#beamMeta").children(".edgeEntry").removeClass("selectedEntry");
            if (!$target.hasClass("edgeEntry")) $target = $target.parents(".edgeEntry");
            var index = $target.data("index");
            if (index === undefined) return;
            this.model.unhighlightSimEdges();
            for (var i=0;i<this.selected.length;i++){
                this.highlightEdgesAtIndex(this.selected[i]);
            }
            this.highlightEdgesAtIndex(index);
        },

        highlightEdgesAtIndex: function(index){
            var indices = globals.optimization.getEdgeVariableData()[index].indices;
            globals.structure.highlightSimEdges(indices);
        },

        unhighlightEdge: function(e){
            var $target = $(e.currentTarget);
            if (!$target.hasClass("edgeEntry")) return;
            $target = $(e.relatedTarget);
            if ($target.parents(".edgeEntry").length > 0) return;
            this.model.unhighlightSimEdges();
            for (var i=0;i<this.selected.length;i++){
                this.highlightEdgesAtIndex(this.selected[i]);
            }
        },

        selectEdgeVariable: function(e){
            e.preventDefault();
            var $target = $(e.target);
            if ($target.hasClass("checkbox") || $target.parents(".checkbox").length>0) return;
            if ($target.is("input")) return;
            if (!$target.hasClass("edgeEntry")) $target = $target.parents(".edgeEntry");
            var index = $target.data("index");
            $target.blur();
            if ($target.hasClass("selectedEntry")) {
                $target.removeClass("selectedEntry");
                this.selected = _.without(this.selected, index);
            }
            else {
                this.selected.push(index);
                $target.addClass("selectedEntry");
            }
        },

        linkVariables: function(){
            if (this.selected.length<2) return;
            globals.optimization.linkEdges(this.selected);
            this.selected = [];
            this.setEdgeEntries();
        },

        restoreDefaults: function(e){
            e.preventDefault();
            globals.optimization.restoreEdgeLengthDefaults();
            this.setEdgeEntries();
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