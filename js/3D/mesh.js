/**
 * Created by ghassaei on 11/3/16.
 */


function initMesh(globals){

    var loader = new THREE.STLLoader();
    var material = new THREE.MeshLambertMaterial({color:0xb67df0, side:THREE.DoubleSide});
    var transparentMaterial = new THREE.MeshLambertMaterial({color:0xaaaaaa, side:THREE.DoubleSide, transparent:true, opacity:0.3});
    var wireframeMaterial = new THREE.LineBasicMaterial({color:0x000000, linewidth:2});
    var transparentWireframeMaterial = new THREE.LineBasicMaterial({color:0x000000, linewidth:2, transparent:true, opacity:0.3});

    var origGeometry = null;

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
            if (!this.object3D) return;
            var mode = globals.get("mode");
            this.setTransparent(mode != "meshEditing");
            this.object3D.visible = !(mode === "boundaryEditing" || mode === "meshing");
            this.wireframe.visible = !(mode === "boundaryEditing" || mode === "meshing");
            globals.threeView.render();
        },

        setTransparent: function(transparent){
            if (!this.object3D) return;
            if (transparent){
                this.object3D.material = transparentMaterial;
                this.wireframe.material = transparentWireframeMaterial;
            } else {
                this.object3D.material = material;
                this.wireframe.material = wireframeMaterial;
            }
        },

        scaleChanged: function(){
            if (!this.object3D) return;
            var scale = this.get("scale");
            var geometry = origGeometry.clone();
            geometry.scale(scale.x, scale.y, scale.z);
            geometry.computeVertexNormals();
            this.object3D.geometry = geometry;
            this.wireframe.geometry = geometry;
            globals.threeView.render();
        },

        getSize: function(){
            if (!this.object3D) return new THREE.Vector3();
            var bbox = new THREE.Box3().setFromObject(this.object3D);
            return bbox.max.sub(bbox.min);
        },

        getObject3D: function(){
            return this.object3D;
        },

        meshLoaded: function(){
            if (this.object3D) return true;
            return false;
        },

        loadSTL: function(url){
            var self = this;
            loader.load(url, function (geometry){
                //todo center geometry
                geometry = new THREE.Geometry().fromBufferGeometry(geometry);
                geometry.center();
                origGeometry = geometry.clone();
                if (self.object3D){
                    globals.threeView.sceneRemove(self.object3D);
                    globals.threeView.sceneRemove(self.wireframe);
                }
                self.object3D = new THREE.Mesh(geometry, material);
                var wireframeGeo = new THREE.WireframeGeometry(geometry);
                self.wireframe = new THREE.LineSegments(wireframeGeo, wireframeMaterial);
                globals.threeView.sceneAdd(self.object3D);
                globals.threeView.sceneAdd(self.wireframe);
                self.scaleChanged();
                self.trigger("change:stl");
                self.updateForMode();
            });
        }

    }))();
}