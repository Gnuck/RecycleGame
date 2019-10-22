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
		this.anims.create({
			key: 'closeBin',
			frames: [
					{ key: 'recyclebinClosed', frame: null }
			],
			frameRate: 2,
			repeat: false,
		});

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
    this.gameStarted = false;
    this.numJumped = 0;

    this.startModal;
    this.trashLabel;
    this.trashIcon;
    this.recycleLabel;
    this.recycleIcon;
    this.startLabel;
    this.jumpLabel;

    this.loseModal;
    this.resetLabel;

    this.gameOver = false;
	}

	create() {
		//background images
		this.backgroundGroup = this.add.group();

  	// this.background = this.add.image(164, 166, 'background').setScale(1);

  	//this.add.image(180, 100, 'clouds').setScale(0.3);

  // 	this.anims.create({
		// 	key: 'closeBin',
		// 	frames: [
		// 			{ key: 'recyclebinClosed', frame: null }
		// 	],
		// 	frameRate: 2,
		// 	repeat: false,
		// });

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
		this.playerRecycleCollider = this.physics.add.overlap(this.player, this.recyclebinGroup, this.recycleOverlap);
		//alternative use of overlap instead of collide function
		var parent = this;

		var onCompleteHandler = function(tween, targets, image){
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
		this.inputs = this.input.keyboard.addKeys('ENTER');
		//camera
		this.cameras.main.setBounds(0,0, 1500, 0);
		// this.cameras.main.startFollow(this.player);

  	this.addBackground();
		this.addCloud();
		this.addGround();

		//start modal
		this.startModal = parent.add.image(game.config.width/2, game.config.height/2-30, 'victoryModal').setScale(0.5);
		
		this.trashLabel = this.add.text(
			this.startModal.x-this.startModal.displayWidth/2 +30, 
			this.startModal.y-this.startModal.displayHeight/2 + 30, 
			'Avoid Trash bins:', 
			{color: 'black', fontFamily: 'Verdana, "Time New Roman", Tahoma, serif' });
		this.trashIcon = parent.add.image(this.trashLabel.x+this.trashLabel.width+30, this.trashLabel.y+5, 'trashbin').setScale(0.2);

		this.recycleLabel = this.add.text(
			this.trashLabel.x, 
			this.trashLabel.y+50, 
			'Jump INTO Recycle bins:', 
			{color: 'black', fontFamily: 'Verdana, "Time New Roman", Tahoma, serif' });
		this.recycleIcon = parent.add.image(this.recycleLabel.x+this.recycleLabel.width+30, this.recycleLabel.y+5, 'recyclebin').setScale(0.2);

		this.jumpLabel = this.add.text(
		this.startModal.x, 
		this.recycleLabel.y+50, 
		'Press SPACE to jump', 
		{color: 'black', fontFamily: 'Verdana, "Time New Roman", Tahoma, serif' });
		this.jumpLabel.x = this.jumpLabel.x- this.jumpLabel.width/2;

		this.startLabel = this.add.text(
		this.startModal.x, 
		this.jumpLabel.y+50, 
		'Press ENTER to start', 
		{color: 'black', fontSize: 20, fontFamily: 'Verdana, "Time New Roman", Tahoma, serif' });
		this.startLabel.x = this.startLabel.x - this.startLabel.width/2;

		this.loseModal = parent.add.image(game.config.width/2, game.config.height/2-30, 'victoryModal').setScale(0.5);
		this.resetLabel = this.add.text(
		this.loseModal.x, 
		this.loseModal.y, 
		'Press ENTER to restart', 
		{color: 'black', fontSize: 20, fontFamily: 'Verdana, "Time New Roman", Tahoma, serif' });
		this.resetLabel.x = this.resetLabel.x - this.resetLabel.width/2;
		this.loseModal.setVisible(false);
		this.resetLabel.setVisible(false);

		this.input.keyboard.on('keydown_ENTER', function(event){
			if(parent.victory){

			} else {
				if(parent.gameStarted && !parent.gameOver){

				} else if (parent.gameOver){
					parent.restartGame();
				} else {
					parent.hideStartModal();
  				parent.gameStarted = true;
				}
			}
		});

		this.input.keyboard.on('keydown_SPACE', function(event){
			if(!parent.victory){
				if(parent.gameStarted && !parent.gameOver){
					if(parent.player.body.touching.down){
	    			parent.player.setVelocityY(-425);
	    		}
				}
			}
		});
	}

	update (){
  	if(this.victory){

  	} else {
  		if(this.gameStarted && !this.gameOver){
	    	this.recycleBackground();
		  	this.recycleCloud();
		  	this.recycleGround();
		  	this.recycleTrashbin();
		  	this.recycleRecyclebin();

		  	let rightMostTrashbin = this.getRightMostTrashbin();
				if(rightMostTrashbin < game.config.width*(0.75)){
					if(this.numJumped >=10 && this.numJumped%5==0){
						this.addRecyclebin();
					} else {
						this.addTrashbin();
					}
				}
			} else if(this.gameOver) {
		  	this.recycleCloud();
  		} else {
  			this.recycleBackground();
		  	this.recycleCloud();
		  	this.recycleGround();
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

		let trashbin = this.physics.add.sprite(game.config.width + Phaser.Math.Between(30,170), 
			250, "trashbin").setScale(0.3);

		trashbin.body.setVelocityX(-130);
		this.trashbinGroup.add(trashbin);
		trashbin.setDepth(0);

		//side by side trashbin

		if(this.numJumped>4){
			let coin = Phaser.Math.Between(0,2);
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
  			trashbin.destroy();
  		}
  	}, this);
	}

	addRecyclebin(){
		let recyclebin = this.physics.add.sprite(game.config.width + Phaser.Math.Between(30,200), 
			250, "recyclebin").setScale(0.3);
		recyclebin.body.setVelocityX(-130);
		this.recyclebinGroup.add(recyclebin);
		recyclebin.setDepth(0);
		this.numJumped++;
	}

	recycleRecyclebin(){
		this.recyclebinGroup.getChildren().forEach(function(recyclebin){
  		if(recyclebin.x < -recyclebin.displayWidth){
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
  	});
	}

  playerDeath(){
  	this.player.disableBody(true,true);
  	this.stopGame();
  	this.loseModal.setVisible(true);
		this.resetLabel.setVisible(true);
		this.gameOver = true;
  }

  restartGame(){
  	this.gameOver=false;
		this.gameStarted = false;

  	// this.recyclebinGroup.getChildren().forEach(function(recyclebin){
  	// 		recyclebin.destroy();
  	// }, this);

  	// this.trashbinGroup.getChildren().forEach(function(trashbin){
  	// 		trashbin.destroy();
  	// }, this);

  	this.trashbinGroup.clear(true, true);
  	this.recyclebinGroup.clear(true, true);

  	this.resetLabel.setVisible(false);
  	this.loseModal.setVisible(false);

  	this.numJumped = 0;

  	this.showStartModal();

  	//player
    this.player = this.physics.add.sprite(100, 200, 'bottle').setScale(0.3);
		this.physics.add.collider(this.player, this.groundBody);

		this.physics.add.overlap(this.player, this.trashbinGroup, this.playerDeath, null, this);
		this.playerRecycleCollider = this.physics.add.overlap(this.player, this.recyclebinGroup, this.recycleOverlap);

		this.physics.add.overlap(this.player, this.recyclebinGroup, this.recycleOverlap);

		this.groundGroup.getChildren().forEach(function(ground){
			ground.setVelocityX(-130);
  	}, this);

  	this.cloudGroup.getChildren().forEach(function(cloud){
			cloud.setVelocityX(-15);
		});

		this.backgroundGroup.getChildren().forEach(function(background){
			background.setVelocityX(-30);
		});
  }

  showStartModal(){
		this.startModal.setVisible(true);
    this.trashLabel.setVisible(true);
    this.trashIcon.setVisible(true);
    this.recycleLabel.setVisible(true);
    this.recycleIcon.setVisible(true);
    this.startLabel.setVisible(true);
    this.jumpLabel.setVisible(true);
  }

  hideStartModal(){
		this.startModal.setVisible(false);
    this.trashLabel.setVisible(false);
    this.trashIcon.setVisible(false);
    this.recycleLabel.setVisible(false);
    this.recycleIcon.setVisible(false);
    this.startLabel.setVisible(false);
    this.jumpLabel.setVisible(false);
  }
}
