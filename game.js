let game;

window.onload = function() {
  var config = {
    type: Phaser.AUTO,
    width: 656,
    height: 332,
    physics: {
      default: 'arcade',
      arcade: {
          gravity: { y: 600 },
          debug: false
      }
    },
    scene: [preloadGame, playGame],
	};

	game = new Phaser.Game(config);
}

class preloadGame extends Phaser.Scene {

	constructor(){
		super("PreloadGame");
	}

	preload (){
		this.load.image('background', 'assets/background.png');
		this.load.image('ground', 'assets/foreground.png');
		this.load.image('bottle', 'assets/bottle.png');
		this.load.image('platform', 'assets/platform.png')
		this.load.image('clouds', 'assets/clouds.png')
		this.load.image('trashbin', 'assets/trashbin.png');
		this.load.image('recyclebin', 'assets/recyclebin.png');
		this.load.image('recyclebinClosed', 'assets/recyclebinClosed.png');
		this.load.image('victoryModal', 'assets/victoryModal.png');
		this.load.image('hoorayText', 'assets/hoorayText.png');
  }

  create (){
		// this.anims.create({
		// 	key: 'closeBin',
		// 	frames: [
		// 			{ key: 'recyclebinClosed', frame: null }
		// 	],
		// 	frameRate: 2,
		// 	repeat: false,
		// });

		this.scene.start("PlayGame");
  }
}

class playGame extends Phaser.Scene{
	constructor(){
		super("PlayGame");
		this.groundBody;
    this.player;
    this.trashbinGroup;
    this.background;
    this.victory = false;
    this.hitRecycleBin;
    this.playerRecycleCollider;
    this.cursors;
    this.gameStarted = true;
    this.numJumped = 0;
	}

	create() {
		//background images
		this.backgroundGroup = this.add.group();

  	// this.background = this.add.image(164, 166, 'background').setScale(1);

  	//this.add.image(180, 100, 'clouds').setScale(0.3);

  	this.anims.create({
			key: 'closeBin',
			frames: [
					{ key: 'recyclebinClosed', frame: null }
			],
			frameRate: 2,
			repeat: false,
		});

  	this.cloudGroup = this.add.group();

  	//physical ground body
  	this.groundBody = this.physics.add.staticGroup();
  	this.groundBody.create(200,355, 'platform').setScale(4).refreshBody();
  	
  	// this.groundBody.refreshBody();
  	
  	//player
    this.player = this.physics.add.sprite(100, 200, 'bottle').setScale(0.3);
		this.player.setCollideWorldBounds(true);

		//trashbins
		this.trashbinGroup = this.add.group();

		//recyclebins
		this.recyclebinGroup = this.add.group();

		//ground visual assets
		// this.add.image(200,305.3, 'ground').setScale(0.3);
		this.groundGroup = this.add.group();

		//physics 
		this.physics.add.collider(this.player, this.groundBody);
		this.physics.add.collider(this.trashbinGroup, this.groundBody);
		this.physics.add.collider(this.recyclebinGroup, this.groundBody);

		this.physics.add.overlap(this.player, this.trashbinGroup, this.playerDeath, null, this);

		//test to see that collision happens from top of recycle bin, bottom of player
		var recycleCollide = function(player,recyclebin){
			if(recyclebin.body.touching.up && player.body.touching.down){
				this.victory = true;
			} else { }
		};
		this.playerRecycleCollider = this.physics.add.overlap(this.player, this.recyclebinGroup, recycleOverlap);
		//alternative use of overlap instead of collide function
		var parent = this;

		var onCompleteHandler = function(tween, targets, image){
			console.log('handler');
			console.log(tween);
			console.log(targets[0]);
			console.log(image);
			image.anims.play('closeBin', true);
			parent.add.image(game.config.width/2, game.config.height/2, 'victoryModal').setScale(0.5);
			parent.add.image(game.config.width/2, game.config.height/2-50, 'hoorayText').setScale(0.3);
		}

		var recycleOverlap = function(player, recyclebin){
			if(player.body.touching.down 
				&& recyclebin.body.touching.up 
				&& player.y < recyclebin.y-30
				&& player.x < recyclebin.x+18
				&& player.x > recyclebin.x-20)
			{
				if(!this.victory){
					this.victory = true;
					parent.stopGame()
					player.body.allowGravity = false;
					player.body.setVelocityY(0);
					player.body.setVelocityX(0);
					this.hitRecycleBin = recyclebin;
					player.body.moves=false;
					recyclebin.body.moves=false;
					this.tween = parent.tweens.add({
						targets: player,
						x: recyclebin.x,
						y: recyclebin.y,
						ease: 'Linear',
						duration: 500,
						onComplete: onCompleteHandler,
						onCompleteParams: [recyclebin]
					});
				} else {}
			} else {}
		}

		var trashOverlap = function(player, trashbin){
				parent.playerDeath();
		}


		this.physics.add.overlap(this.player, this.recyclebinGroup, recycleOverlap);

		//keyboard access
		this.cursors = this.input.keyboard.createCursorKeys();

		//camera
		this.cameras.main.setBounds(0,0, 1500, 0);
		this.cameras.main.startFollow(this.player);

		this.addBackground();

		this.addCloud();

		this.addGround();

		//to be moved to start function
		this.addTrashbin();
	}

