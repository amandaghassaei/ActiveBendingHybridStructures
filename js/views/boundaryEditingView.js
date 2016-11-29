/**
 * Created by ghassaei on 11/7/16.
 */


function initBoundaryEditingView(globals){

    var nodesMetaTemplate = _.template("<% _.each(nodes, function(node, index){ %>" +
            '<div class="divInlineInputs nodeEntries">'+
                'Node <%= index + 1 %> : ' +
                    '<input placeholder="X" data-axis="x" data-index="<%= index%>" class="inlineInput nodePositionInput form-control" type="text" value="<%= node.position.x.toFixed(2) %>">' +
                    '<input placeholder="Y" data-axis="y" data-index="<%= index%>" class="inlineInput nodePositionInput form-control" type="text" value="<%= node.position.y.toFixed(2) %>">' +
                    '<input placeholder="Z" data-axis="z" data-index="<%= index%>" class="inlineInput nodePositionInput form-control" type="text" value="<%= node.position.z.toFixed(2) %>">' +
                    '<a href="#" data-index="<%=index%>" class="floatRight deleteNode deleteLink"><span class="fui-cross"></span></a>' +
            '</div>' +
            "<% });%>");
    var defaultMessageNodes = "Select nodes to set them as fixed.";

    return new (Backbone.View.extend({

        el: "#boundaryEditingControls",

        events: {
            "click .deleteNode": "deleteFixed",
        },

        initialize: function(){

            setRadio("boundaryEditingMode", globals.get("boundaryEditingMode"), this.boundaryEditingModeChanged);

            this.listenTo(this.model, "change:numFixed", this.updateNumFixed);
            this.listenTo(this.model, "change:nodes", this.updateNodesMeta);
            this.updateNumFixed();
        },

        updateNumFixed: function(){
            $("#numFixed").html(this.model.get("numFixed"));
            this.updateNodesMeta();
        },

        updateNodesMeta: function(){
            if (this.model.get("numFixed") == 0){
                $("#fixedMeta").html(defaultMessageNodes);
                return;
            }
            var json = this.model.getFixedNodesJSON();
            $("#fixedMeta").html(nodesMetaTemplate(json));
        },

        deleteFixed:function(e){
            e.preventDefault();
            var index = parseInt($(e.target).parent().data("index"));
            if (isNaN(index)) return;
            globals.intersector3D.setHighlightedObj(null);
            var node = null;
            this.model.toggleFixedState(node);
        },

        boundaryEditingModeChanged: function(val){
            globals.set("boundaryEditingMode", val);
        }


    }))({model:globals.structure});
}