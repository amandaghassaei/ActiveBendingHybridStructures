/**
 * Created by ghassaei on 9/16/16.
 */

function initThreeView(globals) {

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -1000, 1000);//-40, 40);
    var renderer = new THREE.WebGLRenderer({antialias: true});
    var controls;
    var isAnimating = false;

    init();

    function init() {

        var container = $("#threeContainer");
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.append(renderer.domElement);

        scene.background = new THREE.Color(0xf4f4f4);
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        //var directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.3);
        //directionalLight1.position.set(0, 100, 0);
        //scene.add(directionalLight1);
        //var directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.3);
        //directionalLight4.position.set(0, -100, 0);
        //scene.add(directionalLight4);
        var directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight2.position.set(-30, 100, 30);
        scene.add(directionalLight2);
        var directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight3.position.set(-30, -100, 30);
        scene.add(directionalLight3);
        //scene.fog = new THREE.FogExp2(0xf4f4f4, 1.7);
        //renderer.setClearColor(scene.fog.color);

        camera.zoom = 28;
        camera.updateProjectionMatrix();
        camera.position.x = 20;
        camera.position.y = 20;
        camera.position.z = 40;

        controls = new THREE.OrbitControls(camera, container.get(0));//document
        controls.addEventListener('change', render);

        window.addEventListener('resize', onWindowResize, false);

        render();
    }

    function render() {
        if (!isAnimating) _render();
    }

    function startAnimation(callback){
        if (isAnimating){
            console.warn("already animating");
            return;
        }
        console.log("starting animation");
        isAnimating = true;
        _loop(function(){
            callback();
            _render();
        });

    }
    function stopAnimation(){
        if (isAnimating) console.log("stopping animation");
        isAnimating = false;
    }

    function _render(){
        renderer.render(scene, camera);
    }

    function _loop(callback){
        callback();
        requestAnimationFrame(function(){
            if (isAnimating) _loop(callback);
        });
    }

    function sceneAdd(object) {
        scene.add(object);
    }

    function sceneRemove(object) {
        scene.remove(object);
    }

    //function sceneClear() {
    //    wrapper.children = [];
    //}

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.left = -window.innerWidth / 2;
        camera.right = window.innerWidth / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = -window.innerHeight / 2;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

        render();
    }

    function enableControls(state){
        controls.enabled = state;
        controls.enableRotate = state;
    }

    return {
        sceneRemove: sceneRemove,
        sceneAdd: sceneAdd,
        //sceneClear: sceneClear,
        render: render,
        startAnimation: startAnimation,
        stopAnimation: stopAnimation,
        enableControls: enableControls,
        scene: scene,
        camera: camera
    }
}