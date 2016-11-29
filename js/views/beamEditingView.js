/**
 * Created by ghassaei on 11/3/16.
 */


function initBeamEditingView(globals){

    var beamsMetaTemplate = _.template("<% _.each(beams, function(beam, index){ %>" +
            '<label class="radio">'+
                '<input name="selectedBeam" value="<%= index %>" data-toggle="radio" class="custom-radio" type="radio"><span class="icons"><span class="icon-unchecked"></span><span class="icon-checked"></span></span>'+
                'Beam <%= index + 1 %> :  <%= beam.numEdges %> edge<% if (beam.numEdges>1 || beam.numEdges==0){ %>s<% } %>, <%= beam.numNodes %> node<% if (beam.numNodes>1 || beam.numNodes==0){ %>s<% } %> ' +
                '<a href="#" data-index="<%=index%>" class="deleteLink deleteBeam"><span class="fui-cross"></span></a>' +
            '</label>' +
            "<% });%>");
    var nodesMetaTemplate = _.template("<% _.each(nodes, function(node, index){ %>" +
            '<div class="divInlineInputs nodeEntries">'+
                'Node <%= index + 1 %> : ' +
                    '<input placeholder="X" data-index="<%= index%>" class="inlineInput form-control" type="text" value="<%= node.position.x.toFixed(2) %>">' +
                    '<input placeholder="X" data-index="<%= index%>" class="inlineInput form-control" type="text" value="<%= node.position.y.toFixed(2) %>">' +
                    '<input placeholder="X" data-index="<%= index%>" class="inlineInput form-control" type="text" value="<%= node.position.z.toFixed(2) %>">' +
                    '<a href="#" data-index="<%=index%>" class="deleteNode deleteLink"><span class="fui-cross"></span></a>' +
            '</div>' +
            "<% });%>");
    var defaultMessageNodes = "Add nodes by mousing over the mesh and clicking.";
    var defaultMessageBeams = "Add beams by selecting a series of nodes.";

    return new (Backbone.View.extend({

        el: "#beamEditingControls",

        events: {
            "click #deleteNodeMode": "setDeleteNodeMode",
            "click .deleteBeam": "deleteBeam",
            "click .clearAll": "clearAll",
            "change input[name=selectedBeam]": "selectBeam"
        },

        initialize: function(){

            _.bindAll(this, "snapToVertexChanged");

            setCheckbox("#snapToVertex", globals.get("snapToVertex"), this.snapToVertexChanged);

            this.listenTo(this.model, "change:beams", this.updateNumBeams);
            this.updateNumBeams();
            this.listenTo(this.model, "change:beamsMeta change:beams", this.updateBeamsMeta);
            this.listenTo(this.model, "change:nodes", this.updateNumNodes);
            this.listenTo(this.model, "change:nodes", this.updateNodesMeta);
            this.updateNumNodes();

            this.updateNodesMeta();
            this.updateBeamsMeta();
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
            if (this.model.getNumBeams() == 0){
                $("#beamMeta").html(defaultMessageBeams);
                return;
            }
            var json = this.model.getBeamsJSON();
            $("#beamMeta").html(beamsMetaTemplate(json));
            this.model.highlightBeam(json.beams.length-1);
            $(".radio>input[name=selectedBeam][value=" + (json.beams.length-1) + "]").prop("checked", true);
        },

        selectBeam: function(){
            var state = $("input[name=selectedBeam]:checked").val();
            this.model.highlightBeam(state);
        },

        setHighlightedNode: function(index){
            var $nodeEntries = $("#nodesMeta").children(".nodeEntries");
            $nodeEntries.removeClass("selectedEntry");
            if (index>=0){
                $nodeEntries.eq(index).addClass("selectedEntry");
            }
        },

        updateNodesMeta: function(){
            if (this.model.getNumNodes() == 0){
                $("#nodesMeta").html(defaultMessageNodes);
                return;
            }
            var json = this.model.getNodesJSON();
            $("#nodesMeta").html(nodesMetaTemplate(json));

        },

        clearAll: function(e){
            e.preventDefault();
            this.model.reset();
            $(e.target).blur();
            globals.threeView.render();
        }

    }))({model:globals.structure});
}