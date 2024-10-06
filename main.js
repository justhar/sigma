import * as THREE from "three";
import { gsap } from "gsap";
import { getFresnelMat } from "./src/fresnel";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import Lenis from "lenis";
import { TextPlugin } from "gsap/all";
const lenis = new Lenis();

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 600);
});

gsap.ticker.lagSmoothing(0);
let rotationSpeed = 0.01;

let scene, camera, renderer, planet, core, main, composer, glitchPass;

let speed = 1;

let rotationSpeedChange = false;

const slowDownFactor = 0.98;
let flagsAdded = false;

const data = {
  radius: 10,
  widthSegments: 64,
  heightSegments: 64,
  phiStart: 0,
  phiLength: Math.PI * 2,
  thetaStart: 0,
  thetaLength: Math.PI,
};

init();
intro();
animate();

function init() {
  const textureLoader = new THREE.TextureLoader();
  scene = new THREE.Scene();
  planet = new THREE.Group();
  gsap.registerPlugin(ScrollTrigger);
  gsap.registerPlugin(TextPlugin);

  camera = new THREE.PerspectiveCamera(
    10,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  let geometry = new THREE.SphereGeometry(
    data.radius,
    data.widthSegments,
    data.heightSegments,
    data.phiStart,
    data.phiLength,
    data.thetaStart
  );

  const coreTexture = textureLoader.load("assets/core.jpg");
  const coreGeometry = new THREE.SphereGeometry(3, 64, 64);
  const coreMaterial = new THREE.MeshPhongMaterial({
    map: coreTexture,
    // opacity: 0.9,
    transparent: true,
  });
  core = new THREE.Mesh(coreGeometry, coreMaterial);

  renderer.localClippingEnabled = true;

  const fresnelMat = getFresnelMat();
  const glowMesh = new THREE.Mesh(geometry, fresnelMat);
  const texture = textureLoader.load("assets/surface.jpg");
  const material = new THREE.MeshBasicMaterial({
    map: texture,
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  main = new THREE.Mesh(geometry, material);

  glowMesh.scale.setScalar(1.03);
  planet.add(core);
  planet.add(glowMesh);
  planet.add(main);
  scene.add(planet);

  planet.position.x = 20;
  planet.position.z = 0;
  planet.position.y = -10;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  glitchPass = new GlitchPass({
    dt_size: 128,
    center: [0.5, 0.5],
    goWild: true,
  });
  composer.addPass(glitchPass);
  glitchPass.enabled = false;

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const Pgeometry = new THREE.BufferGeometry();

  const vertices = [];

  for (let i = 0; i < 10000; i++) {
    vertices.push(THREE.MathUtils.randFloatSpread(2000));
    vertices.push(THREE.MathUtils.randFloatSpread(2000));
    vertices.push(THREE.MathUtils.randFloatSpread(2000));
  }

  Pgeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 4)
  );

  const particles = new THREE.Points(
    Pgeometry,
    new THREE.PointsMaterial({ color: 0x888888 })
  );
  scene.add(particles);

  window.addEventListener("resize", onWindowResize);
  document.body.appendChild(renderer.domElement);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (rotationSpeedChange == true) {
    rotationSpeed *= slowDownFactor;
  }

  planet.rotation.y += rotationSpeed;

  composer.render();
}

function intro() {
  const intro = gsap.timeline();
  intro
    .to(planet.position, {
      x: 13,
      y: -6,
      z: -90,
      ease: "circ.out",
      duration: 4,
    })
    .fromTo(
      ".header",
      { opacity: 0, y: "-100%" },
      { opacity: 1, y: "0%", ease: "power1.inOut", duration: 1 },
      "-=3 "
    )
    .fromTo(
      ".hero",
      { opacity: 0, x: "-100%" },
      { opacity: 1, x: "0%", ease: "power1.inOut", duration: 4, zIndex: 1 },
      "-=3"
    )
    .fromTo(
      ".scroll",
      { opacity: 0, y: "+100%" },
      {
        opacity: 1,
        zIndex: 1,
        y: "0%",
        ease: "power3.inOut",
        duration: 2,
        onComplete: setupScroll,
      },
      "-=4"
    );
}

function generateGeometry(thetaStart) {
  main.geometry.dispose();
  main.geometry = new THREE.SphereGeometry(
    data.radius,
    data.widthSegments,
    data.heightSegments,
    thetaStart,
    data.phiLength,
    data.thetaStart,
    data.thetaLength
  );
}

function setupScroll() {
  document.body.style.overflowY = "scroll";

  const ma = gsap.timeline();
  ma.to(planet.position, {
    x: -12,
    y: 0,
    z: -130,
    scrollTrigger: {
      trigger: ".second",
      start: "top bottom",
      end: "top top",
      scrub: true,
      immediateRender: false,
    },
  })
    .to(".hero", {
      xPercent: -110,
      scrollTrigger: {
        trigger: ".second",
        start: "top bottom",
        end: "top top",
        scrub: 0,
        immediateRender: false,
        pin: ".content-hero",
      },
    })
    .fromTo(
      ".right",
      { opacity: 0, x: "+3%" },
      {
        opacity: 1,
        x: "0%",
        duration: 3,
        zIndex: 1,
        scrollTrigger: {
          trigger: ".second",
          start: "top bottom",
          end: "top top",
          scrub: 0,
          immediateRender: false,
        },
      }
    )
    .to(planet.position, {
      x: -50,
      y: 0,
      z: -125,
      ease: "none",
      scrollTrigger: {
        trigger: ".content-bath",
        start: "bottom bottom",
        end: "+=800",
        scrub: true,
        immediateRender: false,
      },
      onComplete: () => {
        gsap.set(planet.position, {
          x: 40,
          y: 0,
          z: -50,
        });
      },
    })
    .to(planet.position, {
      x: 13,
      y: 0,
      z: -25,
      ease: "none",
      scrollTrigger: {
        trigger: ".fifth",
        start: "top bottom",
        end: "center top",
        immediateRender: false,
        scrub: true,
      },
    })
    .to(".content-bath p", {
      x: () => "-300%",
      ease: "none",
      scrollTrigger: {
        trigger: ".content-bath",
        start: "top top",
        end: () => "+=10000",
        scrub: true,
        pin: ".content-bath",
        anticipatePin: 1,
      },
    })
    .to(planet.position, {
      x: 0,
      y: 0,
      z: -120,
      ease: "none",
      scrollTrigger: {
        trigger: ".eighth",
        start: "top bottom",
        end: "center top",

        immediateRender: false,
        scrub: true,
      },
    })
    .to(planet.rotation, {
      x: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".eighth",
        start: "top bottom",
        end: "center top",
        immediateRender: false,
        scrub: true,
      },
    })
    .to(data, {
      thetaStart: "1.72787595947439",
      ease: "none",
      scrollTrigger: {
        trigger: ".eighth",
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
        onUpdate: () => generateGeometry(data.thetaStart),
      },
    })
    .fromTo(
      ".up",
      {
        x: "-150%",
      },
      {
        x: "+150%",
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".eighth",
          start: "top top",
          end: "bottom bottom",
          scrub: 0,
          pin: ".container",
        },
      }
    )
    .to(planet.position, {
      x: -10,
      ease: "none",
      scrollTrigger: {
        trigger: ".ninth",
        start: "top bottom",
        end: "center top",
        immediateRender: false,
        scrub: true,
      },
    })
    .set(glitchPass, {
      enabled: true,
      scrollTrigger: {
        trigger: ".ninth",
        start: "bottom bottom",
        end: "bottom bottom",
      },
      onComplete: () => {
        planet.visible = false;
      },
    })
    .to(".err", {
      ease: "none",
      scrollTrigger: {
        trigger: ".tenth",
        start: "top center",
        end: "center top",
        immediateRender: false,
        scrub: true,
        pin: ".tenth",
      },
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const draggables = document.querySelectorAll(".draggable");
  const dropZones = document.querySelectorAll(".drop");

  draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", dragStart);
  });

  dropZones.forEach((dropZone) => {
    dropZone.addEventListener("dragover", dragOver);
    dropZone.addEventListener("drop", drop);
  });

  function dragStart(event) {
    const value = event.target.dataset.value;
    if (value) {
      event.dataTransfer.setData("text/plain", value);
      event.dataTransfer.effectAllowed = "move";
    } else {
      console.error("Dragged element does not have a data-value attribute.");
    }
  }

  function dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  let finn = 0;
  function drop(event) {
    event.preventDefault();
    const imageValue = event.dataTransfer.getData("text/plain");
    const dropZoneValue = event.target.dataset.value;

    const img = document.querySelector(`img[data-value="${imageValue}"]`);

    if (finn == 8) {
      document.getElementById("reveal").style.display = "block";
      glitchPass.enabled = false;
      planet.visible = true;
      gsap.set(planet.position, {
        x: 0,
        y: 0,
        z: -120,
      });
      gsap.set(planet.rotation, {
        x: 0,
      });
    }
    img.style.visibility = "visible";
    if (imageValue == dropZoneValue) {
      event.target.appendChild(img);
      img.style.width = "150px";
      img.style.height = "auto";
      event.target.dataset.value = imageValue;
      finn++;
      img.dataset.value = dropZoneValue;
    } else {
      event.target.style.backgroundColor = "red";
      setTimeout(() => {
        event.target.style.backgroundColor = "";
      }, 1000);
    }
  }
});
