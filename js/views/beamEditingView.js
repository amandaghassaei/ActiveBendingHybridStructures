/**
 * Created by ghassaei on 11/3/16.
 */


function initBeamEditingView(globals){

    var beamsMetaTemplate = _.template("<% _.each(beams, function(beam, index){ %>" +
            '<div class="beamEntries">'+
                'Beam <%= index + 1 %> : &nbsp;&nbsp;<%= beam.numEdges %> edge<% if (beam.numEdges>1 || beam.numEdges==0){ %>s<% } %>, <%= beam.numNodes %> node<% if (beam.numNodes>1 || beam.numNodes==0){ %>s<% } %> ' +
                '<% if (beam.isLoop){ %>' +
                    '<label class="checkbox" for="closedLoop<%= index%>">' +
                        '<input data-index="<%= index%>" id="closedLoop<%= index%>" <% if(beam.closedLoop){ %>checked="checked" <% } %>data-toggle="checkbox" class="edgeEntryCheck custom-checkbox" type="checkbox"><span class="icons"><span class="icon-unchecked"></span><span class="icon-checked"></span></span>' +
                    'Closed Loop</label>' +
                '<% } %>' +
                '<a href="#" data-index="<%=index%>" class="floatRight deleteLink deleteBeam"><span class="fui-cross"></span></a>' +
            '</div>' +
            "<% });%>");
    var nodesMetaTemplate = _.template("<% _.each(nodes, function(node, index){ %>" +
            '<div class="divInlineInputs nodeEntries">'+
                'Node <%= index + 1 %> : ' +
                    '<input placeholder="X" data-axis="x" data-index="<%= index%>" class="inlineInput nodePositionInput form-control" type="text" value="<%= node.position.x.toFixed(2) %>">' +
                    '<input placeholder="Y" data-axis="y" data-index="<%= index%>" class="inlineInput nodePositionInput form-control" type="text" value="<%= node.position.y.toFixed(2) %>">' +
                    '<input placeholder="Z" data-axis="z" data-index="<%= index%>" class="inlineInput nodePositionInput form-control" type="text" value="<%= node.position.z.toFixed(2) %>">' +
                    '<a href="#" data-index="<%=index%>" class="floatRight deleteNode deleteLink"><span class="fui-cross"></span></a>' +
            '</div>' +
            "<% });%>");
    var defaultMessageNodes = "Add nodes by mousing over the mesh and clicking.";
    var defaultMessageBeams = "Add beams by selecting a series of nodes.";

    return new (Backbone.View.extend({

        el: "#beamEditingControls",

        events: {
            "click #deleteNodeMode": "setDeleteNodeMode",
            "click .deleteBeam": "deleteBeam",
            "click .deleteNode": "deleteNode",
            "click .clearAll": "clearAll",
            "change input[name=selectedBeam]": "selectBeam",
            "mouseenter .nodeEntries": "highlightNode",
            "mouseout .nodeEntries": "unhighlightNode",
            "mouseenter .beamEntries": "highlightBeam",
            "mouseout .beamEntries": "unhighlightBeam",
            "change .nodePositionInput": "moveNode"
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

            this.listenTo(globals, "change:mode", function(){
                if (globals.get("mode") == "beamEditing"){
                    this.updateNodesMeta();
                    this.updateBeamsMeta();
                }
            });
        },

        deleteBeam: function(e){
            e.preventDefault();
            var index = parseInt($(e.target).parent().data("index"));
            if (isNaN(index)) return;
            this.model.removeBeamAtIndex(index)
        },

        deleteNode: function(e){
            e.preventDefault();
            var index = parseInt($(e.target).parent().data("index"));
            if (isNaN(index)) return;
            globals.intersector3D.setHighlightedObj(null);
            this.model.removeNodeAtIndex(index);
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
            // this.model.highlightBeam(json.beams.length-1);
        },

        setHighlightedBeam: function(index){
            var $beamEntries = $("#beamMeta").children(".beamEntries");
            $beamEntries.removeClass("selectedEntry");
            if (index>=0){
                $beamEntries.eq(index).addClass("selectedEntry");
                this.model.highlightBeam(index);
            } else {
                this.model.highlightBeam(-1);
            }
        },

        highlightBeam: function(e){
            var $target = $(e.target);
            $("#beamMeta").children(".beamEntries").removeClass("selectedEntry");
            if (!$target.hasClass("beamEntries")) $target = $target.parents(".beamEntries");
            var index = $target.find("a").data("index");
            if (index === undefined) return;
            this.model.highlightBeam(index);
        },

        unhighlightBeam: function(e){
            var $target = $(e.target);
            if (!$target.hasClass("beamEntries")) return;
            $target = $(e.relatedTarget);
            if ($target.parents(".beamEntries").length > 0) return;
            this.model.unhighlightBeams();
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

        highlightNode: function(e){
            var $target = $(e.target);
            if (!$target.hasClass("nodeEntries")) $target = $target.parents(".nodeEntries");
            $("#nodesMeta").children(".nodeEntries").removeClass("selectedEntry");
            var index = $target.find("a").data("index");
            if (index === undefined) return;
            globals.intersector3D.setHighlightedObj(this.getNodeForIndex(index));
        },
        unhighlightNode: function(e){
            var $target = $(e.target);
            if (!$target.hasClass("nodeEntries")) return;
            $target = $(e.relatedTarget);
            if ($target.parents(".nodeEntries").length > 0) return;
            this.model.unhighlightNodes();
        },

        updateNodesMeta: function(){
            if (this.model.getNumNodes() == 0){
                $("#nodesMeta").html(defaultMessageNodes);
                return;
            }
            var json = this.model.getNodesJSON();
            $("#nodesMeta").html(nodesMetaTemplate(json));
        },

        getNodeForIndex: function(index){
            if (index < 0 || index >= globals.structure.nodes.length) return null;
            return globals.structure.nodes[index];
        },

        moveNode: function(e){
            var $target = $(e.target);
            var index = $target.data("index");
            var val = parseFloat($target.val());
            if (isNaN(val)) return;
            var node = this.getNodeForIndex(index);
            if (node === null) return;
            var axis = $target.data("axis");
            globals.structure.moveNode(node, val, axis);
        },

        clearAll: function(e){
            e.preventDefault();
            globals.intersector3D.setHighlightedObj(null);
            this.model.reset();
            $(e.target).blur();
            globals.threeView.render();
        }

    }))({model:globals.structure});
}