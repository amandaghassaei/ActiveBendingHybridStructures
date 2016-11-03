/**
 * Created by ghassaei on 11/3/16.
 */


function initStructure(globals){

    return new (Backbone.Model.extend({

        defaults: {
        },

        initialize: function(){

            this.nodes = [];
            this.beams = [];

            this.object3D = new THREE.Object3D();
            this.nodesContainer = new THREE.Object3D();
            this.object3D.add(this.nodesContainer);
            globals.threeView.sceneAdd(this.object3D);

            this.intersector = initIntersector3D(globals, this);

            this.listenTo(globals, "change:mode", this.modeChanged);
        },

        modeChanged: function(){
            var mode = globals.get("mode");
            this.object3D.visible = mode !== "meshEditing";
            globals.threeView.render();
        },

        newBeam: function(){
            this.trigger("change:beams");
        },
        getNumBeams: function(){
            return this.beams.length;
        },

        newNode: function(position){
            if (this.nodeAtPosition(position)) return;
            var node = new Node(position, this.nodesContainer);
            this.nodes.push(node);
            this.trigger("change:nodes");
            globals.threeView.render();
        },
        getNumNodes: function(){
            return this.nodes.length;
        },
        nodeAtPosition: function(position){
            for (var i=0;i<this.nodes.length;i++){
                if (this.nodes[i].getPosition().equals(position)) return true;
            }
            return false;
        },

        getNodesToIntersect: function(){
            return this.nodesContainer.children;
        }

    }))();
}