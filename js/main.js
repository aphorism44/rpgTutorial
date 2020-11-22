//using tutorial: https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6

const config = {
  type: Phaser.AUTO, // Which renderer to use
  width: 800, // Canvas width in pixels
  height: 600, // Canvas height in pixels
  parent: "game-container", // ID of the DOM element to add the canvas to
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 } // Top down game, so no gravity
    }
  }
};

const game = new Phaser.Game(config);
let cursors;
let player;
let showDebug = false;

function preload() {
  this.load.image("hyptosis1", "../assets/hyptosis1.png");
  this.load.image("hyptosis1Block", "../assets/hyptosis1.png");
  //this.load.image("hyptosis3", "../assets/hyptosis2.png");
  //this.load.image("hyptosis4", "../assets/hyptosis4.png");
  this.load.tilemapTiledJSON("map", "../assets/map/sample.json");

  // An atlas is a way to pack multiple images together into one texture. I'm using it to load all
  // the player animations (walking left, walking right, etc.) in one image. For more info see:
  //  https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
  // If you don't use an atlas, you can do the same thing with a spritesheet, see:
  //  https://labs.phaser.io/view.html?src=src/animation/single%20sprite%20sheet.js
  this.load.atlas("atlas", "../assets/atlas.png"
  , "../assets/atlas.json");
    //, "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.json");
}



function create() {
  const map = this.make.tilemap({ key: "map" });

  // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
  // Phaser's cache (i.e. the name you used in preload)
  const tileset1 = map.addTilesetImage("hyptosis1", "hyptosis1");
  const tileset2 = map.addTilesetImage("hyptosis1Block", "hyptosis1Block");
  //const tileset3 = map.addTilesetImage("hyptosis3", "hyptosis3");
  //const tileset4 = map.addTilesetImage("hyptosis4", "hyptosis4");

  // Parameters: layer name (or index) from Tiled, tileset, x, y
  const baseLayer = map.createStaticLayer("baseLayer", [tileset1,tileset2], 0, 0);
  const overLayer = map.createStaticLayer("overLayer", [tileset1,tileset2], 0, 0);

  baseLayer.setCollisionByProperty({ blocked: true });
  overLayer.setCollisionByProperty({ blocked: true });

  player = this.physics.add.sprite(0, 0, "atlas", "misa-front")
    .setSize(30, 40)
    .setOffset(0, 24);
  this.physics.add.collider(player, [baseLayer, overLayer]);

  // Create the player's walking animations from the texture atlas. These are stored in the global
 // animation manager so any sprite can access them.
 const anims = this.anims;
 anims.create({
   key: "misa-left-walk",
   frames: anims.generateFrameNames("atlas", { prefix: "misa-left-walk.", start: 0, end: 3, zeroPad: 3 }),
   frameRate: 10,
   repeat: -1
 });
 anims.create({
   key: "misa-right-walk",
   frames: anims.generateFrameNames("atlas", { prefix: "misa-right-walk.", start: 0, end: 3, zeroPad: 3 }),
   frameRate: 10,
   repeat: -1
 });
 anims.create({
   key: "misa-front-walk",
   frames: anims.generateFrameNames("atlas", { prefix: "misa-front-walk.", start: 0, end: 3, zeroPad: 3 }),
   frameRate: 10,
   repeat: -1
 });
 anims.create({
   key: "misa-back-walk",
   frames: anims.generateFrameNames("atlas", { prefix: "misa-back-walk.", start: 0, end: 3, zeroPad: 3 }),
   frameRate: 10,
   repeat: -1
 });

 const camera = this.cameras.main;
 camera.startFollow(player);
 camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

 cursors = this.input.keyboard.createCursorKeys();

 // Help text that has a "fixed" position on the screen
 this.add
   .text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', {
     font: "18px monospace",
     fill: "#000000",
     padding: { x: 20, y: 10 },
     backgroundColor: "#ffffff"
   })
   .setScrollFactor(0)
   .setDepth(30);

 // Debug graphics
 this.input.keyboard.once("keydown_D", event => {
   // Turn on physics debugging to show player's hitbox
   this.physics.world.createDebugGraphic();

   // Create worldLayer collision graphic above the player, but below the help text
   const graphics = this.add
     .graphics()
     .setAlpha(0.75)
     .setDepth(20);


   baseLayer.renderDebug(graphics, {
     tileColor: null, // Color of non-colliding tiles
     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
   });
   overLayer.renderDebug(graphics, {
     tileColor: null, // Color of non-colliding tiles
     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
   });

 });

}

function update(time, delta) {
  const speed = 175;
  const prevVelocity = player.body.velocity.clone();

  // Stop any previous movement from the last frame
  player.body.setVelocity(0);

  // Horizontal movement
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  }

  // Vertical movement
  if (cursors.up.isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(speed);
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(speed);

  // Update the animation last and give left/right animations precedence over up/down animations
  if (cursors.left.isDown) {
    player.anims.play("misa-left-walk", true);
  } else if (cursors.right.isDown) {
    player.anims.play("misa-right-walk", true);
  } else if (cursors.up.isDown) {
    player.anims.play("misa-back-walk", true);
  } else if (cursors.down.isDown) {
    player.anims.play("misa-front-walk", true);
  } else {
    player.anims.stop();

    // If we were moving, pick and idle frame to use
    if (prevVelocity.x < 0) player.setTexture("atlas", "misa-left");
    else if (prevVelocity.x > 0) player.setTexture("atlas", "misa-right");
    else if (prevVelocity.y < 0) player.setTexture("atlas", "misa-back");
    else if (prevVelocity.y > 0) player.setTexture("atlas", "misa-front");
  }
}
