// ブラウザのサイズとアスペクト比を取得
const W_WIDTH = window.innerWidth;
const W_HEIGHT = window.innerHeight;
const W_ASPECT = window.innerWidth / window.innerHeight;
const W_RATIO = window.devicePixelRatio;

// グローバル変数
let camera, scene, renderer, earth, controls;
let meridians = [], parallels = [];
let hoveredLine = null;
let raycaster, mouse;
let equatorPlane;
let clippingPlanes = [];

// 初期化処理
window.onload = () => {
    // カメラを作る
    camera = new THREE.PerspectiveCamera(50, W_ASPECT, 1, 1000);
    camera.position.set(0, 0, 600);

    // シーンを作る
    scene = new THREE.Scene();

    // ライトを作る（太陽光のような指向性ライト）
    // 日本が常に南中になるように光源を配置
    let dirLight = new THREE.DirectionalLight(0xffffff, 1);
    const japanLongitude = 139.7; // 日本の経度（東経139.7度）
    const angle = japanLongitude * Math.PI / 180;
    const lightDistance = 500; // 光源までの距離
    const lightX = lightDistance * Math.cos(angle);
    const lightZ = lightDistance * Math.sin(angle);
    dirLight.position.set(lightX, 100, lightZ); // Y座標を少し上に設定
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

    // Raycasterとマウス位置の初期化
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 地球を作成
    createEarth();

    // 緯度経度グリッドを作成
    createLatLngGrid();

    // 赤道面を作成
    createEquatorPlane();

    // マウスイベントリスナーを追加
    setupMouseEvents();

    // キーボードイベントリスナーを追加
    setupKeyboardEvents();

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

    // 3. マテリアルを作る（内側も見えるように両面表示）
    let material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: earthTexture,
        side: THREE.DoubleSide,
        clippingPlanes: clippingPlanes,
        clipShadows: true
    });

    // 4. メッシュを作る
    earth = new THREE.Mesh(geometry, material);
    scene.add(earth);
}

// 緯度経度グリッドを作成する関数
function createLatLngGrid() {
    const radius = 101; // 地球より少し大きく

    // 経線を作成（0°から350°まで10°間隔）
    for (let lng = 0; lng < 360; lng += 10) {
        const meridian = createMeridian(lng, radius);
        meridians.push(meridian);
        scene.add(meridian);
    }

    // 緯線を作成（-80°から80°まで10°間隔、極地は除く）
    for (let lat = -80; lat <= 80; lat += 10) {
        if (lat !== 0) { // 赤道は別途作成
            const parallel = createParallel(lat, radius);
            parallels.push(parallel);
            scene.add(parallel);
        }
    }

    // 赤道線（特別扱い）
    const equator = createParallel(0, radius);
    equator.material.color.setHex(0xff6666); // 少し赤みがかった色
    parallels.push(equator);
    scene.add(equator);
}

// 経線を作成
function createMeridian(longitude, radius) {
    const points = [];
    for (let lat = -90; lat <= 90; lat += 2) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = longitude * Math.PI / 180;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
    }

    // より太い線を作成するためにTubeGeometryを使用
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, points.length - 1, 0.3, 8, false);
    const material = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.6
    });

    const line = new THREE.Mesh(geometry, material);
    line.userData = { type: 'meridian', longitude: longitude };
    return line;
}

// 緯線を作成
function createParallel(latitude, radius) {
    const points = [];
    const phi = (90 - latitude) * Math.PI / 180;
    const y = radius * Math.cos(phi);
    const circleRadius = radius * Math.sin(phi);

    for (let lng = 0; lng <= 360; lng += 2) {
        const theta = lng * Math.PI / 180;
        const x = circleRadius * Math.cos(theta);
        const z = circleRadius * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
    }

    // より太い線を作成するためにTubeGeometryを使用
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, points.length - 1, 0.3, 8, true); // 緯線は閉じた円なのでtrueに設定
    const material = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.6
    });

    const line = new THREE.Mesh(geometry, material);
    line.userData = { type: 'parallel', latitude: latitude };
    return line;
}

// 赤道面を作成
function createEquatorPlane() {
    const geometry = new THREE.CircleGeometry(100, 64);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });

    equatorPlane = new THREE.Mesh(geometry, material);
    equatorPlane.rotation.x = Math.PI / 2; // 水平に配置
    scene.add(equatorPlane);
}

