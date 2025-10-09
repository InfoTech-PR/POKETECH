// ==================================================
// SISTEMA DE MAPA COM SPRITES REAIS - TREINADOR E TREINADORA
// Usa as sprite sheets de ambos os gêneros fornecidas pelo usuário
// ==================================================

class DualSpriteMapSystem {
    constructor(canvasId, gameState) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gameState = gameState;

        // Configurações do mapa
        this.tileSize = 32;
        this.chunkSize = 16;
        this.renderDistance = 3;

        // Detecção de dispositivo mobile
        this.isMobile = this.detectMobile();

        // Configurações da câmera
        this.camera = {
            x: 0,
            y: 0,
            speed: 4
        };

        // Player position e sprites
        this.player = {
            x: 0,
            y: 0,
            width: 32,
            height: 32,
            speed: 3,
            direction: 'down',
            isMoving: false,
            targetX: 0,
            targetY: 0,
            gender: this.getPlayerGender(),
            animFrame: 0, // 0 = Parado, 1 = Passo 1, 2 = Passo 2
            animTimer: 0
        };

        // Sistema de chunks carregados
        this.loadedChunks = new Map();
        this.chestData = this.loadChestData();

        // ✅ NOVO: Sistema de sprites reais para ambos os gêneros
        this.sprites = {};
        this.spritesheets = {};
        this.spritesLoaded = false;
        this.loadingProgress = 0;
        this.totalAssets = 0;
        this.loadedAssets = 0;

        // Configurações de entrada
        this.keys = {};

        // Controles mobile
        this.mobileControls = {
            joystick: {
                centerX: 100,
                centerY: 0,
                radius: 50,
                knobRadius: 20,
                knobX: 100,
                knobY: 0,
                isDragging: false,
                touchId: null
            },
            actionButtons: {
                map: { x: 0, y: 0, radius: 30, pressed: false },
                back: { x: 0, y: 0, radius: 30, pressed: false }
            }
        };

        // Sistema de regiões dinâmicas
        this.currentBiome = null;
        this.showingFullMap = false;

        // Noise seed para geração procedural
        this.worldSeed = this.getWorldSeed();

