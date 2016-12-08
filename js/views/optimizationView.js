/**
 * Created by amandaghassaei on 11/30/16.
 */


function initOptimizationView(globals){

    var edgeVariableTemplate = _.template("<% _.each(edgeVariables, function(variable, index){ %>" +
        '<% if(variable.active){ %>' +
            '<div  class="edgeEntry" data-index="<%= index%>"><a href="#" class="edgeEntryA">'+
                '<% if (variable.indices.length>1){ %><span class="unlinkEdges fui-lock"></span><% } %>'+
                '<span class="floatLeft">Edge<% if (variable.indices.length>1){ %>s<% } %> <% _.each(variable.indices, function(edgeNum, edgeNumIndex){ %>' +
                    '<% if (edgeNumIndex>0 && edgeNumIndex<4){ %>, <% } %>' +
                    '<% if (edgeNumIndex<3){ %> ' +
                        '<%= edgeNum +1 %>' +
                    '<% } else if (edgeNumIndex == 3){ %>' +
                        '...' +
                    '<% } %>' +
                '<% }); %></span>' +
                'Length (m): <%= variable.length.toFixed(2) %>' +
                '</a>' +
            '</div>' +
        '<% } %>' +
    "<% });%>");


    return new (Backbone.View.extend({

        el: "#optimizationControls",

        events: {
            "click .resetOpt": "reset",
            "click .startOpt": "start",
            "click .pauseOpt": "pause"
        },

        initialize: function(){

            this.listenTo(globals, "change:optimizationRunning", this.setButtonVis);
            this.listenTo(globals, "change:optNeedsReset", this.setResetVis);
            this.listenTo(globals, "change:fitness", this.setFitness);

            this.listenTo(globals, "change:mode", function(){
                if (globals.previous("mode") === "optimization"){
                    globals.optimization.resetOptimization();
                }
                if (globals.get("mode") == "optimization"){
                    this.setEdgeEntries();
                }
            });

            setInput("#fitnessTol", globals.get("fitnessTol"), function(val){
                globals.set("fitnessTol", val);
            }, 0);

            this.setButtonVis();
            this.setResetVis();
            this.setFitness();
        },

        setEdgeEntries: function(){
            var json = {
                edgeVariables: globals.optimization.getEdgeVariableData()
            };
            $("#optimizationBeams").html(edgeVariableTemplate(json));
        },

        setFitness: function(){
            var fitness = globals.get("fitness");
            if (fitness === null) {
                $("#currentFitness").html("null");
                return;
            }
            $("#currentFitness").html(fitness.toFixed(2) + " m<sup>2</sup>");
        },

        setButtonVis: function(){
            var state = globals.get("optimizationRunning");
            if (state){
                $(".startOpt").hide();
                $(".pauseOpt").show();
            } else {
                $(".startOpt").show();
                $(".pauseOpt").hide();
            }
        },

        setResetVis: function(){
            var state = globals.get("optNeedsReset");
            if (state){
                $(".resetOpt").show();
            } else {
                $(".resetOpt").hide();
            }
        },

        reset: function(e){
            e.preventDefault();
            globals.optimization.resetOptimization();
        },

        start: function(e){
            e.preventDefault();
            globals.optimization.startOptimization();
        },

        pause: function(e){
            e.preventDefault();
            globals.optimization.pauseOptimization();
        }



    }))({model:globals.structure});
}