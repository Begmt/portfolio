import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from '../avatar-guide/runtime/reconstruction/model-tools/node_modules/meshoptimizer/meshopt_decoder.mjs';

export async function mountAvatar(root) {
  const canvas = root.querySelector('canvas'), stage = root.querySelector('.avatar-stage');
  const status = root.querySelector('.avatar-status'), wave = root.querySelector('[data-avatar-wave]');
  const phones = root.querySelector('[data-avatar-phones]'), reset = root.querySelector('.avatar-reset');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
  camera.position.set(0, .02, 3.7);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  let gltf;
  try {
    const modelURL = new URL('./avatar-animated.glb', import.meta.url);
    modelURL.searchParams.set('v', MODEL_REVISION);
    gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
      .loadAsync(modelURL.href);
  } catch (error) {
    environment.dispose(); renderer.dispose(); throw error;
  }
  const model = gltf.scene, group = new THREE.Group();
  group.scale.setScalar(1.8); group.add(model); scene.add(group);
  const mixer = new THREE.AnimationMixer(model), phone = model.getObjectByName('Headphones');
  const clips = Object.fromEntries(gltf.animations.map(clip => [clip.name, clip]));
  if (!phone || !clips.Wave || !clips.HeadphonesOff) throw new Error('Incomplete avatar');
  const duration = clips.HeadphonesOff.duration, waveDuration = clips.Wave.duration;
  const savedPosition = new THREE.Vector3(), savedQuaternion = new THREE.Quaternion();
  let active, clipName = '', progress = 0, target = 0, mode = 'idle', waveTime = 0;
  let raf = 0, last = 0, visible = false, angle = 0, pointer = null, hovered = false, pinned = false;
  let draws = 0;
  const render = () => { if (visible && !document.hidden) { renderer.render(scene, camera); draws++; } };
  function action(name, time) {
    if (clipName !== name) {
      mixer.stopAllAction(); active = mixer.clipAction(clips[name]);
      active.reset().setLoop(THREE.LoopOnce, 1).play();
      active.clampWhenFinished = true; active.paused = true; clipName = name;
    }
    active.enabled = true; active.time = time; mixer.update(0);
  }
  function pose() {
    action('HeadphonesOff', progress);
    if (mode === 'wave') {
      savedPosition.copy(phone.position); savedQuaternion.copy(phone.quaternion);
      action('Wave', waveTime);
      phone.position.copy(savedPosition); phone.quaternion.copy(savedQuaternion);
    }
    model.updateMatrixWorld(true); render();
  }
  function ui() {
    wave.disabled = mode !== 'idle';
    phones.setAttribute('aria-pressed', String(target > 0));
    phones.textContent = target > 0 ? 'Надеть наушники' : 'Снять наушники';
    root.dataset.motion = mode;
    root.dataset.headphones = progress >= duration - .001 ? 'off' : progress <= .001 ? 'on' : 'moving';
  }
  function cancel() { cancelAnimationFrame(raf); raf = 0; last = 0; }
  function schedule() { if (!raf && visible && !document.hidden && mode !== 'idle') raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, .08) : 0;
    last = now;
    if (mode === 'phones') {
      progress += Math.sign(target - progress) * Math.min(Math.abs(target - progress), dt);
      if (Math.abs(target - progress) < .00001) {
        progress = target; mode = 'idle';
        status.textContent = progress ? 'Слушаю вас' : 'Наушники надеты';
      }
    } else if (mode === 'wave') {
      waveTime = Math.min(waveDuration, waveTime + dt);
      if (waveTime >= waveDuration) { mode = 'idle'; status.textContent = progress ? 'Слушаю вас' : 'Рад знакомству!'; }
    }
    pose(); ui();
    if (mode === 'idle') last = 0; else schedule();
  }
  function movePhones(value) {
    cancel(); target = value;
    if (reduced.matches || Math.abs(target - progress) < .00001) {
      progress = target; mode = 'idle';
      status.textContent = progress ? 'Слушаю вас' : 'Наушники надеты';
    } else { mode = 'phones'; status.textContent = value ? 'Снимаю наушники…' : 'Надеваю наушники…'; }
    pose(); ui(); schedule();
  }
  function rotate(value) {
    angle = value;
    camera.position.set(Math.sin(angle) * 3.7, .02, Math.cos(angle) * 3.7);
    camera.lookAt(0, 0, 0); render();
  }
  wave.addEventListener('click', () => {
    if (mode !== 'idle') return;
    cancel(); mode = 'wave'; waveTime = reduced.matches ? .65 : 0;
    status.textContent = 'Привет!'; pose();
    if (reduced.matches) { mode = 'idle'; } else schedule();
    ui();
  });
  phones.addEventListener('click', () => { pinned = target === 0; movePhones(pinned ? duration : 0); });
  reset.addEventListener('click', () => rotate(0));
  canvas.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); rotate(angle + (event.key === 'ArrowLeft' ? -.2 : .2));
    } else if (event.key === 'Home') { event.preventDefault(); rotate(0); }
  });
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointer = { id: event.pointerId, x: event.clientX, angle };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer?.id === event.pointerId) rotate(pointer.angle - (event.clientX - pointer.x) * .012);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, () => { pointer = null; });
  // Hover only the stage; moving to a button must not reverse its own gesture.
  stage.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && !pointer) { hovered = true; if (!pinned) movePhones(duration); }
  });
  stage.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') { hovered = false; if (!pinned) movePhones(0); }
  });
  const resize = new ResizeObserver(() => {
    const width = stage.clientWidth;
    renderer.setSize(width, width, false); render();
  });
  resize.observe(stage);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { render(); schedule(); } else cancel();
  });
  observer.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancel(); else { render(); schedule(); }
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches && mode !== 'idle') {
      cancel(); progress = target;
      if (mode === 'wave') waveTime = .65;
      pose(); mode = 'idle'; ui();
    }
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); cancel(); mode = 'idle'; root.dataset.state = 'unavailable';
    canvas.hidden = true; wave.disabled = phones.disabled = reset.disabled = true;
    status.textContent = '3D приостановлено. Обновите страницу, чтобы попробовать снова.';
  });
  renderer.setSize(stage.clientWidth, stage.clientWidth, false);
  const bounds = stage.getBoundingClientRect();
  visible = bounds.bottom > 0 && bounds.top < innerHeight;
  canvas.hidden = false; phones.disabled = reset.disabled = false;
  status.textContent = 'Рад знакомству!'; pose(); ui();
  // An opt-in hook for reproducible geometry, lifecycle and gesture checks.
  if (new URL(location.href).searchParams.has('avatar-test')) root.avatar = {
    model, camera, renderer, clips, phone, rotate, render,
    seek(name, time) { cancel(); if (name === 'Wave') { mode = 'wave'; waveTime = time; } else { mode = 'idle'; progress = time; target = time; } pose(); ui(); },
    state: () => ({ progress, target, mode, raf: !!raf, visible, angle, draws, hovered, pinned })
  };
  return { root };
}