	update (){
  	if(this.victory){

  	} else {
  		if(this.gameStarted){
	    	if(this.cursors.space.isDown && this.player.body.touching.down){
	    		this.player.setVelocityY(-425);
	    	}

	    	this.recycleBackground();
		  	this.recycleCloud();
		  	this.recycleGround();
		  	this.recycleTrashbin();
		  	this.recycleRecyclebin();

		  	let rightMostTrashbin = this.getRightMostTrashbin();
				if(rightMostTrashbin < game.config.width/2){
					if(this.numJumped >=10 && this.numJumped%5==0){
						this.addRecyclebin();
					} else {
						this.addTrashbin();
					}
				}
  		} else {

  		}

  	}
  }

  addBackground(){
		let rightMostBackground = this.getRightMostBackground();
		if(rightMostBackground < (game.config.width+164)){
			let background = this.physics.add.image(rightMostBackground + 328, 
				166, "background");
			background.body.allowGravity = false;
			background.body.setVelocityX(-30);
			this.backgroundGroup.add(background);
			background.setDepth(-4);
			this.addBackground();
		}
	}

	getRightMostBackground(){
		let rightMostBackground = -200;
		this.backgroundGroup.getChildren().forEach(function(background){
			rightMostBackground = Math.max(rightMostBackground, background.x);
		});
		return rightMostBackground;
	}

	recycleBackground(){
		this.backgroundGroup.getChildren().forEach(function(background){
  		if(background.x < -background.displayWidth){
  			let rightMostBackground = this.getRightMostBackground();
  			background.x = rightMostBackground + 328;
  			background.y = 166;
  			background.setDepth(-4); 
  		}
  	}, this);
	}

	addCloud(){
		let rightMostCloud = this.getRightMostCloud();
		if(rightMostCloud < (game.config.width)){
			console.log('adcloud');
			let cloud = this.physics.add.image(rightMostCloud + game.config.width*0.75 + Phaser.Math.Between(100,300), 
				100 + Phaser.Math.Between(-20,50), "clouds").setScale(Phaser.Math.FloatBetween(0.18,0.32));
			cloud.body.allowGravity = false;
			cloud.body.setVelocityX(-15);
			this.cloudGroup.add(cloud);
			cloud.setDepth(-2);
			this.addCloud();
		}
	}

	getRightMostCloud(){
		let rightMostCloud = -200;
		this.cloudGroup.getChildren().forEach(function(cloud){
			rightMostCloud = Math.max(rightMostCloud, cloud.x);
		});
		return rightMostCloud;
	}

	recycleCloud(){
		this.cloudGroup.getChildren().forEach(function(cloud){
  		if(cloud.x < (-cloud.displayWidth)){
  			let rightMostCloud = this.getRightMostCloud();
  			cloud.x = rightMostCloud + game.config.width*0.75 + Phaser.Math.Between(100,300)
  			cloud.y = 100 + Phaser.Math.Between(-20,50);
  			cloud.setScale(Phaser.Math.FloatBetween(0.13,0.32));
  			cloud.setDepth(-2); 
  		}
  	}, this);
	}

	addGround(){
		let rightMostGround = this.getRightMostGround();
		if(rightMostGround < (game.config.width+164)){
			let ground = this.physics.add.image(rightMostGround + 328, 
				305.3, "ground").setScale(0.3);
			ground.body.allowGravity = false;
			ground.body.setVelocityX(-130);
			this.groundGroup.add(ground);
			ground.setDepth(1);
			this.addGround();
		}
	}

