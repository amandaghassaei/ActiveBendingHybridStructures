/**
 * Created by ghassaei on 11/3/16.
 */


function initMesh(globals){

    var loader = new THREE.STLLoader();
    var material = new THREE.MeshBasicMaterial({color:0xb67df0, side:THREE.DoubleSide});

    return new (Backbone.Model.extend({

        initialize: function(){
            //initialize with an stl
            this.loadSTL("assets/sinewave.stl");
        },

        loadSTL: function(url){
            var self = this;
            loader.load(url, function (geometry){
                //todo center geometry
                if (self.mesh){
                    globals.threeView.sceneRemove(self.mesh);
                    globals.threeView.sceneRemove(self.wireframe);
                }
                self.mesh = new THREE.Mesh(geometry, material);
                var wireframeGeo = new THREE.WireframeGeometry(geometry);
                var wireframeMaterial = new THREE.LineBasicMaterial({color:0x000000, linewidth:2});
                self.wireframe = new THREE.LineSegments(wireframeGeo, wireframeMaterial);
                globals.threeView.sceneAdd(self.mesh);
                globals.threeView.sceneAdd(self.wireframe);

            });

        }

    }))();
}