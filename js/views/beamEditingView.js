/**
 * Created by ghassaei on 11/3/16.
 */


function initBeamEditingView(globals){

    var beamsMetaTemplate = _.template("<% _.each(beams, function(beam){ %>" +
            "<div>Edges : <%= beam.numEdges %></div>" +
            "<% }); %>");

    return new (Backbone.View.extend({

        el: "#beamEditingControls",

        events: {
        },

        initialize: function(){

            _.bindAll(this, "snapToVertexChanged");
            setCheckbox("#snapToVertex", globals.get("snapToVertex"), this.snapToVertexChanged);

            this.listenTo(this.model, "change:beams", this.updateNumBeams);
            this.updateNumBeams();
            this.listenTo(this.model, "change:beamsMeta", this.updateBeamsMeta);
            this.listenTo(this.model, "change:nodes", this.updateNumNodes);
            this.updateNumNodes();


        },

        updateNumBeams: function(){
            $("#numBeams").html(this.model.getNumBeams());
        },
        updateNumNodes: function(){
            $("#numNodes").html(this.model.getNumNodes());
        },

        snapToVertexChanged: function(state){
            globals.set("snapToVertex", state);
        },

        updateBeamsMeta: function(){
            $("#beamMeta").html(beamsMetaTemplate(this.model.getBeamsJSON()));
        }

    }))({model:globals.structure});
}