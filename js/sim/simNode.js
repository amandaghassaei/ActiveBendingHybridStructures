/**
 * Created by ghassaei on 11/4/16.
 */


function SimNode(position, parent){
    Node.call(this, position, parent);
}
SimNode.prototype = Object.create(Node.prototype);