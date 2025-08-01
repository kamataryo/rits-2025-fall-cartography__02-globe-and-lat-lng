// ブラウザのサイズとアスペクト比を取得
const W_WIDTH = window.innerWidth;
const W_HEIGHT = window.innerHeight;
const W_ASPECT = window.innerWidth / window.innerHeight;
const W_RATIO = window.devicePixelRatio;

// グローバル変数
let camera, scene, renderer, earth, controls;

// 初期化処理
window.onload = () => {
    // カメラを作る
    camera = new THREE.PerspectiveCamera(50, W_ASPECT, 1, 1000);
    camera.position.set(0, 0, 600);

    // シーンを作る
    scene = new THREE.Scene();

    // ライトを作る（太陽光のような指向性ライト）
    let dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // 環境光を追加（全体を少し明るくする）
    let ambLight = new THREE.AmbientLight(0x333333);
    scene.add(ambLight);

    // レンダラーを作る
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(W_RATIO);
    renderer.setSize(W_WIDTH, W_HEIGHT);

    // HTMLに配置する
    let div = document.getElementById("three");
    div.appendChild(renderer.domElement);

    // OrbitControlsを設定（マウス操作用）
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 滑らかな動きを有効にする
    controls.dampingFactor = 0.05;
    controls.enableZoom = true; // ズーム機能を有効にする

    // 地球を作成
    createEarth();

    // アニメーションの開始
    animate();
};

// 地球を作成する関数
function createEarth() {
    // 1. テクスチャを読み込む
    let txLoader = new THREE.TextureLoader();
    let earthTexture = txLoader.load("./assets/earthmap1k.jpg");

    // 2. ジオメトリを作る（球体）
    let geometry = new THREE.SphereBufferGeometry(100, 30, 30);

    // 3. マテリアルを作る
    let material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: earthTexture
    });

    // 4. メッシュを作る
    earth = new THREE.Mesh(geometry, material);
    scene.add(earth);
}

// アニメーションループ
function animate() {
    // 地球を自動回転させる（ゆっくりと）
    earth.rotation.y += 0.002;

    // OrbitControlsを更新
    controls.update();

    // レンダリング
    renderer.render(scene, camera);

    // 次のフレームを要求
    requestAnimationFrame(animate);
}

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