        this.setupControls();
        this.loadAssets();
        this.updateMobileControlsPosition();
        this.gameLoop();
    }

    // ✅ ATUALIZADO: Mapeamento de sprites para o Treinador Masculino com suas coordenadas.
    getSpriteConfig() {
        return {
            // 👩 TREINADORA (sprite sheet fornecida - female.jpg)
            trainers: {
                female: {
                    spritesheet: '../assets/sprites/trainer/female.png', // A imagem female.jpg convertida
                    frameWidth: 32,
                    frameHeight: 32,
                    directions: {
                        down: [
                            { row: 1, col: 2 }, // Frame parado (frente)
                            { row: 2, col: 2 }, // Frame andando 1
                            { row: 3, col: 2 }  // Frame andando 2
                        ],
                        left: [
                            { row: 1, col: 0 }, // Frame parado (esquerda)
                            { row: 2, col: 0 }, // Frame andando 1
                            { row: 3, col: 0 }  // Frame andando 2
                        ],
                        right: [
                            { row: 0, col: 1 }, // Frame parado (direita)
                            { row: 1, col: 1 }, // Frame andando 1
                            { row: 2, col: 1 }  // Frame andando 2
                        ],
                        up: [
                            { row: 0, col: 0 }, // Frame parado (costas)
                            { row: 0, col: 2 }, // Frame andando 1
                            { row: 3, col: 1 }  // Frame andando 2
                        ]
                    }
                },
                // 👨 TREINADOR (sprite sheet fornecida - male.jpg)
                male: {
                    spritesheet: '../assets/sprites/trainer/male.png', // A imagem male.jpg convertida
                    frameWidth: 32,
                    frameHeight: 32,
                    directions: {
                        // Usando as coordenadas fornecidas pelo usuário:
                        down: [
                            { col: 2, row: 1 }, // Frame parado (frente)
                            { col: 2, row: 2 }, // Frame andando 1
                            { col: 2, row: 3 }  // Frame andando 2
                        ],
                        up: [
                            { col: 0, row: 0 }, // Frame parado (costas)
                            { col: 2, row: 0 }, // Frame andando 1
                            { col: 1, row: 3 }  // Frame andando 2
                        ],
                        right: [
                            { col: 1, row: 0 }, // Frame parado (direita)
                            { col: 1, row: 1 }, // Frame andando 1
                            { col: 1, row: 2 }  // Frame andando 2
                        ],
                        left: [
                            { col: 0, row: 1 }, // Frame parado (esquerda)
                            { col: 0, row: 2 }, // Frame andando 1
                            { col: 0, row: 3 }  // Frame andando 2
                        ]
                    }
                }
            },

            // 🌍 TILES (usando sprites reais de pixel art)
            tiles: {
                grass: { file: '../assets/sprites/tiles/grass_tile.png', size: 32 },
                tall_grass: { file: '../assets/sprites/tiles/tall_grass_tile.png', size: 32 },
                water: { file: '../assets/sprites/tiles/water_tile.png', size: 32 },
                forest: { file: '../assets/sprites/tiles/forest_tile.png', size: 32 },
                mountain: { file: '../assets/sprites/tiles/mountain_tile.png', size: 32 },
                sand: { file: '../assets/sprites/tiles/sand_tile.png', size: 32 },
                rock: { file: '../assets/sprites/tiles/rock_tile.png', size: 32 }
            },

            // 💎 BAÚS (sprites reais)
            chests: {
                common: {
                    closed: '../assets/sprites/tiles/chest_common_closed.png',
                    open: '../assets/sprites/tiles/chest_common_open.png',
                    size: 32
                },
                rare: {
                    closed: '../assets/sprites/tiles/chest_rare_closed.png',
                    open: '../assets/sprites/tiles/chest_rare_open.png',
                    size: 32
                }
            }
        };
    }

    // ✅ NOVO: URLs de fallback para ambos os gêneros (SVGs detalhados)
    getFallbackSpriteConfig() {
        return {
            trainers: {
                // 👩 TREINADORA - SVG baseado na sprite real (cabelo loiro, roupa rosa/vermelha)
                female: {
                    down: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSI yeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPCEtLSBCYXNlIGRvIGNvcnBvIChyb3VwYSB2ZXJtZWxoYSkgLS0+CjxyZWN0IHg9IjgiIHk9IjEyIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNEQzE0M0MiIHJ4PSIyIi8+CjwhLS0gQ2FiZcOnYSAocGVsZSkgLS0+CjxyZWN0IHg9IjgiIHk9IjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMiIgZmlsbD0iI0ZGREJDQiIgcng9IjYiLz4KPCEtLSBDYWJlbG8gbG9pcm8gLS0+CjxyZWN0IHg9IjQiIHk9IjIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIxNCIgZmlsbD0iI0ZGRDcwMCIgcng9IjgiLz4KPCEtLSBPbGhvcyAtLT4KPGNpcmNsZSBjeD0iMTEiIGN5PSI5IiByPSIxIiBmaWxsPSIjMjEyMTIxIi8+PjxjaXJjbGUgY3g9IjIxIiBjeT05IiByPSIxIiBmaWxsPSIjMjEyMTIxIi8+CjwhLS0gQnJhw6dvcyAtLT4KPHJlY3QgeD0iMiIgeT0iMTQiIHdpZHRoPSI2IiBoZWlnaHQ9IjEwIiBmaWxsPSIjRkZEQkNCIiByeD0iMiIvPgo8cmVjdCB4PSIyNCIgeT0iMTQiIHdpZHRoPSI2IiBoZWlnaHQ9IjEwIiBmaWxsPSIjRkZEQkNCIiByeD0iMiIvPgo8IS0tIFBQZXJuYXMgLS0+CjxyZWN0IHg9IjEwIiB5PSIyNiIgd2lkdGg9IjYiIGhlaWdodD0iNiIgZmlsbD0iI0ZGREJDQiIgcng9IjIiLz4KPHJlY3QgeD0iMTYiIHk9IjI2IiB3aWR0aD0iNiIgaGVpZ2h0PSI2IiBmaWxsPSIjRkZEQkNCIiByeD0iMiIvPgo8IS0tIFNhcGF0b3MgLS0+CjxyZWN0IHg9IjkiIHk9IjI5IiB3aWR0aD0iOCIgaGVpZ2h0PSIzIiBmaWxsPSIjOEQyNjM1IiByeD0iMSIvPgo8cmVjdCB4PSIxNSIgeT0iMjkiIHdpZHRoPSI4IiBoZWlnaHQ9IjMiIGZpbGw9IiM4RDI2MzUiIHJ4PSIxIi8+Cjwvc3ZnPgo=',
                    up: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSI yeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPCEtLSBCYXNlIGRvIGNvcnBvIChkZSBjb3N0YXMsIHJvdXBhIHZlcm1lbGhhKSAtLT4KPHJlY3QgeD0iOCI yeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iI0RDMTQzQyIgcng9IjIiLz4KPCEtLSBDYWJlbG8gbG9pcm8gKGRlIGNvc3RhcywgbWFpcyBsb25nbykgLS0+CjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIyOCIgaGVpZ2h0PSIxOCIgZmlsbD0iI0ZGRDcwMCIgcng9IjEwIi8+CjwhLS0gT3JlbGhhcyAodmlzw612ZWlzIGRlIGNvc3RhcykgLS0+CjxyZWN0IHg9IjQiIHk9IjEwIiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjRkZEQkNCIiByeD0iMiIvPgo8cmVjdCB4PSIyNCI yeT0iMTAiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNGRkRCQ0IiIHJ4PSIyIi8+CjwhLS0gQnJhw6dvcyAoZGUgY29zdGFzKSAtLT4KPHJlY3QgeD0iNCIgeT0iMTYiIHdpZHRoPSI2IiBoZWlnaHQ9IjgiIGZpbGw9IiNGRkRCQ0IiIHJ4PSIyIi8+CjxyZWN0IHg9IjIyIiB5PSIxNiIgd2lkdGg9IjYiIGhlaWdodD0iOCIgZmlsbD0iI0ZGREJDQiIgcng9IjIiLz4KPCEtLSBQZXJuYXMgLS0+CjxyZWN0IHg9IjEwIiB5PSIyNiIgd2lkdGg9IjYiIGhlaWdodD0iNiIgZmlsbD0iI0ZGREJDQiIgcng9IjIiLz4KPHJlY3QgeD0iMTYiIHk9IjI2IiB3aWR0aD0iNiIgaGVpZ2h0PSI2IiBmaWxsPSIjRkZEQkNCIiByeD0iMiIvPgo8L3N2Z3Q+Cg==',
                    left: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSI yeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPCEtLSBCYXNlIGRvIGNvcnBvIChsYXRlcmFsLCByb3VwYSB2ZXJtZWxoYSkgLS0+CjxyZWN0IHg9IjEwIiB5PSIxMiIgd2lkdGg9IjEyIiBoZWlnaHQ9IjE2IiBmaWxsPSIjREMxNDNDIiByeD0iMiIvPgo8IS0tIENhYmXDp2EgKHBlcmZpbCkgLS0+CjxyZWN0IHg9IjEyIiB5PSI0IiB3aWR0aD0iOCIgaGVpZ2h0PSIxMiIgZmlsbD0iI0ZGREJDQiIgcng9IjQiLz4KPCEtLSBDYWJlbG8gbG9pcm8gKHBlcmZpbCkgLS0+CjxyZWN0IHg9IjQiIHk9IjIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIxNCIgZmlsbD0iI0ZGRDcwMCIgcng9IjgiLz4KPCEtLSBPbGhvICh2aXPDrXZlbCkgLS0+CjxjaXJjbGUgY3g9IjE0IiBjeT05IiByPSIxIiBmaWxsPSIjMjEyMTIxIi8+CjwhLS0gQnJhw6dvIGVzdGVuZGidoSAtLT4KPHJlY3QgeD0iNCI yeT0iMTQiIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIiBmaWxsPSIjRkZEQkNCIiByeD0iMiIvPgo8IS0tIFBQZXJuYXMgLS0+CjxyZWN0IHg9IjEyIiB5PSIyNiIgd2lkdGg9IjQiIGhlaWdodD0iNiIgZmlsbD0iI0ZGREJDQiIgcng9IjIiLz4KPHJlY3QgeD0iMTYiIHk9IjI2IiB3aWR0aD0iNCIgaGVpZ2h0PSI2IiBmaWxsPSIjRkZEQkNCIiByeD0iMiIvPgo8L3N2Z3Q+Cg==',
                    right: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSI yeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPCEtLSBCYXNlIGRvIGNvcnBvIChsYXRlcmFsIGRpcmVpdG8sIHJvdXBhIHZlcm1lbGhhKSAtLT4KPHJlY3QgeD0iMTAiIHk9IjEyIiB3aWR0aD0iMTIiIGhlaWdodD0iMTYiIGZpbGw9IiNEQzE0M0MiIHJ4PSIyIi8+CjwhLS0gQ2FiZcOnYSAocGVyZmlsIGRpcmVpdG8pIC0tPgo8cmVjdCB4PSIxMiI yeT0iNCIgd2lkdGg9IjgiIGhlaWdodD0iMTIiIGZpbGw9IiNGRkRCQ0IiIHJ4PSI0Ii8+CjwhLS0gQ2FiZWxvIGxvaXJvIChwZXJmaWwgZGlyZWl0bykgLS0+CjxyZWN0IHg9IjgiIHk9IjIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIxNCIgZmlsbD0iI0ZGRDcwMCIgcng9IjgiLz4KPCEtLSBPbGhvICh2aXPDrXZlbCkgLS0+CjxjaXJjbGUgY3g9IjE4IiBjeT05IiByPSIxIiBmaWxsPSIjMjEyMTIxIi8+CjwhLS0gQnJhw6dvIGVzdGVuZGidoSAtLT4KPHJlY3QgeD0iMjAiIHk9IjE0IiB3aWR0aD0iOCIgaGVpZ2h0PSIxMCIgZmlsbD0iI0ZGREJDQiIgcng9IjIiLz4KPHJlY3QgeD0iMTIiIHk9IjI2IiB3aWR0aD0iNCIgaGVpZ2h0PSIzIiBmaWlsbA0iIzBENDdBMSIgcng9IjIiLz4KPHJlY3QgeD0iMTYiIHk9IjI2IiB3aWR0aD0iNCIgaGVpZ2h0PSI2IiBmaWlsbA0iIzBENDdBMSIgcng9IjIiLz4KPC9zdmc+Cg=='
                }
            }
        };
    }

    // ✅ NOVO: Carrega sprites reais com suporte a sprite sheets para ambos os gêneros
    async loadAssets() {
        console.log('🎨 Carregando sprites de ambos os gêneros...');

        this.loadingProgress = 0;
        this.loadedAssets = 0;

        const spriteConfig = this.getSpriteConfig();
        const fallbackConfig = this.getFallbackSpriteConfig();

        // Conta total de assets
        this.totalAssets = this.countTotalAssets(spriteConfig);

        try {
            // Carrega sprite sheets dos treinadores (ambos os gêneros)
            await this.loadTrainerSpritesheets(spriteConfig.trainers, fallbackConfig.trainers);

            // Carrega sprites dos tiles
            await this.loadTileSprites(spriteConfig.tiles);

            // Carrega sprites dos baús
            await this.loadChestSprites(spriteConfig.chests);

            this.spritesLoaded = true;
            this.loadingProgress = 100;
            console.log('✅ Todos os sprites carregados com sucesso (masculino e feminino)!');
        } catch (error) {
            console.error('❌ Erro ao carregar sprites:', error);
            this.spritesLoaded = true; // Usa fallbacks
        }
    }

    // ✅ NOVO: Carrega sprite sheets dos treinadores (ambos os gêneros)
    async loadTrainerSpritesheets(spriteConfig, fallbackConfig) {
        for (const gender of ['male', 'female']) {
            const config = spriteConfig[gender];

            if (config.spritesheet) {
                try {
                    // Tenta carregar a sprite sheet
                    const spritesheet = await this.loadImage(config.spritesheet);
                    this.spritesheets[`trainer_${gender}`] = {
                        image: spritesheet,
                        config: config
                    };

                    // Extrai sprites individuais da sheet
                    this.sprites[`trainer_${gender}`] = {};
                    for (const direction in config.directions) {
                        this.sprites[`trainer_${gender}`][direction] = [];

                        for (const frame of config.directions[direction]) {
                            const frameSprite = this.extractSpriteFromSheet(
                                spritesheet,
                                frame.col * config.frameWidth,
                                frame.row * config.frameHeight,
                                config.frameWidth,
                                config.frameHeight
                            );
                            this.sprites[`trainer_${gender}`][direction].push(frameSprite);
                        }
                    }

                    this.loadedAssets++;
                    this.loadingProgress = (this.loadedAssets / this.totalAssets) * 100;
                    console.log(`✅ Sprite sheet do ${gender === 'female' ? 'treinadora' : 'treinador'} carregada`);

                } catch (error) {
                    console.warn(`⚠️ Falha ao carregar sprite sheet ${gender}, usando fallback...`);

                    // Usa sprites individuais do fallback
                    this.sprites[`trainer_${gender}`] = {};
                    for (const direction in fallbackConfig[gender]) {
                        const fallbackSprite = await this.loadImage(fallbackConfig[gender][direction]);
                        this.sprites[`trainer_${gender}`][direction] = [fallbackSprite];
                    }

                    this.loadedAssets++;
                    this.loadingProgress = (this.loadedAssets / this.totalAssets) * 100;
                }
            }
        }
    }

    // ✅ NOVO: Extrai sprite individual da sprite sheet
    extractSpriteFromSheet(spritesheet, x, y, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Desabilita antialiasing para pixel art
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        // Extrai o frame específico
        ctx.drawImage(
            spritesheet,
            x, y, width, height,  // Área de origem na sprite sheet
            0, 0, width, height   // Destino no canvas
        );

        return canvas;
    }

    // ✅ NOVO: Carrega sprites dos tiles
    async loadTileSprites(tileConfig) {
        for (const tileType in tileConfig) {
            const config = tileConfig[tileType];
            try {
                const sprite = await this.loadImage(config.file);
                this.sprites[tileType] = sprite;

                this.loadedAssets++;
                this.loadingProgress = (this.loadedAssets / this.totalAssets) * 100;
                console.log(`✅ Sprite ${tileType} carregado`);
            } catch (error) {
                console.warn(`⚠️ Falha ao carregar tile ${tileType}`);
                // Usa fallback colorido
                this.sprites[tileType] = null;
            }
        }
    }

    // ✅ NOVO: Carrega sprites dos baús
    async loadChestSprites(chestConfig) {
        for (const chestType in chestConfig) {
            const config = chestConfig[chestType];
            this.sprites[`chest_${chestType}`] = {};

            for (const state of ['closed', 'open']) {
                try {
                    const sprite = await this.loadImage(config[state]);
                    this.sprites[`chest_${chestType}`][state] = sprite;

                    this.loadedAssets++;
                    this.loadingProgress = (this.loadedAssets / this.totalAssets) * 100;
                    console.log(`✅ Sprite baú ${chestType}_${state} carregado`);
                } catch (error) {
                    console.warn(`⚠️ Falha ao carregar baú ${chestType}_${state}`);
                }
            }
        }
    }

    // ✅ NOVO: Conta total de assets
    countTotalAssets(config) {
        let count = 0;

        // Treinadores (2 sprite sheets: male + female)
        count += Object.keys(config.trainers).length;

        // Tiles
        count += Object.keys(config.tiles).length;

        // Baús (2 estados cada)
        count += Object.keys(config.chests).length * 2;

        return count;
    }

    // ✅ NOVO: Carrega imagem
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load ${url}`));
            img.src = url;
        });
    }

    // ✅ CORREÇÃO DE LÓGICA DE ANIMAÇÃO: A variável 'progress' agora é declarada no escopo correto.
    renderPlayer() {
        const screenX = this.player.x - this.camera.x;
        const screenY = this.player.y - this.camera.y;

        // Calcula a distância até o alvo
        const deltaX = this.player.targetX - this.player.x;
        const deltaY = this.player.targetY - this.player.y;
        const distanceToTarget = Math.max(Math.abs(deltaX), Math.abs(deltaY));
        const totalDistance = this.tileSize; // A distância total de um movimento de tile

        // Declaração da variável 'progress' fora do bloco if para evitar o ReferenceError
        let progress = 0;

        // Lógica de Animação
        if (this.player.isMoving) {
            // Calcula o progresso do movimento como uma porcentagem (0% = começou, 100% = chegou)
            progress = (totalDistance - distanceToTarget) / totalDistance;

            // Frame 0 (parado) só é usado quando não está se movendo.
            // Usamos os frames 1 e 2 para passos.
            if (progress < 0.33) {
                this.player.animFrame = 1; // Começa no primeiro passo
            } else if (progress < 0.66) {
                this.player.animFrame = 0; // Quadro central, usando o frame 'parado' como passo intermediário
            } else {
                this.player.animFrame = 2; // Segundo passo
            }

            // A animação do tempo não é mais necessária, pois usamos o progresso do tile
            this.player.animTimer = 0;

        } else {
            this.player.animFrame = 0; // Frame parado quando o movimento termina
            this.player.animTimer = 0;
            progress = 1.0; // Define progress para um valor seguro quando parado
        }

        // Sombra
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX + this.player.width / 2,
            screenY + this.player.height - 2,
            this.player.width / 3, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        if (this.spritesLoaded) {
            // Usa sprite baseado no gênero e direção
            const genderKey = this.player.gender === 'female' ? 'trainer_female' : 'trainer_male';
            const directionSprites = this.sprites[genderKey];

            if (directionSprites && directionSprites[this.player.direction]) {
                this.ctx.imageSmoothingEnabled = false;

                // Seleciona frame da animação
                const frames = directionSprites[this.player.direction];
                // Garantir que o frame não exceda o array (apesar de termos 3 frames)
                const frameIndex = this.player.animFrame % frames.length;
                const currentFrame = frames[frameIndex] || frames[0];

                // Efeito de caminhada (bounce)
                this.ctx.save();
                if (this.player.isMoving) {
                    // Usa o progresso do tile para o bounce suave
                    // O valor 'progress' agora está definido e acessível aqui.
                    const bounceProgress = Math.min(Math.max(progress, 0), 1);
                    const bob = Math.sin(bounceProgress * Math.PI) * 2; // Bounce máximo de 2px no meio do movimento
                    this.ctx.translate(0, -bob); // O bounce deve ser para cima
                }

                // Desenha o sprite atual
                this.ctx.drawImage(
                    currentFrame,
                    screenX, screenY,
                    this.player.width, this.player.height
                );

                this.ctx.restore();
            }
        } else {
            // Fallback para desenho simples
            if (this.player.gender === 'female') {
                this.ctx.fillStyle = '#DC143C'; // Vermelho para treinadora
            } else {
                this.ctx.fillStyle = '#1976D2'; // Azul para treinador
            }
            this.ctx.fillRect(screenX + 4, screenY + 4,
                this.player.width - 8, this.player.height - 8);
        }
    }

    // ✅ MODIFICADO: Renderiza tiles com sprites reais
    renderTile(x, y) {
        const tile = this.getTile(x, y);
        const screenX = x * this.tileSize - this.camera.x;
        const screenY = y * this.tileSize - this.camera.y;

        if (this.spritesLoaded && this.sprites[tile.type]) {
            // Configura context para pixel art
            this.ctx.imageSmoothingEnabled = false;

            // Desenha sprite
            this.ctx.drawImage(
                this.sprites[tile.type],
                screenX, screenY,
                this.tileSize, this.tileSize
            );

            // Efeitos especiais para tiles específicos
            if (tile.type === 'water') {
                // Efeito de ondas
                const wave = Math.sin((Date.now() / 800) + (x + y)) * 0.1;
                this.ctx.save();
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = '#42A5F5';
                this.ctx.fillRect(screenX, screenY + (this.tileSize * wave), this.tileSize, 2);
                this.ctx.restore();
            }

            if (tile.type === 'tall_grass') {
                // Efeito de movimento
                const sway = Math.sin((Date.now() / 400) + (x + y)) * 2;
                this.ctx.save();
                this.ctx.translate(screenX + this.tileSize / 2, screenY + this.tileSize);
                this.ctx.rotate(sway * 0.05);
                this.ctx.translate(-this.tileSize / 2, -this.tileSize);
                this.ctx.globalAlpha = 0.8;
                this.ctx.drawImage(this.sprites[tile.type], 0, 0, this.tileSize, this.tileSize);
                this.ctx.restore();
            }
        } else {
            // Fallback para cores se sprites não carregaram
            const tileColors = {
                grass: '#4CAF50',
                tall_grass: '#2E7D32',
                water: '#2196F3',
                forest: '#1B5E20',
                mountain: '#616161',
                sand: '#FDD835',
                rock: '#424242',
                void: '#000000'
            };

            this.ctx.fillStyle = tileColors[tile.type] || '#FF0000';
            this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
        }
    }

    // ✅ MODIFICADO: Renderiza baús com sprites reais
    renderChests(startTileX, endTileX, startTileY, endTileY) {
        for (let y = startTileY; y <= endTileY; y++) {
            for (let x = startTileX; x <= endTileX; x++) {
                const chest = this.getChestAt(x, y);
                if (chest && !chest.collected) {
                    const screenX = x * this.tileSize - this.camera.x;
                    const screenY = y * this.tileSize - this.camera.y;

                    if (this.spritesLoaded) {
                        // Usa sprite do baú
                        const chestSprites = this.sprites[`chest_${chest.type}`];
                        if (chestSprites && chestSprites.closed) {
                            this.ctx.imageSmoothingEnabled = false;
                            this.ctx.drawImage(
                                chestSprites.closed,
                                screenX, screenY,
                                this.tileSize, this.tileSize
                            );

                            // Efeito de brilho para baús raros
                            if (chest.type === 'rare') {
                                const sparkleTime = Date.now() / 300;
                                this.ctx.save();
                                this.ctx.globalAlpha = (Math.sin(sparkleTime) + 1) * 0.3;
                                this.ctx.fillStyle = '#FFD700';
                                this.ctx.fillRect(screenX + 2, screenY + 2, this.tileSize - 4, this.tileSize - 4);
                                this.ctx.restore();
                            }
                        }
                    } else {
                        // Fallback para desenho simples
                        const chestColor = chest.type === 'rare' ? '#FFD700' : '#8D6E63';
                        this.ctx.fillStyle = chestColor;
                        this.ctx.fillRect(screenX + 4, screenY + 8, this.tileSize - 8, this.tileSize - 12);
                    }
                }
            }
        }
    }

    // ✅ MODIFICADO: Renderiza informações com status detalhado para ambos os gêneros
    renderBiomeInfo() {
        const tileX = Math.floor(this.player.x / this.tileSize);
        const tileY = Math.floor(this.player.y / this.tileSize);
        const tile = this.getTile(tileX, tileY);

        const biomeNames = {
            grass: 'Planície',
            tall_grass: 'Grama Alta',
            water: 'Água',
            forest: 'Floresta',
            mountain: 'Montanha',
            sand: 'Deserto',
            rock: 'Rocha'
        };

        const biomeName = biomeNames[tile.type] || 'Área Desconhecida';

        const infoWidth = this.isMobile ? 200 : 280;
        const infoHeight = this.isMobile ? 70 : 90;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, infoWidth, infoHeight);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = this.isMobile ? '12px Arial' : '14px Arial';
        this.ctx.fillText(biomeName, 20, 30);

        if (!this.isMobile) {
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`X: ${tileX}, Y: ${tileY}`, 20, 45);

            // Mostra info do sprite e gênero
            const genderText = this.player.gender === 'female' ? 'Treinadora (♀)' : 'Treinador (♂)';
            const directionText = {
                'down': 'Frente',
                'up': 'Costas',
                'left': 'Esquerda',
                'right': 'Direita'
            }[this.player.direction];

            this.ctx.fillText(`${genderText} - ${directionText}`, 20, 60);
        }

        // Status de carregamento de sprites
        if (!this.spritesLoaded) {
            this.ctx.fillStyle = '#FFC107';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`Carregando sprites: ${Math.floor(this.loadingProgress)}%`, 20, infoHeight - 15);

            // Barra de progresso
            this.ctx.strokeStyle = '#FFF';
            this.ctx.strokeRect(20, infoHeight - 10, 120, 4);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(20, infoHeight - 10, (this.loadingProgress / 100) * 120, 4);
        } else {
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = '10px Arial';
            const statusText = this.player.gender === 'female' ?
                '✅ Treinadora sprite carregada!' :
                '✅ Treinador sprite carregado!';
            this.ctx.fillText(statusText, 20, infoHeight - 10);
        }
    }

    // ✅ MODIFICADO: Minimapa com cores específicas por gênero
    renderMinimap() {
        const minimapSize = this.isMobile ? 80 : 120;
        const minimapX = this.canvas.width - minimapSize - 10;
        const minimapY = 10;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(minimapX - 5, minimapY - 5, minimapSize + 10, minimapSize + 10);

        const playerTileX = Math.floor(this.player.x / this.tileSize);
        const playerTileY = Math.floor(this.player.y / this.tileSize);
        const range = 8;

        for (let y = -range; y <= range; y++) {
            for (let x = -range; x <= range; x++) {
                const worldX = playerTileX + x;
                const worldY = playerTileY + y;
                const tile = this.getTile(worldX, worldY);

                const pixelX = minimapX + (x + range) * (minimapSize / (range * 2 + 1));
                const pixelY = minimapY + (y + range) * (minimapSize / (range * 2 + 1));
                const pixelSize = minimapSize / (range * 2 + 1);

                const miniColors = {
                    grass: '#4CAF50',
                    tall_grass: '#2E7D32',
                    water: '#2196F3',
                    forest: '#1B5E20',
                    mountain: '#616161',
                    sand: '#FDD835',
                    rock: '#424242'
                };

                this.ctx.fillStyle = miniColors[tile.type] || '#666';
                this.ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
            }
        }

        const centerX = minimapX + minimapSize / 2;
        const centerY = minimapY + minimapSize / 2;

        // Representa treinador/treinadora no minimapa com cores diferentes
        if (this.player.gender === 'female') {
            this.ctx.fillStyle = '#DC143C'; // Vermelho para treinadora
        } else {
            this.ctx.fillStyle = '#1976D2'; // Azul para treinador
        }
        this.ctx.fillRect(centerX - 1, centerY - 1, 3, 3);
    }

    // ✅ MODIFICADO: Instruções atualizadas para ambos os gêneros
    renderInstructions() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, this.canvas.height - 100, 300, 90);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '12px Arial';
        const playerText = this.player.gender === 'female' ? 'treinadora' : 'treinador';
        this.ctx.fillText(`WASD/Setas: Mover ${playerText}`, 20, this.canvas.height - 80);
        this.ctx.fillText('Space: Interagir com baús', 20, this.canvas.height - 65);
        this.ctx.fillText('M: Mapa Completo', 20, this.canvas.height - 50);
        this.ctx.fillText('ESC: Voltar ao Menu', 20, this.canvas.height - 35);
        this.ctx.fillText('Grama Alta = Pokémon selvagens', 20, this.canvas.height - 20);
    }

    // ✅ MODIFICADO: Instruções mobile atualizadas
    renderMobileInstructions() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, this.canvas.height - 70, 240, 60);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '11px Arial';
        const playerText = this.player.gender === 'female' ? 'treinadora' : 'treinador';
        this.ctx.fillText(`Joystick: Mover ${playerText}`, 20, this.canvas.height - 50);
        this.ctx.fillText('Toque duplo: Interagir', 20, this.canvas.height - 35);
        this.ctx.fillText('Botões: Mapa e Voltar', 20, this.canvas.height - 20);
    }

    // === RESTO DO CÓDIGO ===

    getPlayerGender() {
        try {
            if (window.gameState && window.gameState.profile && window.gameState.profile.gender) {
                return window.gameState.profile.gender.toLowerCase();
            }
            const profile = localStorage.getItem('pokemonGameProfile');
            if (profile) {
                const parsedProfile = JSON.parse(profile);
                return parsedProfile.gender ? parsedProfile.gender.toLowerCase() : 'male';
            }
        } catch (error) {
            console.log('Erro ao obter gênero do jogador:', error);
        }
        return 'male'; // Default para masculino
    }

    getWorldSeed() {
        try {
            let seed = localStorage.getItem('pokemonWorldSeed');
            if (!seed) {
                seed = Math.floor(Math.random() * 1000000).toString();
                localStorage.setItem('pokemonWorldSeed', seed);
            }
            return this.hashCode(seed);
        } catch (error) {
            return 12345;
        }
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    loadChestData() {
        try {
            const data = localStorage.getItem('pokemonMapChests');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            return {};
        }
    }

    saveChestData() {
        try {
            localStorage.setItem('pokemonMapChests', JSON.stringify(this.chestData));
        } catch (error) {
            console.error('Erro ao salvar dados dos baús:', error);
        }
    }

    generateChunk(chunkX, chunkY) {
        const chunk = {
            x: chunkX,
            y: chunkY,
            tiles: [],
            chests: []
        };

        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                const tile = this.generateTile(worldX, worldY);
                chunk.tiles.push(tile);

                if (tile.type === 'grass' && Math.random() < 0.01) {
                    chunk.chests.push({
                        x: worldX,
                        y: worldY,
                        type: 'common',
                        collected: this.isChestCollected(worldX, worldY)
                    });
                } else if (tile.type === 'forest' && Math.random() < 0.03) {
                    chunk.chests.push({
                        x: worldX,
                        y: worldY,
                        type: 'rare',
                        collected: this.isChestCollected(worldX, worldY)
                    });
                }
            }
        }

        return chunk;
    }

    // ✅ MODIFICADO: Lógica de geração de Tile ajustada para biomas mais largos e caminhos menos restritivos.
    generateTile(x, y) {

        // Se for o tile inicial (onde o player spawna), force para ser grama andável.
        if (x === 0 && y === 0) {
            return { type: 'grass', walkable: true, encounterRate: 0 };
        }

        // CORREÇÃO: Ruído mais suave para criar regiões maiores.
        // Aumenta a escala do ruído principal (0.1 -> 0.04) e do ruído de detalhe (0.2 -> 0.08)
        const noise1 = this.noise(x * 0.04, y * 0.04, this.worldSeed);
        const noise2 = this.noise(x * 0.015, y * 0.015, this.worldSeed + 1000); // Ruído de escala continental
        const noise3 = this.noise(x * 0.08, y * 0.08, this.worldSeed + 2000); // Ruído de detalhe

        // Combinação com maior peso para o ruído de escala continental
        const elevation = noise1 * 0.4 + noise2 * 0.6;
        const density = noise3;

        let tile = { type: 'grass', walkable: true, encounterRate: 0 };

        const distanceFromCenter = Math.sqrt(x * x + y * y);

        // Nível de Elevação:
        // 1. Água: Exige elevação BEM baixa para ser formada.
        if (elevation < -0.6) { // Aumentado o limite de -0.3 para -0.6
            tile = { type: 'water', walkable: false, encounterRate: 0 };
        }
        // 2. Montanha: Exige elevação BEM alta e densidade razoável.
        else if (elevation > 0.55 && density > 0.1) { // Aumentado o limite de 0.4 para 0.55
            tile = { type: 'mountain', walkable: false, encounterRate: 0 };
        }
        // 3. Deserto (Sand): Elevação um pouco abaixo da média.
        else if (elevation < -0.2) {
            tile = { type: 'sand', walkable: true, encounterRate: 0 };
        }
        // 4. Floresta: Elevação média-alta e densidade alta.
        else if (elevation > 0.1 && density > 0.4) {
            tile = { type: 'forest', walkable: true, encounterRate: 0 };
        }
        // 5. Grama Alta: Densidade alta na área de Planície/Grama.
        else if (density > 0.5) {
            tile = { type: 'tall_grass', walkable: true, encounterRate: 0.1 };
        }
        // 6. Grama/Planície (Default)
        else {
            tile = { type: 'grass', walkable: true, encounterRate: 0 };
        }

        // Rocha: Pequenos obstáculos aleatórios, mas com chance menor.
        if ((tile.type === 'grass' || tile.type === 'sand') && Math.random() < 0.005) { // Reduzido de 0.02 para 0.005
            tile = { type: 'rock', walkable: false, encounterRate: 0 };
        }

        return tile;
    }

    noise(x, y, seed) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    isChestCollected(x, y) {
        const key = `${x},${y}`;
        return this.chestData[key] === true;
    }

    collectChest(x, y) {
        const key = `${x},${y}`;
        this.chestData[key] = true;
        this.saveChestData();
    }

    getChunk(chunkX, chunkY) {
        const key = `${chunkX},${chunkY}`;
        if (!this.loadedChunks.has(key)) {
            const chunk = this.generateChunk(chunkX, chunkY);
            this.loadedChunks.set(key, chunk);
        }
        return this.loadedChunks.get(key);
    }

    getTile(x, y) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunk = this.getChunk(chunkX, chunkY);

        const localX = x - (chunkX * this.chunkSize);
        const localY = y - (chunkY * this.chunkSize);

        if (localX < 0 || localY < 0 || localX >= this.chunkSize || localY >= this.chunkSize) {
            return { type: 'void', walkable: false, encounterRate: 0 };
        }

        const index = localY * this.chunkSize + localX;
        return chunk.tiles[index] || { type: 'void', walkable: false, encounterRate: 0 };
    }

    getChestAt(x, y) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunk = this.getChunk(chunkX, chunkY);

        return chunk.chests.find(chest => chest.x === x && chest.y === y);
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth <= 768 ||
            'ontouchstart' in window;
    }

    updateMobileControlsPosition() {
        if (!this.isMobile) return;

        this.mobileControls.joystick.centerY = this.canvas.height - 120;
        this.mobileControls.joystick.knobY = this.mobileControls.joystick.centerY;

        this.mobileControls.actionButtons.map.x = this.canvas.width - 80;
        this.mobileControls.actionButtons.map.y = this.canvas.height - 120;

        this.mobileControls.actionButtons.back.x = this.canvas.width - 80;
        this.mobileControls.actionButtons.back.y = this.canvas.height - 60;
    }

    setupControls() {
        if (this.isMobile) {
            this.setupMobileControls();
        } else {
            this.setupKeyboardControls();
        }
    }

    setupMobileControls() {
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            this.handleTouchStart(e);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            this.handleTouchMove(e);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            this.handleTouchEnd(e);
        }, { passive: false });

        this.canvas.style.touchAction = 'none';
        this.canvas.style.userSelect = 'none';
        this.canvas.style.webkitUserSelect = 'none';
        this.canvas.style.webkitTouchCallout = 'none';
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (!this.player.isMoving) {
                this.handleMovement(e.code);
            }

            if (e.code === 'KeyM') {
                this.toggleFullMap();
            }

            if (e.code === 'Escape') {
                window.Renderer && window.Renderer.showScreen('mainMenu');
            }

            if (e.code === 'Space') {
                this.handleInteraction();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    handleInteraction() {
        const tileX = Math.floor(this.player.x / this.tileSize);
        const tileY = Math.floor(this.player.y / this.tileSize);

        const directionOffsets = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };

        const offset = directionOffsets[this.player.direction];
        const interactX = tileX + offset.x;
        const interactY = tileY + offset.y;

        const chest = this.getChestAt(interactX, interactY);
        if (chest && !chest.collected) {
            this.openChest(chest);
        }
    }

    openChest(chest) {
        chest.collected = true;
        this.collectChest(chest.x, chest.y);

        const rewards = this.generateChestRewards(chest.type);
        this.giveRewards(rewards);
        this.showChestMessage(rewards);
    }

    generateChestRewards(chestType) {
        const rewards = [];

        if (chestType === 'common') {
            const moneyAmount = Math.floor(Math.random() * 100) + 50;
            rewards.push({ type: 'money', amount: moneyAmount });

            if (Math.random() < 0.7) {
                const pokeballs = Math.floor(Math.random() * 3) + 1;
                rewards.push({ type: 'pokeball', amount: pokeballs });
            }

            if (Math.random() < 0.3) {
                rewards.push({ type: 'potion', amount: 1 });
            }
        } else if (chestType === 'rare') {
            const moneyAmount = Math.floor(Math.random() * 200) + 100;
            rewards.push({ type: 'money', amount: moneyAmount });

            const pokeballs = Math.floor(Math.random() * 5) + 2;
            rewards.push({ type: 'pokeball', amount: pokeballs });

            if (Math.random() < 0.5) {
                rewards.push({ type: 'great_ball', amount: 1 });
            }

            if (Math.random() < 0.4) {
                rewards.push({ type: 'super_potion', amount: 1 });
            }
        }

        return rewards;
    }

    giveRewards(rewards) {
        try {
            for (const reward of rewards) {
                if (reward.type === 'money') {
                    if (window.gameState && window.gameState.profile) {
                        window.gameState.profile.pokeDollars = (window.gameState.profile.pokeDollars || 0) + reward.amount;
                    }
                } else {
                    if (window.gameState && window.gameState.profile && window.gameState.profile.items) {
                        const currentAmount = window.gameState.profile.items[reward.type] || 0;
                        window.gameState.profile.items[reward.type] = currentAmount + reward.amount;
                    }
                }
            }

            if (window.Utils && window.Utils.saveGame) {
                window.Utils.saveGame();
            }
        } catch (error) {
            console.error('Erro ao dar recompensas:', error);
        }
    }

    showChestMessage(rewards) {
        let message = 'Você encontrou:\\n';

        for (const reward of rewards) {
            if (reward.type === 'money') {
                message += `• $${reward.amount}\\n`;
            } else if (reward.type === 'pokeball') {
                message += `• ${reward.amount}x Pokébola${reward.amount > 1 ? 's' : ''}\\n`;
            } else if (reward.type === 'great_ball') {
                message += `• ${reward.amount}x Super Bola${reward.amount > 1 ? 's' : ''}\\n`;
            } else if (reward.type === 'potion') {
                message += `• ${reward.amount}x Poção${reward.amount > 1 ? 'ões' : ''}\\n`;
            } else if (reward.type === 'super_potion') {
                message += `• ${reward.amount}x Super Poção${reward.amount > 1 ? 'ões' : ''}\\n`;
            }
        }

        if (window.Utils && window.Utils.showModal) {
            window.Utils.showModal('infoModal', message);
        } else {
            // NOTE: Using console.log instead of alert due to iframe restrictions
            console.log(message.replace(/\\n/g, '\n'));
        }
    }

    getTouchPos(e, touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    isTouchInsideCanvas(e, touch) {
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX;
        const y = touch.clientY;

        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    handleTouchStart(e) {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];

            if (!this.isTouchInsideCanvas(e, touch)) {
                continue;
            }

            const pos = this.getTouchPos(e, touch);

            const joystick = this.mobileControls.joystick;
            const distanceToJoystick = Math.sqrt(
                Math.pow(pos.x - joystick.centerX, 2) +
                Math.pow(pos.y - joystick.centerY, 2)
            );

            if (distanceToJoystick <= joystick.radius && !joystick.isDragging) {
                joystick.isDragging = true;
                joystick.touchId = touch.identifier;
                joystick.knobX = pos.x;
                joystick.knobY = pos.y;
                continue;
            }

            const mapButton = this.mobileControls.actionButtons.map;
            const backButton = this.mobileControls.actionButtons.back;

            const distanceToMap = Math.sqrt(
                Math.pow(pos.x - mapButton.x, 2) +
                Math.pow(pos.y - mapButton.y, 2)
            );

            const distanceToBack = Math.sqrt(
                Math.pow(pos.x - backButton.x, 2) +
                Math.pow(pos.y - backButton.y, 2)
            );

            if (distanceToMap <= mapButton.radius) {
                mapButton.pressed = true;
                this.toggleFullMap();
                setTimeout(() => { mapButton.pressed = false; }, 200);
            }

            if (distanceToBack <= backButton.radius) {
                backButton.pressed = true;
                window.Renderer && window.Renderer.showScreen('mainMenu');
                setTimeout(() => { backButton.pressed = false; }, 200);
            }

            if (this.lastTapTime && Date.now() - this.lastTapTime < 300) {
                this.handleInteraction();
            }
            this.lastTapTime = Date.now();
        }
    }

    handleTouchMove(e) {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const joystick = this.mobileControls.joystick;

            if (joystick.isDragging && touch.identifier === joystick.touchId) {
                if (!this.isTouchInsideCanvas(e, touch)) {
                    continue;
                }

                const pos = this.getTouchPos(e, touch);

                const deltaX = pos.x - joystick.centerX;
                const deltaY = pos.y - joystick.centerY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (distance <= joystick.radius) {
                    joystick.knobX = pos.x;
                    joystick.knobY = pos.y;
                } else {
                    const angle = Math.atan2(deltaY, deltaX);
                    joystick.knobX = joystick.centerX + Math.cos(angle) * joystick.radius;
                    joystick.knobY = joystick.centerY + Math.sin(angle) * joystick.radius;
                }

                this.processMobileMovement();
            }
        }
    }

    handleTouchEnd(e) {
        const joystick = this.mobileControls.joystick;

        let joystickTouchStillActive = false;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === joystick.touchId) {
                joystickTouchStillActive = true;
                break;
            }
        }

        if (!joystickTouchStillActive && joystick.isDragging) {
            joystick.isDragging = false;
            joystick.touchId = null;
            joystick.knobX = joystick.centerX;
            joystick.knobY = joystick.centerY;
        }
    }

    processMobileMovement() {
        if (!this.player.isMoving) {
            const joystick = this.mobileControls.joystick;
            const deltaX = joystick.knobX - joystick.centerX;
            const deltaY = joystick.knobY - joystick.centerY;

            const threshold = 15;

            if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
                let direction = '';

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    direction = deltaX > 0 ? 'right' : 'left';
                } else {
                    direction = deltaY > 0 ? 'down' : 'up';
                }

                this.handleMobileMovement(direction);
            }
        }
    }

    handleMobileMovement(direction) {
        let newX = this.player.x;
        let newY = this.player.y;

        switch (direction) {
            case 'up':
                newY -= this.tileSize;
                this.player.direction = 'up';
                break;
            case 'down':
                newY += this.tileSize;
                this.player.direction = 'down';
                break;
            case 'left':
                newX -= this.tileSize;
                this.player.direction = 'left';
                break;
            case 'right':
                newX += this.tileSize;
                this.player.direction = 'right';
                break;
        }

        if (this.canMoveTo(newX, newY)) {
            this.movePlayerTo(newX, newY);
            this.checkForEncounters();
        }
    }

    handleMovement(keyCode) {
        let newX = this.player.x;
        let newY = this.player.y;

        switch (keyCode) {
            case 'ArrowUp':
            case 'KeyW':
                newY -= this.tileSize;
                this.player.direction = 'up';
                break;
            case 'ArrowDown':
            case 'KeyS':
                newY += this.tileSize;
                this.player.direction = 'down';
                break;
            case 'ArrowLeft':
            case 'KeyA':
                newX -= this.tileSize;
                this.player.direction = 'left';
                break;
            case 'ArrowRight':
            case 'KeyD':
                newX += this.tileSize;
                this.player.direction = 'right';
                break;
        }

        if (this.canMoveTo(newX, newY)) {
            this.movePlayerTo(newX, newY);
            this.checkForEncounters();
        }
    }

    // ✅ CORRIGIDO: Inicia a animação no Frame 1 (passo)
    movePlayerTo(x, y) {
        this.player.targetX = x;
        this.player.targetY = y;
        this.player.isMoving = true;
        // Inicia explicitamente a animação no primeiro frame de movimento (Passo 1)
        this.player.animFrame = 1;
    }

    updatePlayerMovement() {
        if (!this.player.isMoving) return;

        const deltaX = this.player.targetX - this.player.x;
        const deltaY = this.player.targetY - this.player.y;

        if (Math.abs(deltaX) > this.player.speed) {
            this.player.x += Math.sign(deltaX) * this.player.speed;
        } else {
            this.player.x = this.player.targetX;
        }

        if (Math.abs(deltaY) > this.player.speed) {
            this.player.y += Math.sign(deltaY) * this.player.speed;
        } else {
            this.player.y = this.player.targetY;
        }

        if (this.player.x === this.player.targetX && this.player.y === this.player.targetY) {
            this.player.isMoving = false;
        }
    }

    // ✅ DEBBUGING: Adicionado log para verificar o bloqueio do movimento.
    canMoveTo(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);

        const tile = this.getTile(tileX, tileY);

        // Log para ajudar a identificar o problema de movimento
        // console.log(`[MOVIMENTO] Tentando mover para Tile (${tileX}, ${tileY}). Tipo: ${tile.type}, Andável: ${tile.walkable}`);

        return tile.walkable;
    }

    updateCamera() {
        const targetCameraX = this.player.x - this.canvas.width / 2;
        const targetCameraY = this.player.y - this.canvas.height / 2;

        this.camera.x += (targetCameraX - this.camera.x) * 0.1;
        this.camera.y += (targetCameraY - this.camera.y) * 0.1;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const startTileX = Math.floor((this.camera.x - this.tileSize) / this.tileSize);
        const endTileX = Math.floor((this.camera.x + this.canvas.width + this.tileSize) / this.tileSize);
        const startTileY = Math.floor((this.camera.y - this.tileSize) / this.tileSize);
        const endTileY = Math.floor((this.camera.y + this.canvas.height + this.tileSize) / this.tileSize);

        for (let y = startTileY; y <= endTileY; y++) {
            for (let x = startTileX; x <= endTileX; x++) {
                this.renderTile(x, y);
            }
        }

        this.renderChests(startTileX, endTileX, startTileY, endTileY);
        this.renderPlayer();
        this.renderUI();

        if (this.isMobile) {
            this.renderMobileControls();
        }
    }

    renderUI() {
        this.renderMinimap();
        this.renderBiomeInfo();

        if (!this.isMobile) {
            this.renderInstructions();
        } else {
            this.renderMobileInstructions();
        }
    }

    renderMobileControls() {
        const joystick = this.mobileControls.joystick;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(joystick.centerX, joystick.centerY, joystick.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = joystick.isDragging ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 255, 255, 0.9)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(joystick.knobX, joystick.knobY, joystick.knobRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        const mapButton = this.mobileControls.actionButtons.map;
        this.ctx.fillStyle = mapButton.pressed ? 'rgba(76, 175, 80, 0.8)' : 'rgba(33, 150, 243, 0.8)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(mapButton.x, mapButton.y, mapButton.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🗺️', mapButton.x, mapButton.y + 5);

        const backButton = this.mobileControls.actionButtons.back;
        this.ctx.fillStyle = backButton.pressed ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(backButton.x, backButton.y, backButton.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('←', backButton.x, backButton.y + 5);

        this.ctx.textAlign = 'start';
    }

    checkForEncounters() {
        const tileX = Math.floor(this.player.x / this.tileSize);
        const tileY = Math.floor(this.player.y / this.tileSize);
        const tile = this.getTile(tileX, tileY);

        if (tile.type === 'tall_grass' && Math.random() < 0.1) {
            if (window.BattleCore && window.BattleCore.startWildBattle) {
                console.log('Wild Pokemon encounter in tall grass!');
                this.gameState.currentScreen = 'battle';
                window.BattleCore.startWildBattle();
            }
        }
    }

    toggleFullMap() {
        this.showingFullMap = !this.showingFullMap;
        if (this.showingFullMap) {
            this.renderFullMap();
        }
    }

    renderFullMap() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('MUNDO INFINITO', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText(`Posição: (${Math.floor(this.player.x / this.tileSize)}, ${Math.floor(this.player.y / this.tileSize)})`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('Pressione M novamente para fechar', this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.textAlign = 'start';

        setTimeout(() => {
            this.showingFullMap = false;
        }, 100);
    }

    gameLoop() {
        this.updatePlayerMovement();
        this.updateCamera();

        if (!this.showingFullMap) {
            this.render();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    integrateWithPoketech() {
        window.MapNavigation = this;

        if (window.Renderer && window.Renderer.showScreen) {
            const originalShowScreen = window.Renderer.showScreen;
            window.Renderer.showScreen = (screen) => {
                if (screen === 'worldMap') {
                    document.getElementById('map-navigation-container').style.display = 'block';
                    return;
                } else {
                    document.getElementById('map-navigation-container').style.display = 'none';
                }
                originalShowScreen(screen);
            };
        }

        if (window.GameLogic && window.GameLogic.explore) {
            const originalExplore = window.GameLogic.explore;
            window.GameLogic.explore = () => {
                window.Renderer.showScreen('worldMap');
            };
        }
    }
}

// Substitui a classe original
window.MapNavigationSystem = DualSpriteMapSystem;

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        console.log('✅ Sistema de mapa com sprites de ambos os gêneros carregado!');
    }, 2000);
});
