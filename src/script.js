import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

// Grass Textures
const grassColorTexture = textureLoader.load(
	'/textures/stone-floor/basecolor.jpg'
)
const grassAmbientOcclusionTexture = textureLoader.load(
	'/textures/stone-floor/ambientOcclusion.jpg'
)
const grassNormalTexture = textureLoader.load(
	'/textures/stone-floor/normal.jpg'
)
const grassRoughnessTexture = textureLoader.load(
	'/textures/stone-floor/roughness.jpg'
)
const grassHeightTexture = textureLoader.load(
	'/textures/stone-floor/height.png'
)

// Repeat grass texture
grassColorTexture.repeat.set(8, 8)
grassAmbientOcclusionTexture.repeat.set(8, 8)
grassNormalTexture.repeat.set(8, 8)
grassRoughnessTexture.repeat.set(8, 8)
grassHeightTexture.repeat.set(8, 8)

grassColorTexture.wrapS = THREE.RepeatWrapping
grassAmbientOcclusionTexture.wrapS = THREE.RepeatWrapping
grassNormalTexture.wrapS = THREE.RepeatWrapping
grassRoughnessTexture.wrapS = THREE.RepeatWrapping
grassHeightTexture.wrapS = THREE.RepeatWrapping

grassColorTexture.wrapT = THREE.RepeatWrapping
grassAmbientOcclusionTexture.wrapT = THREE.RepeatWrapping
grassNormalTexture.wrapT = THREE.RepeatWrapping
grassRoughnessTexture.wrapT = THREE.RepeatWrapping
grassHeightTexture.wrapT = THREE.RepeatWrapping

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
// Specify path to a folder containing WASM/JS decoding libraries.
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Duck
let model = null
gltfLoader.load('/models/Duck/glTF-Binary/Duck.glb', (gltf) => {
	model = gltf.scene
	model.traverse((node) => {
		if (node.isMesh) {
			node.castShadow = true
			node.receiveShadow = true
		}
	})
	scene.add(model)
})

/**
 * Floor
 */
const floor = new THREE.Mesh(
	new THREE.PlaneGeometry(20, 20, 100, 100),
	new THREE.MeshStandardMaterial({
		map: grassColorTexture,
		aoMap: grassAmbientOcclusionTexture,
		normalMap: grassNormalTexture,
		roughnessMap: grassRoughnessTexture,
		displacementMap: grassHeightTexture,
		displacementScale: 0.2,
		transparent: true,
	})
)
floor.geometry.setAttribute(
	'uv2',
	new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2)
)
floor.rotation.x = -Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#b9d5ff', 0.2)
gui
	.add(ambientLight, 'intensity')
	.min(0)
	.max(1)
	.step(0.001)
	.name('ambient intensity')
scene.add(ambientLight)

// Directional light
const moonLight = new THREE.DirectionalLight('#b9d5ff', 0.7)
moonLight.position.set(4, 5, -2)
moonLight.shadow.mapSize.width = 256
moonLight.shadow.mapSize.height = 256
moonLight.shadow.camera.far = 15
gui.add(moonLight, 'intensity').min(0).max(1).step(0.001).name('moon intensity')
gui.add(moonLight.position, 'x').min(-5).max(5).step(0.001)
gui.add(moonLight.position, 'y').min(-5).max(5).step(0.001)
gui.add(moonLight.position, 'z').min(-5).max(5).step(0.001)
scene.add(moonLight)

// Shadows
moonLight.castShadow = true
floor.receiveShadow = true

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// Update camera
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Mouse
 */
const mouse = new THREE.Vector2()
window.addEventListener('mousemove', (event) => {
	mouse.x = (event.clientX / sizes.width) * 2 - 1
	mouse.y = -(event.clientY / sizes.height) * 2 + 1
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
)
camera.position.set(3, 3.5, 6)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0
const raycaster = new THREE.Raycaster()

const tick = () => {
	const elapsedTime = clock.getElapsedTime()
	const deltaTime = elapsedTime - previousTime
	previousTime = elapsedTime

	/**
	 * Raycaster
	 */
	if (model) {
		raycaster.setFromCamera(mouse, camera)
		const modelIntersects = raycaster.intersectObject(model)
		if (modelIntersects.length) {
			model.scale.set(1.2, 1.2, 1.2)
		} else {
			model.scale.set(1, 1, 1)
		}
	}

	// Update controls
	controls.update()

	// Render
	renderer.render(scene, camera)

	// Call tick again on the next frame
	window.requestAnimationFrame(tick)
}

tick()
