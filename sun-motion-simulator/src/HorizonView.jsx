import React from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import 'three/OrbitControls';
import 'three/DragControls';

// three.js/react integration based on:
// https://stackoverflow.com/a/46412546/173630
export default class HorizonView extends React.Component {
    constructor(props) {
        super(props);

        this.id = 'HorizonView';
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.animate = this.animate.bind(this);
    }

    componentDidMount() {
        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;

        // well, since it's a square for now the aspect will be 1.
        const aspect = width / height;
        const frustumSize = 100;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2,
            frustumSize / 2, frustumSize / -2,
            1, 1000
        );
        camera.position.set(-60, 20, 0);

        const controls = new THREE.OrbitControls(camera, this.mount);
        // Configure the controls - we only need some basic
        // drag-rotation behavior.
        controls.enableKeys = false;
        controls.enablePan = false;
        controls.enableZoom = false;

        // Only let the user see the top of the scene - no need to
        // flip it completely over.
        controls.minPolarAngle = THREE.Math.degToRad(0);
        controls.maxPolarAngle = THREE.Math.degToRad(70);

        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0xffffff);

        // This is an anti-aliasing fix. On my system, anti-aliasing
        // was working on Firefox, but not Chrome.
        // Set the renderer size to twice the size of the actual
        // canvas. The physical dimensions remain at 228x228,
        // idea came from here: https://stackoverflow.com/a/44460635/173630
        // The browser then scales this down to the smaller size, smoothing
        // out all edges.
        renderer.setSize(width * 2, height * 2, false);

        controls.update();

        this.drawPlane(scene);
        this.drawStickFigure(scene);
        this.drawGlobe(scene);
        this.moon = this.drawMoon(scene);
        this.sun = this.drawSun(scene);

        // Put the sun, moon, and orbit line into a group so I can
        // rotate them all on the same axis.
        this.orbitGroup = new THREE.Group();
        this.orbitGroup.add(this.sun);
        this.orbitGroup.add(this.moon);
        this.orbitGroup.add(this.celestialEquator);
        this.orbitGroup.add(this.angleEllipse);
        this.orbitGroup.rotation.x = THREE.Math.degToRad(-50);
        scene.add(this.orbitGroup);

        /*new THREE.DragControls(
            [this.sun, this.moon], camera, renderer.domElement);*/
        //dragControls.enabled = false;

        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mount.appendChild(this.renderer.domElement);
        this.start();
    }
    drawPlane(scene) {
        const texture = new THREE.TextureLoader().load('img/plane.svg');
        const material = new THREE.MeshBasicMaterial({
            map: texture
        });
        material.map.minFilter = THREE.LinearFilter;
        const geometry = new THREE.CircleGeometry(50, 64);
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = THREE.Math.degToRad(-90);
        scene.add(plane);
    }
    drawGlobe(scene) {
        var domeGeometry = new THREE.SphereGeometry(
            50, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2);
        const nightDomeMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.6,
            color: 0x000000,
            side: THREE.DoubleSide
        });
        const nightDome = new THREE.Mesh(domeGeometry, nightDomeMaterial);
        nightDome.rotation.x = Math.PI;
        scene.add(nightDome);

        this.skyMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.4,
            color: 0x90c0ff,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const dayDome = new THREE.Mesh(domeGeometry, this.skyMaterial);
        scene.add(dayDome);

        const lineMaterial = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 0.5,
            color: 0xffffff,
            linewidth: 2
        });

        // The EdgesGeometry is necessary to fix a problem when
        // drawing lines on CircleGeometry.
        // https://stackoverflow.com/q/51525988/173630
        const discGeometry = new THREE.EdgesGeometry(
            new THREE.CircleGeometry(50, 64));

        // A north-south line
        const observersMeridian = new THREE.LineSegments(
            discGeometry, lineMaterial);
        observersMeridian.rotation.y = THREE.Math.degToRad(90);
        scene.add(observersMeridian);

        // An east-west line at the top of the observer's globe
        const zenithEquator = new THREE.LineSegments(discGeometry, lineMaterial);
        zenithEquator.rotation.z = THREE.Math.degToRad(90);
        scene.add(zenithEquator);

        // The sun and moon orbit along this next line.
        const thickLineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 4
        });
        this.celestialEquator = new THREE.LineSegments(
            discGeometry, thickLineMaterial);
        this.celestialEquator.rotation.x = THREE.Math.degToRad(90);
    }
    drawStickFigure(scene) {
        const spriteMap = new THREE.TextureLoader().load('img/stickfigure.svg');
        const spriteMaterial = new THREE.SpriteMaterial({
            map: spriteMap
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(5, 10, 5);
        sprite.position.y = 4.5;
        scene.add(sprite);
    }
    drawSun() {
        const material = new THREE.MeshBasicMaterial({
            color: 0xffdd00,
            side: THREE.DoubleSide
        });
        const geometry = new THREE.CircleGeometry(5, 32);
        const edges = new THREE.EdgesGeometry(geometry);
        const border = new THREE.LineLoop(edges, new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 3
        }));

        const sun = new THREE.Mesh(geometry, material);
        const group = new THREE.Group();

        group.add(sun);
        group.add(border);
        group.position.set(50, 1, 0);
        return group;
    }
    drawMoon() {
        const material = new THREE.MeshBasicMaterial({
            color: 0xbbbbbb,
            side: THREE.DoubleSide
        });
        const geometry = new THREE.CircleGeometry(5, 32);
        const edges = new THREE.EdgesGeometry(geometry);
        const border = new THREE.LineLoop(edges, new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 3
        }));

        const moon = new THREE.Mesh(geometry, material);
        const group = new THREE.Group();

        group.add(moon);
        group.add(border);
        group.position.set(50, 1, 0);
        return group;
    }
    updateAngleGeometry(ellipse, observerAngle, moonObserverPos) {
        const angleDiff = Math.abs(observerAngle - moonObserverPos);
        const curve = new THREE.EllipseCurve(
            0,  0,    // ax, aY
            50, 50,   // xRadius, yRadius
            // aStartAngle, aEndAngle
            0,  angleDiff,
            false,    // aClockwise
            0         // aRotation
        );

        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        ellipse.geometry = geometry;
    }
    componentWillUnmount() {
        this.stop();
        this.mount.removeChild(this.renderer.domElement);
    }

    start() {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
        }
    }

    stop() {
        cancelAnimationFrame(this.frameId)
    }

    animate() {
        this.sun.position.x = 50 * Math.cos(this.props.observerAngle);
        this.sun.position.z = 50 * Math.sin(this.props.observerAngle);
        this.sun.rotation.y = -this.props.observerAngle +
                              THREE.Math.degToRad(90);

        this.skyMaterial.color.setHex(this.getSkyColor(this.props.observerAngle));

        this.moon.position.x = 50 * Math.cos(this.props.moonObserverPos);
        this.moon.position.z = 50 * Math.sin(this.props.moonObserverPos);
        this.moon.rotation.y = -this.props.moonObserverPos + THREE.Math.degToRad(90);

        this.renderScene();
        this.frameId = window.requestAnimationFrame(this.animate);
    }

    renderScene() {
        this.renderer.render(this.scene, this.camera);
    }

    /*
     * Returns the time, given the angle of the sun.
     */
    getTime(observerAngle) {
        // Convert from radian to angle, since it's easier to deal
        // with.
        const angle = THREE.Math.radToDeg(observerAngle);
        const seconds = angle / (360 / 24) * 3600;
        const d1 = new Date('1/1/2018 6:00 AM');
        return new Date(d1.getTime() + (seconds * 1000));
    }

    /*
     * Given the observer angle, return what color the sky should
     * be. It fades between blue and black.
     *
     * Returns a hex value.
     */
    getSkyColor(angle) {
        if (angle < 0 || angle > Math.PI) {
            return 0x000000;
        }
        return 0x90c0ff;
    }

    render() {
        return (
            <React.Fragment>
            <div id={this.id}
                 style={{
                     width: '400px',
                     height: '400px'
                 }}
                 ref={(mount) => { this.mount = mount }} />
            </React.Fragment>
        );
    }
}

HorizonView.propTypes = {
    observerAngle: PropTypes.number.isRequired,
    moonObserverPos: PropTypes.number.isRequired
};