	getRightMostGround(){
		let rightMostGround = -200;
		this.groundGroup.getChildren().forEach(function(ground){
			rightMostGround = Math.max(rightMostGround, ground.x);
		});
		return rightMostGround;
	}

	recycleGround(){
		this.groundGroup.getChildren().forEach(function(ground){
  		if(ground.x < -ground.displayWidth){
  			let rightMostGround = this.getRightMostGround();
  			ground.x = rightMostGround + 328;
  			ground.y = 305.3;
  			ground.setDepth(1); 
  		}
  	}, this);
	}

	addTrashbin(){
		let rightMostTrashbin = this.getRightMostTrashbin();
		// console.log('add outside if');
		// if(rightMostTrashbin < game.config.width/2){
			let trashbin = this.physics.add.sprite(game.config.width + Phaser.Math.Between(30,200), 
				250, "trashbin").setScale(0.3);

			console.log('add trashbin');
			trashbin.body.setVelocityX(-130);
			this.trashbinGroup.add(trashbin);
			trashbin.setDepth(0);

			//side by side trashbin
			console.log(this.numJumped);
			if(this.numJumped>4){
				let coin = Phaser.Math.Between(0,2);
				console.log('coin');
				console.log(coin);
				if(coin == 0){
					let trashbin2 = this.physics.add.image(trashbin.x + trashbin.displayWidth, 
				250, "trashbin").setScale(0.3);
					trashbin2.body.setVelocityX(-130);
					this.trashbinGroup.add(trashbin2);
					trashbin2.setDepth(0);
				}
			}
			this.numJumped++;
	}

	getRightMostTrashbin(){
		let rightMostTrashbin = -200;
		this.trashbinGroup.getChildren().forEach(function(trashbin){
			rightMostTrashbin = Math.max(rightMostTrashbin, trashbin.x);
		});
		this.recyclebinGroup.getChildren().forEach(function(recyclebin){
			rightMostTrashbin = Math.max(rightMostTrashbin, recyclebin.x);
		});
		return rightMostTrashbin;
	}

	recycleTrashbin(){
		this.trashbinGroup.getChildren().forEach(function(trashbin){
  		if(trashbin.x < -trashbin.displayWidth){
  			// let rightMostTrashbin = this.getRightMostTrashbin();
  			// trashbin.x = game.config.width + Phaser.Math.Between(30,100);
  			// trashbin.y = 250;
  			// trashbin.setDepth(0); 
  			trashbin.destroy();
  		}
  	}, this);
	}

	addRecyclebin(){
		// console.log('add outside if');
		// if(rightMostTrashbin < game.config.width/2){
		let recyclebin = this.physics.add.sprite(game.config.width + Phaser.Math.Between(30,200), 
			250, "recyclebin").setScale(0.3);

		console.log('add trashbin');
		recyclebin.body.setVelocityX(-130);
		this.recyclebinGroup.add(recyclebin);
		recyclebin.setDepth(0);
		this.numJumped++;
	}

	recycleRecyclebin(){
		this.recyclebinGroup.getChildren().forEach(function(recyclebin){
  		if(recyclebin.x < -recyclebin.displayWidth){
  			// let rightMostTrashbin = this.getRightMostTrashbin();
  			// trashbin.x = game.config.width + Phaser.Math.Between(30,100);
  			// trashbin.y = 250;
  			// trashbin.setDepth(0); 
  			recyclebin.destroy();
  		}
  	}, this);
	}

	stopGame(){
		this.groundGroup.getChildren().forEach(function(ground){
			ground.setVelocityX(0);
  	}, this);

  	this.cloudGroup.getChildren().forEach(function(cloud){
			cloud.setVelocityX(-7.5);
		});

		this.backgroundGroup.getChildren().forEach(function(background){
			background.setVelocityX(0);
		});

		this.recyclebinGroup.getChildren().forEach(function(recyclebin){
			recyclebin.setVelocityX(0);
  	});

  	this.trashbinGroup.getChildren().forEach(function(trashbin){
  		trashbin.setVelocityX(0);
  	})
	}

  playerDeath(){
  	this.player.disableBody(true,true);
  	this.stopGame();
  }
}