// マウスイベントを設定
function setupMouseEvents() {
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
}

// マウス移動時の処理
function onMouseMove(event) {
    // マウス座標を正規化
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // レイキャスティング
    raycaster.setFromCamera(mouse, camera);

    // 全ての線をチェック（経線と緯線）
    const allLines = [...meridians, ...parallels];
    const intersects = raycaster.intersectObjects(allLines);

    // 前回ホバーしていた線をリセット
    if (hoveredLine) {
        hoveredLine.material.color.setHex(hoveredLine.userData.latitude === 0 ? 0xff6666 : 0x888888);
        hoveredLine.material.opacity = 0.6; // 透明度をリセット
        hoveredLine = null;
    }

    // 新しくホバーした線をハイライト
    if (intersects.length > 0) {
        hoveredLine = intersects[0].object;
        hoveredLine.material.color.setHex(0xffff00); // 黄色でハイライト
        hoveredLine.material.opacity = 1.0; // 不透明にしてより目立たせる
        renderer.domElement.style.cursor = 'pointer';
    } else {
        renderer.domElement.style.cursor = 'default';
    }
}

// マウスクリック時の処理
function onMouseClick(event) {
    if (hoveredLine) {
        const userData = hoveredLine.userData;

        if (userData.type === 'meridian') {
            // 経線クリック: その経度で縦に輪切り
            sliceByMeridian(userData.longitude);
        } else if (userData.type === 'parallel') {
            // 緯線クリック: その緯度より高緯度を切断
            cutByParallel(userData.latitude);
        }
    }
}

// 経線による縦の輪切り（半球）
function sliceByMeridian(longitude) {
    // クリッピングプレーンをリセット
    clippingPlanes.length = 0;

    // 指定した経度を基準に半球を切り出す
    const angle = longitude * Math.PI / 180;

    // 指定した経線を通る垂直面で地球を半分に切断
    // 法線ベクトルは経線に垂直な方向
    const normal = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const plane = new THREE.Plane(normal, 0);

    clippingPlanes.push(plane);

    // レンダラーにクリッピングプレーンを設定
    renderer.clippingPlanes = clippingPlanes;
    renderer.localClippingEnabled = true;

    // 地球のマテリアルを更新
    earth.material.clippingPlanes = clippingPlanes;
    earth.material.needsUpdate = true;
}

// 緯線による高緯度切断
function cutByParallel(latitude) {
    // クリッピングプレーンをリセット
    clippingPlanes.length = 0;

    // 指定した緯度のY座標を計算
    const y = 100 * Math.cos((90 - latitude) * Math.PI / 180);

    // 高緯度部分を切り取るプレーン
    if (latitude >= 0) {
        // 北半球の場合: 指定緯度より北側（Y座標が大きい部分）を切断
        const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), y);
        clippingPlanes.push(plane);
    } else {
        // 南半球の場合: 指定緯度より南側（Y座標が小さい部分）を切断
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
        clippingPlanes.push(plane);
    }

    // レンダラーにクリッピングプレーンを設定
    renderer.clippingPlanes = clippingPlanes;
    renderer.localClippingEnabled = true;

    // 地球のマテリアルを更新
    earth.material.clippingPlanes = clippingPlanes;
    earth.material.needsUpdate = true;
}

// アニメーションループ
function animate() {
    // 地球の自動回転を停止（コメントアウト）
    // earth.rotation.y += 0.002;

    // OrbitControlsを更新
    controls.update();

    // レンダリング
    renderer.render(scene, camera);

    // 次のフレームを要求
    requestAnimationFrame(animate);
}

// キーボードイベントを設定
function setupKeyboardEvents() {
    window.addEventListener('keydown', onKeyDown);
}

// キーボード押下時の処理
function onKeyDown(event) {
    if (event.key === 'r' || event.key === 'R') {
        resetEarth();
    }
}

// 地球をリセット
function resetEarth() {
    // クリッピングプレーンをクリア
    clippingPlanes.length = 0;
    renderer.clippingPlanes = [];
    renderer.localClippingEnabled = false;

    // 地球のマテリアルを更新
    earth.material.clippingPlanes = [];
    earth.material.needsUpdate = true;
}

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
