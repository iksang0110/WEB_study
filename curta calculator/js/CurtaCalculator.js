import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

class CurtaCalculator {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.calculator = new THREE.Group();
        this.handle = null;
        this.sliders = [];
        this.display = null;
        this.currentValue = 0;
        this.font = null;
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 5, 10);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        this.addLights();
        this.loadFont();

        this.animate();
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    loadFont() {
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.font = font;
            this.createCalculator();
            this.setupInteraction();
        });
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
    }

    createCalculator() {
        // 계산기 본체
        const bodyGeometry = new THREE.CylinderGeometry(2, 2, 4, 32);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.calculator.add(body);

        // 핸들
        const handleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 16);
        const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        this.handle = new THREE.Mesh(handleGeometry, handleMaterial);
        this.handle.position.set(0, 2.5, 0);
        this.calculator.add(this.handle);

        // 슬라이더들
        for (let i = 0; i < 8; i++) {
            const sliderGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
            const sliderMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
            const slider = new THREE.Mesh(sliderGeometry, sliderMaterial);
            slider.position.set(-1.5 + i * 0.4, 1, 1.9);
            this.sliders.push(slider);
            this.calculator.add(slider);
        }

        // 디스플레이
        const displayGeometry = new THREE.PlaneGeometry(3, 0.5);
        const displayMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        this.display = new THREE.Mesh(displayGeometry, displayMaterial);
        this.display.position.set(0, 1, 2.01);
        this.calculator.add(this.display);

        this.scene.add(this.calculator);
        this.updateDisplay();
    }

    setupInteraction() {
        this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseDown(event) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);

        const intersects = raycaster.intersectObjects([this.handle, ...this.sliders], true);
        
        if (intersects.length > 0) {
            this.selectedObject = intersects[0].object;
            this.controls.enabled = false;
        }
    }

    onMouseMove(event) {
        if (this.selectedObject) {
            if (this.selectedObject === this.handle) {
                this.rotateHandle(event);
            } else if (this.sliders.includes(this.selectedObject)) {
                this.moveSlider(event);
            }
        }
    }

    onMouseUp() {
        this.selectedObject = null;
        this.controls.enabled = true;
    }

    rotateHandle(event) {
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        this.handle.rotation.y += movementX * 0.01;
        this.calculate();
    }

    moveSlider(event) {
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        const slider = this.selectedObject;
        slider.position.y = Math.max(0.6, Math.min(1.4, slider.position.y - movementY * 0.01));
        this.updateCurrentValue();
    }

    updateCurrentValue() {
        this.currentValue = this.sliders.reduce((sum, slider, index) => {
            return sum + Math.floor((slider.position.y - 0.6) * 10) * Math.pow(10, index);
        }, 0);
        this.updateDisplay();
    }

    calculate() {
        // 간단한 계산 예시: 핸들을 돌릴 때마다 현재 값에 1을 더함
        this.currentValue += 1;
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.display.children.length > 0) {
            this.display.remove(this.display.children[0]);
        }
        if (this.font) {
            const textGeometry = new TextGeometry(this.currentValue.toString(), {
                font: this.font,
                size: 0.3,
                height: 0.05,
            });
            const textMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(-0.5, -0.15, 0.01);
            this.display.add(textMesh);
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// 계산기 인스턴스 생성
new CurtaCalculator();