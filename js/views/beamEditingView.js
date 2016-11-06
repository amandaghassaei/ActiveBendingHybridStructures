/**
 * Created by ghassaei on 11/3/16.
 */


function initBeamEditingView(globals){

    var beamsMetaTemplate = _.template("<% _.each(beams, function(beam, index){ %>" +
            '<label class="radio">'+
                '<input name="selectedBeam" value="<%= index %>" data-toggle="radio" class="custom-radio" type="radio"><span class="icons"><span class="icon-unchecked"></span><span class="icon-checked"></span></span>'+
                'Beam <%= index + 1 %> :  <%= beam.numEdges %> edges <a href="#" data-index="<%=index%>" class="deleteBeam"><span class="fui-cross"></span></a>' +
            '</label>' +
            "<% });%>");

    return new (Backbone.View.extend({

        el: "#beamEditingControls",

        events: {
            "click #deleteNodeMode": "setDeleteNodeMode",
            "click .deleteBeam": "deleteBeam"
        },

        initialize: function(){

            _.bindAll(this, "snapToVertexChanged");

            setCheckbox("#snapToVertex", globals.get("snapToVertex"), this.snapToVertexChanged);

            this.listenTo(this.model, "change:beams", this.updateNumBeams);
            this.updateNumBeams();
            this.listenTo(this.model, "change:beamsMeta change:beams", this.updateBeamsMeta);
            this.listenTo(this.model, "change:nodes", this.updateNumNodes);
            this.updateNumNodes();


        },

        deleteBeam: function(e){
            e.preventDefault();
            var index = parseInt($(e.target).parent().data("index"));
            if (isNaN(index)) return;
            this.model.removeBeamAtIndex(index)
        },

        setDeleteNodeMode: function(e){
            e.preventDefault();
            globals.set("deleteNodeMode", true);
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
            var json = this.model.getBeamsJSON();
            $("#beamMeta").html(beamsMetaTemplate(json));
            setRadio("selectedBeam", json.beams.length-1, this.model.highlightBeam);
            this.model.highlightBeam(json.beams.length-1);
        }

    }))({model:globals.structure});
}