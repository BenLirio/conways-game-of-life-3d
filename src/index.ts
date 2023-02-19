import { AmbientLight, BoxGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PointLight, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const SCALE = 1
const updateSpeed = 100
const WIDTH = 800
const HEIGHT = 800
const shouldLive = (alive: boolean) => (neighborCount: number) => {
  if (alive) {
    if (neighborCount < 4 || neighborCount > 5) return false
  } else {
    if (neighborCount !== 5) return false
  }
  return true
}

const scene = new Scene();

const camera = new PerspectiveCamera(75, WIDTH/HEIGHT, 0.1, 1000);
camera.position.z = 30*SCALE

// add light
const sun = new AmbientLight(0x404040); // soft white light
scene.add(sun);
const pointLight = new PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 10*SCALE, 0);
scene.add(pointLight);

const cubesMap = new Map<string, Mesh>()
const geometry = new BoxGeometry(SCALE, SCALE, SCALE);
const material = new MeshStandardMaterial({ color: 0x00ff00 });

const createCube = (s: string) => {
  const [x, y, z] = s.split(',').map(Number)
  const cube = new Mesh(geometry, material);
  cube.position.set(x*SCALE, y*SCALE, z*SCALE);
  const key = `${x/SCALE},${y/SCALE},${z/SCALE}`
  cubesMap.set(key, cube)
  scene.add(cube)
  return cube
}
const removeCube = (cube: Mesh) => {
  const { x, y, z } = cube.position
  const key = `${x},${y},${z}`
  cubesMap.delete(key)
  scene.remove(cube)
}
const deleteCube = (s: string) => {
  const cube = cubesMap.get(s)
  if (cube) {
    removeCube(cube)
  }
}

const N = 10
for (let i = -N; i <= N; i++) {
  for(let j = -N; j <= N; j++) {
    for (let k = -N; k <= N; k++) {
      if (Math.random() < 0.7) continue
      createCube(`${i},${j},${k}`)
    }
  }
}


const renderer = new WebGLRenderer();

renderer.setSize(WIDTH, HEIGHT);
const controls = new OrbitControls(camera, renderer.domElement);
controls.update()

document.body.appendChild(renderer.domElement);

const neighborsOf = (key: string) => {
  const [x, y, z] = key.split(',').map(Number)
  const neighbors: string[] = []
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = -1; k <= 1; k++) {
        if (i === 0 && j === 0 && k === 0) continue
        neighbors.push(`${x + i},${y + j},${z + k}`)
      }
    }
  }
  return neighbors
}

let lastTime = new Date().getTime()
let curDelta = 0
const update = () => {
  const cubeIds = Array.from(cubesMap.keys())
  const neighborsMap = cubeIds.map(neighborsOf).flat().reduce((acc, key) => {
    acc.set(key, (acc.get(key) || 0) + 1)
    return acc
  }, new Map<string, number>())
  const removeList: string[] = []
  cubeIds.forEach(key => {
    const neighborCount = neighborsMap.get(key) || 0
    if (!shouldLive(true)(neighborCount)) {
      removeList.push(key)
    }
  })
  const addList = Array.from(neighborsMap.entries())
    .filter(([key, count]) => shouldLive(false)(count) && !cubesMap.has(key))
    .map(([key]) => key)
  removeList.forEach(deleteCube)
  addList.map(createCube)
}

const animate = () => {
  controls.update()
  curDelta += new Date().getTime() - lastTime
  lastTime = new Date().getTime()
  if (curDelta > updateSpeed) {
    curDelta -= updateSpeed
    update()
  }

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate()