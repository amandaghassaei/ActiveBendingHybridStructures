/**
 * Created by ghassaei on 11/3/16.
 */


function initMesh(globals){

    var loader = new THREE.STLLoader();
    var material = new THREE.MeshLambertMaterial({color:0xb67df0, side:THREE.DoubleSide, morphNormals: true, morphTargets:true, vertexColors: THREE.FaceColors, shading: THREE.SmoothShading});
    var transparentMaterial = new THREE.MeshLambertMaterial({color:0xb67df0, side:THREE.DoubleSide, transparent:true, opacity:0.3});
    var wireframeMaterial = new THREE.LineBasicMaterial({color:0x000000, linewidth:2});
    var transparentWireframeMaterial = new THREE.LineBasicMaterial({color:0x000000, linewidth:2, transparent:true, opacity:0.3});

    return new (Backbone.Model.extend({

        defaults: {
            scale: new THREE.Vector3(1, 1, 1)
        },

        initialize: function(){
            //initialize with an stl
            this.loadSTL("assets/sinewave.stl");
            this.listenTo(this, "change:scale", this.scaleChanged);
            this.listenTo(globals, "change:mode", this.updateForMode);
        },

        updateForMode: function(){
            if (!this.mesh) return;
            var mode = globals.get("mode");
            this.setTransparent(mode != "meshEditing");
            globals.threeView.render();
        },

        setTransparent: function(transparent){
            if (!this.mesh) return;
            if (transparent){
                this.mesh.material = transparentMaterial;
                this.wireframe.material = transparentWireframeMaterial;
            } else {
                this.mesh.material = material;
                this.wireframe.material = wireframeMaterial;
            }
        },

        scaleChanged: function(){
            var scale = this.get("scale");
            if (this.mesh) this.mesh.scale.set(scale.x, scale.y, scale.z);
            if (this.wireframe) this.wireframe.scale.set(scale.x, scale.y, scale.z);
            globals.threeView.render();
        },

        getSize: function(){
            if (!this.mesh) return new THREE.Vector3();
            var bbox = new THREE.Box3().setFromObject(this.mesh);
            return bbox.max.sub(bbox.min);
        },

        getObject3D: function(){
            return this.mesh;
        },

        loadSTL: function(url){
            var self = this;
            loader.load(url, function (geometry){
                //todo center geometry
                var geometry = new THREE.Geometry().fromBufferGeometry(geometry);
                geometry.computeVertexNormals();
                geometry.computeFaceNormals();
                geometry.computeMorphNormals();
                if (self.mesh){
                    globals.threeView.sceneRemove(self.mesh);
                    globals.threeView.sceneRemove(self.wireframe);
                }
                self.mesh = new THREE.Mesh(geometry, material);
                var scale = self.get("scale");
                self.mesh.scale.set(scale.x, scale.y, scale.z);
                var wireframeGeo = new THREE.WireframeGeometry(geometry);
                self.wireframe = new THREE.LineSegments(wireframeGeo, wireframeMaterial);
                self.wireframe.scale.set(scale.x, scale.y, scale.z);
                globals.threeView.sceneAdd(self.mesh);
                globals.threeView.sceneAdd(self.wireframe);
                self.trigger("change:stl");
                self.updateForMode();
            });
        }

    }))();
}