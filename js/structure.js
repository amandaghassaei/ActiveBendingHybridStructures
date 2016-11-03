/**
 * Created by ghassaei on 11/3/16.
 */


function initStructure(globals){

    var intersector = initIntersector3D(globals);

    return new (Backbone.Model.extend({

        defaults: {
        },

        initialize: function(){

            this.nodes = [];
            this.beams = [];

            this.object3D = new THREE.Object3D();
            globals.threeView.sceneAdd(this.object3D);
        },

        newBeam: function(){
            this.trigger("change:beams");
        },
        getNumBeams: function(){
            return this.beams.length;
        },

        newNode: function(position){
            if (this.nodeAtPosition(position)) return;
            var node = new Node(position, this.object3D);
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
        }

    }))();
}