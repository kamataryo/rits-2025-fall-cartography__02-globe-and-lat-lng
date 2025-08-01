# Three.js 地球プロジェクト

Three.jsを使用して地球を表示し、マウス操作で回転できるWebアプリケーションです。

## 機能

- 3D地球の表示
- マウスドラッグによる回転操作
- マウスホイールによるズーム
- 右クリックドラッグによるパン（移動）
- 自動回転アニメーション

## ファイル構成

```
├── index.html          # メインHTMLファイル
├── main.js            # Three.jsのメインロジック
├── assets/            # テクスチャ画像フォルダ
│   └── earthmap1k.jpg # 地球のテクスチャ画像
└── README.md          # このファイル
```

## セットアップ

### 1. 地球テクスチャのダウンロード

地球のテクスチャ画像を以下のサイトからダウンロードしてください：

**Planet Pixel Emporium**
- URL: http://planetpixelemporium.com/earth.html
- ダウンロードリンク: [Earth Color Map 1K](http://planetpixelemporium.com/download/download.php?earthmap1k.jpg)

ダウンロードした画像を `assets/earthmap1k.jpg` として保存してください。

#### コマンドラインでのダウンロード例：
```bash
# assetsフォルダを作成
mkdir -p assets

# 地球テクスチャをダウンロード
curl -o assets/earthmap1k.jpg "http://planetpixelemporium.com/download/download.php?earthmap1k.jpg"
```

### 2. 実行方法

1. ローカルサーバーを起動してください（CORS制限のため）：
   ```bash
   # Python 3の場合
   python -m http.server 8000
   
   # Python 2の場合
   python -m SimpleHTTPServer 8000
   
   # Node.jsのhttp-serverを使用する場合
   npx http-server
   ```

2. ブラウザで `http://localhost:8000` にアクセス

## 操作方法

- **回転**: マウス左ボタンでドラッグ
- **ズーム**: マウスホイール
- **パン（移動）**: マウス右ボタンでドラッグ

## ライセンス

### 地球テクスチャ
- Copyright © James Hastings-Trew
- 出典: [Planet Pixel Emporium](http://planetpixelemporium.com/earth.html)
- 1Kバージョンは無料で利用可能

### コード
- このプロジェクトのコードはMITライセンスの下で公開されています

## 技術仕様

- **Three.js**: r128
- **OrbitControls**: マウス操作制御
- **WebGL**: 3Dレンダリング
- **ES6モジュール**: モダンJavaScript

## カスタマイズ

### 地球の色を変更
`main.js`の`createEarth()`関数内で色を変更できます：
```javascript
let material = new THREE.MeshPhongMaterial({
    color: 0x4169E1, // この値を変更
    shininess: 30
});
```

### 回転速度の調整
`animate()`関数内で回転速度を調整できます：
```javascript
earth.rotation.y += 0.002; // この値を変更（大きくすると速く回転）
```

### カメラ位置の調整
初期化処理でカメラの位置を変更できます：
```javascript
camera.position.set(0, 0, 600); // x, y, z座標を調整
