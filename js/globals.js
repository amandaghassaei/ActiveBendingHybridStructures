/**
 * Created by ghassaei on 11/2/16.
 */

function initGlobals(){

    return new (Backbone.Model.extend({

        initialize: function(){
            this.threeView = initThreeView(this);
            this.mesh = initMesh(this);
        }

    }))();
}