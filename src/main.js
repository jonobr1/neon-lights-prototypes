window.NeonLights = (function() {

  var DEBUG = url.boolean('debug', false);

  var $elems = new Elements({
    play: document.createElement('div')
  }).appendTo(document.body);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  var scene = new THREE.Scene();
  var cameras = new CameraAngles(new THREE.PerspectiveCamera());

  var annie = new Annie();
  var forest = new Forest();

  Equalizer.Resolution = 16;
  var timeline = new Equalizer.Timeline();
  var time = 0;

  var isLocal = /localhost/i.test(window.location.href)
  var root = isLocal ? './assets' : '//player-dev.cabrilleros.com/NEON_LIGHTS/assets';
  var filetype = has.Chromium ? 'ogg' : 'mp3';
  var path = [root, '/audio/03 Under Neon Lights.', filetype]
    .join('');

  var sound = new Sound(path, function() {

    var path = [root, '/json/03 Under Neon Lights ', Equalizer.Resolution,
      '.json'].join('');

    xhr.get(path, function(resp) {
      var data = JSON.parse(resp);
      timeline.analyze(sound, data);
      setup();
    });

  });

  function setup() {

    scene.add(annie);
    scene.add(forest);

    cameras.current.position.z = 512;
    cameras.current.position.y = 256;
    cameras.current.lookAt(forest.position);
    annie.add(cameras.current);

    $elems.append(renderer.domElement);

    if (DEBUG) {

      timeline.container = document.createElement('div');
      timeline.container.classList.add('timeline');

      Equalizer.Utils.extend(timeline.container.style, {
        position: 'absolute',
        top: 20 + 'px',
        left: 20 + 'px',
        paddingTop: 10 + 'px',
        background: Equalizer.Colors.white
      });

      timeline.appendTo(timeline.container, true);
      $elems.append(timeline.container);

    }

    $elems.forEach(function(elem, property) {
      if (elem.isContainer) {
        return;
      }
      elem.classList.add(property);
      $elems.append(elem);
    });

    $elems.play.addEventListener('click', play, false);

    Two.Utils.extend(renderer.domElement.style, {
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0
    });

    annie.controls.connect();

    window.addEventListener('resize', resize, false);
    resize();

    if (navigator.getVRDisplays || has.mobile) {
      renderer.effect = new THREE[!navigator.getVRDisplays ? 'StereoEffect' : 'VREffect'](renderer);
    } else {
      renderer.effect = renderer;
    }

    renderer.render(scene, cameras.current);
    $elems.content.classList.add('loaded');

  }

  function play() {

    if (sound.playing) {
      return;
    }

    requestStereo();

    $elems.play.classList.add('hidden');
    sound.play();

    if (!loop.init) {
      loop();
      loop.init = true;
    }

  }

  function pause() {
    sound.pause();
  }

  function loop() {

    var track, unit, currentTime = sound.currentTime;
    var dt = currentTime - time;
    time = currentTime;

    if (renderer.effect.requestAnimationFrame) {
      renderer.effect.requestAnimationFrame(loop);
    } else {
      requestAnimationFrame(loop);
    }

    if (DEBUG) {
      timeline.update();
    } else {
      // TODO: Update timeline track data based on current time...
      // Maybe not necessary?
    }

    annie.update();
    forest.update(annie.heading);

    var theta = forest.cursor.theta;

    // track = timeline.tracks[2];
    //
    // annie.step = sound.playing && track.isOn(currentTime) ? (0.06 + dt) : dt;

    // track = timeline.tracks[6];

    // forest.speed.destination = sound.playing
    //   ? (track.isOn(currentTime) ? 2 : 1)
    //   : 1;

    // annie.rotation.x = theta * 0.2;
    annie.cone.rotation.x = theta * 0.5 + Math.PI / 2;

    renderer.effect.render(scene, cameras.current);

  }

  function resize() {

    var width = window.innerWidth;
    var height = window.innerHeight;

    renderer.setSize(width, height);
    if (renderer.effect && renderer.effect.setSize) {
      renderer.effect.setSize(width, height);
    }

    renderer.width = width;
    renderer.height = height;

    cameras.aspect = width / height;

  }

  function requestStereo() {

    if (renderer.effect instanceof THREE.VREffect) {
      renderer.effect.requestPresent();
    } else {
      resize();
    }

  }

  return {
    annie: annie,
    cameras: cameras,
    forest: forest,
    timeline: timeline
  };

})();
