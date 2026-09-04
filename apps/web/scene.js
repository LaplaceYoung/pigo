import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const STUD = 0.8;
const PLATE = 16;

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#0e0d0b", 30, 70);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  camera.position.set(18, 16, 22);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minDistance = 14;
  controls.maxDistance = 40;
  controls.target.set(0, 1.2, 0);

  scene.add(new THREE.AmbientLight(0xfff1d0, 0.55));
  const key = new THREE.DirectionalLight(0xffe6b0, 1.15);
  key.position.set(12, 20, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x88a0ff, 0.35);
  fill.position.set(-10, 8, -12);
  scene.add(fill);

  const plate = buildPlate();
  scene.add(plate);
  scene.add(buildNameplate());

  const brickGroup = new THREE.Group();
  scene.add(brickGroup);

  const slots = makeSlots();
  const dropping = [];
  let bounceT = 0;
  let onPick = null;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  canvas.addEventListener("pointerdown", (ev) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(brickGroup.children, true);
    if (!hits.length || !onPick) return;
    let obj = hits[0].object;
    while (obj && !obj.userData.brickId) obj = obj.parent;
    if (obj?.userData.brickId) onPick(obj.userData.brickId);
  });

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  function loop() {
    controls.update();
    plate.rotation.y = Math.sin(performance.now() / 8000) * 0.03;
    if (bounceT > 0) {
      bounceT -= 0.04;
      plate.position.x = Math.sin(bounceT * 18) * bounceT * 0.35;
    } else {
      plate.position.x = 0;
    }
    for (const item of dropping) {
      item.y = Math.max(item.targetY, item.y - 0.28);
      item.mesh.position.y = item.y;
    }
    for (let i = dropping.length - 1; i >= 0; i--) {
      if (dropping[i].y <= dropping[i].targetY) dropping.splice(i, 1);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();

  return {
    onPick(fn) {
      onPick = fn;
    },
    bounce() {
      bounceT = 1;
    },
    sync(selected) {
      const keep = new Set(selected.map((b) => b.id));
      for (let i = brickGroup.children.length - 1; i >= 0; i--) {
        const child = brickGroup.children[i];
        if (!keep.has(child.userData.brickId)) brickGroup.remove(child);
      }
      const existing = new Set(brickGroup.children.map((c) => c.userData.brickId));
      selected.forEach((brick, i) => {
        const slot = slots[i % slots.length];
        const targetY = slot.y + brickHeight(brick) / 2;
        if (existing.has(brick.id)) {
          const mesh = brickGroup.children.find((c) => c.userData.brickId === brick.id);
          if (mesh) mesh.position.set(slot.x, targetY, slot.z);
          return;
        }
        const mesh = buildBrick(brick, i);
        mesh.position.set(slot.x, targetY + 4.2, slot.z);
        brickGroup.add(mesh);
        dropping.push({ mesh, y: mesh.position.y, targetY });
      });
    },
  };
}

function brickHeight(brick) {
  return brick.studs >= 6 ? 1.6 : brick.studs >= 4 ? 1.2 : 0.8;
}

function makeSlots() {
  const out = [];
  const cols = 5;
  for (let i = 0; i < 20; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out.push({
      x: (c - 2) * 2.4,
      z: (r - 1.2) * 2.4,
      y: 0.55 + r * 0.02,
    });
  }
  return out;
}

function buildPlate() {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(PLATE * STUD + 0.6, 0.45, PLATE * STUD + 0.6);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3d3a34,
    roughness: 0.42,
    metalness: 0.08,
  });
  const base = new THREE.Mesh(geo, mat);
  base.receiveShadow = true;
  g.add(base);

  const studGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 16);
  const studMat = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.35 });
  const studs = new THREE.InstancedMesh(studGeo, studMat, PLATE * PLATE);
  const dummy = new THREE.Object3D();
  let n = 0;
  const origin = -((PLATE - 1) * STUD) / 2;
  for (let x = 0; x < PLATE; x++) {
    for (let z = 0; z < PLATE; z++) {
      dummy.position.set(origin + x * STUD, 0.3, origin + z * STUD);
      dummy.updateMatrix();
      studs.setMatrixAt(n++, dummy.matrix);
    }
  }
  g.add(studs);
  return g;
}

function buildNameplate() {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.7, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 }),
  );
  plate.position.set(0, 0.7, 7.2);
  g.add(plate);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = "#f5c400";
  ctx.font = "bold 110px Syne, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("pi", 256, 84);
  const tex = new THREE.CanvasTexture(canvas);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.95),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  label.position.set(0, 0.72, 7.76);
  g.add(label);
  return g;
}

function buildBrick(brick, index) {
  const g = new THREE.Group();
  const w = brick.studs >= 6 ? 3.2 : brick.studs >= 4 ? 2.4 : 1.6;
  const h = brickHeight(brick);
  const color = new THREE.Color(brick.color || "#1E90FF");
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 1.5),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.28,
      metalness: 0.05,
    }),
  );
  body.castShadow = true;
  g.add(body);

  const studGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 14);
  const studMat = new THREE.MeshStandardMaterial({
    color: color.clone().offsetHSL(0, 0, 0.08),
    roughness: 0.25,
  });
  const count = brick.studs >= 6 ? 4 : 2;
  for (let i = 0; i < count; i++) {
    const stud = new THREE.Mesh(studGeo, studMat);
    const span = count === 4 ? 1.05 : 0.55;
    stud.position.set(-span + (count === 4 ? i * 0.7 : i * 1.1), h / 2 + 0.08, 0);
    g.add(stud);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = "#111";
  ctx.font = "700 28px Syne, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((brick.nameZh || brick.name).slice(0, 16), 128, 34);
  const tex = new THREE.CanvasTexture(canvas);
  const tag = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.86, 0.42),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
  );
  tag.position.set(0, 0.05, 0.76);
  g.add(tag);
  g.userData.index = index;
  g.userData.brickId = brick.id;
  return g;
}
