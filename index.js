const techs = require('./common/techs');
let PLATFORMS = require('./common/platforms'),
    LEVELS = require('./common/levels'),
    NodeUnique = require('node-unique-array'),
    WorkSpace = techs.path.dirname(__filename);

module.exports = {

    /**
     * Настройки проекта
     * @var {ProjectConfig}
     */
    config : null,

    platforms : null,

    exceptionsBundle : [ 'merged' ],

    configArg : null,

    /**
     * Удалить бандл с тестами
     */
    testBundleDelete : true,

    /**
     * Удалить бандл с примерами
     */
    examplesBundleDelete : true,

    _options : {},

    /**
     * Инстанции класса ProjectConfig передаются из enb-make-файла
     * @param {ProjectConfig} config
     * @param {object} options
     * @returns {exports}
     */
    init : function( config, options ) {
        this.config = config;
        this.config.includeConfig('enb-bem-examples');
        PLATFORMS = Object.assign(PLATFORMS ||{}, options.platforms || {});
        LEVELS = LEVELS.concat(options.levels || []);
        this.platforms = Object.keys(PLATFORMS);
        this._options = options;

        return this;
    },

    /**
     * Объявить ноду и запустить сборку
     * @returns {exports}
     */
    initializeBundles : function () {
        this.platforms.forEach( (platform) => this.config.nodes(['bundles/'+ platform +'.bundles/*'], (nodeConfig) => {
            if( this.checkExceptions(nodeConfig) ) {
                return false;
            }

            nodeConfig.addTech([techs.files.provide, { target: '?.bemjson.js' }]);
            this._assemblyTechs(nodeConfig, platform);
        }));

        return this;
    },

    /**
     * Сборать все бандлы в merged-bundle
     *  - Объединение js и css файлов в один
     *
     * @return {exports}
     */
    initializeMergedBundles : function() {

        // Проверить название задания
        if( this.isTask('assembly-mergedBundle') === false ) {
            return this;
        }

        // Проходим по всем объявленным платформам ['desktop', 'touch']
        // для сбора decl файлов
        this.platforms.forEach( (platform) => this.config.nodes([ 'bundles/'+ platform +'.bundles/merged' ], (nodeConfig) => {

            let dir = techs.path.dirname(nodeConfig.getPath()),
                bundles = techs.files.fs.readdirSync(dir),
                bemdeclFiles = [];

            if( bundles.length < 1 )
                return false;

            bundles.forEach((bundle) => {

                if (bundle !== 'merged' && bundle !== '.bem') {

                    let nodePath = techs.path.join(dir, bundle),
                        bemDecl = bundle + '.bemdecl.js';

                    nodeConfig.addTech([
                        techs.enbBemTechs.provideBemdecl, {
                            node: nodePath,
                            target: bemDecl
                        }
                    ]);

                    bemdeclFiles.push(bemDecl);
                }
            });

            // Объединяем скопированные BEMDECL-файлы
            nodeConfig.addTech([techs.enbBemTechs.mergeBemdecl, {sources: bemdeclFiles}]);

            // Запуск сборки
            this._assemblyTechs(nodeConfig, platform);
        }));

        return this;
    },

    /**
     * Собрать из блоков примеры
     * @return {exports}
     */
    initializeExamples : function() {
        let tests = this.config.module('enb-bem-examples', null).createConfigurator('assembly-example');

        // Собирает из блоков примеры и переносит по платформам
        this.platforms.forEach( (platform) => {
            let destPath = 'bundles/' + platform + '.examples';

            if( this.examplesBundleDelete && this.isTask('assembly-tests') ) {
                techs.rimraf.sync(destPath);
                this.testBundleDelete = false;
            }


            tests.configure({
                destPath : destPath,
                levels : this.getBaseLevels(platform),
                techSuffixes : ['examples'],
                fileSuffixes : ['bemjson.js', 'title.txt']
            });

            this.config.nodes(['bundles/'+ platform +'.examples/*/*'], (nodeConfig) => {
                this.normalizeSymLink(nodeConfig);
                nodeConfig.addTech([techs.files.provide, { target: '?.bemjson.js' }]);
                this._assemblyTechs(nodeConfig, platform);
            });
        });

        return this;
    },

    /**
     * Собрать тесты
     */
    initializeTests : function() {

        let tests = this.config.module('enb-bem-examples', null).createConfigurator('assembly-tests');

        // Собирает из блоков примеры и переносит по платформам
        this.platforms.forEach( (platform) => {
            let destPath = 'bundles/' + platform + '.tests';

            if( this.testBundleDelete && this.isTask('assembly-tests') ) {
                techs.rimraf.sync(destPath);
                this.testBundleDelete = false;
            }

            tests.configure({
                destPath : destPath,
                levels : this.getBaseLevels(platform),
                techSuffixes : ['tests'],
                fileSuffixes : ['bemjson.js', 'title.txt']
            });

            this.config.nodes(['bundles/'+ platform +'.tests/*/*'], (nodeConfig) => {
                this.normalizeSymLink(nodeConfig);
                nodeConfig.addTech([techs.files.provide, { target: '?.bemjson.js' }]);
                this._assemblyTechs(nodeConfig, platform);
            });
        });

        return this;
    },

    /**
     * Базовая сборка
     * @param {NodeConfig} nodeConfig
     * @param {string} platform
     * @private
     */
    _assemblyTechs : function(nodeConfig, platform) {

        let nodeDirname = nodeConfig.getNodePath(),
            blockName = techs.path.basename(techs.path.dirname(nodeDirname)),
            exampleName = techs.path.basename(nodeDirname),
            levels = this.getSourceLevels(platform),
            testsLevels = [
                { path: 'blocks/test.blocks', check: true },
                { path: techs.path.join(nodeDirname, blockName + '.blocks'), check: true },
                { path: techs.path.join(nodeDirname, exampleName + '.blocks'), check: true },
                { path: techs.path.join(nodeDirname,  'blocks'), check: true }
            ].filter((item) => { return techs.files.fs.existsSync(item.path || item) }),
            extendedLevels = [].concat( levels, testsLevels );

        let unique_array = new NodeUnique(extendedLevels);

        nodeConfig.addTechs([
            // essential
            [techs.enbBemTechs.levels, { levels: unique_array.get() }],


            [techs.enbBemTechs.deps],
            [techs.enbBemTechs.files],

            // css
            [techs.postcss.postcss, {
                target: '?.css',
                oneOfSourceSuffixes: ['post.css', 'css'],
                plugins: techs.postcss.plugins
            }],

            // bemhtml
            [techs.engines.bemhtml, {
                sourceSuffixes: ['bemhtml', 'bemhtml.js'],
                forceBaseTemplates: true,
                engineOptions : {
                    elemJsInstances : true,
                    requires : {
                        'helper': {
                            commonJS: techs.path.join(WorkSpace, 'base.blocks/helper/helper.commonJS'),
                        }
                    }
                }
            }],

            // html
            [techs.html.bemhtml],

            // client bemhtml
            [techs.enbBemTechs.depsByTechToBemdecl, {
                target: '?.bemhtml.bemdecl.js',
                sourceTech: 'js',
                destTech: 'bemhtml'
            }],
            [techs.enbBemTechs.deps, {
                target: '?.bemhtml.deps.js',
                bemdeclFile: '?.bemhtml.bemdecl.js'
            }],
            [techs.enbBemTechs.files, {
                depsFile: '?.bemhtml.deps.js',
                filesTarget: '?.bemhtml.files',
                dirsTarget: '?.bemhtml.dirs'
            }],
            [techs.engines.bemhtml, {
                target: '?.browser.bemhtml.js',
                filesTarget: '?.bemhtml.files',
                sourceSuffixes: ['bemhtml', 'bemhtml.js'],
                engineOptions : {
                    elemJsInstances : true,
                    requires : {
                        'helper': {
                            ym: 'helper',
                        }
                    }
                }
            }],

            // js
            [techs.bable, { includeYM: true, iife: true, bable : this._options.bable || {} } ],
            [techs.files.merge, {
                target: '?.js',
                sources: ['?.browser.js', '?.browser.bemhtml.js']
            }],

            // borschik
            [techs.borschik, {
                source: '?.js',
                target: '?.min.js',
                minify: true,
                freeze : true,
                techOptions: {
                    uglify: {
                        keep_classnames: true
                    }
                }
            }],
            [techs.borschik, { source: '?.css', target: '?.min.css', minify: true,  freeze : true }]
        ]);

        if( !this.checkExceptions(nodeConfig) ) {
            nodeConfig.addTechs([ [techs.enbBemTechs.bemjsonToBemdecl] ]);
            nodeConfig.addTargets([/* '?.bemtree.js', */ '?.html']);
        }

        nodeConfig.addTargets([/* '?.bemtree.js', */ '?.min.css', '?.min.js']);
    },

    /**
     * Вернуть уровни блоков для платформы
     * @param platform (platform name desktop|touch)
     * @returns {*[]}
     */
    getSourceLevels : function (platform) {
        return LEVELS.concat(this.getBaseLevels(platform));
    },

    /**
     * Вернуть базовые платформы
     * @param platform
     * @returns {*}
     */
    getBaseLevels : function(platform) {
        let levels = [];
        PLATFORMS[platform].forEach(function(name) {
            levels.push({
                path : 'blocks/' + name + '.blocks'
            });
        });

        return levels;
    },

    /**
     * Модуль enb-bem-examples создает ссылки с расширением .symlink
     * @param {NodeConfig} nodeConfig
     */
    normalizeSymLink: function(nodeConfig) {

        if( process.platform === 'win32' || process.platform === 'linux'  ) {
            let bemJsonPath = techs.path.join(nodeConfig._path, techs.path.basename(nodeConfig._path)) + '.bemjson.js';
            let targetBemJsonSymlink = bemJsonPath + '.symlink';

            if( techs.files.fs.existsSync(targetBemJsonSymlink)  ) {
                techs.files.fs.renameSync(targetBemJsonSymlink, bemJsonPath);
            }
        }
    },

    /**
     * Проверка сключенных бандлов
     * @param {NodeConfig} nodeConfig
     * @return boolean
     */
    checkExceptions : function (nodeConfig) {
        let page = techs.path.basename(nodeConfig.getPath());
        return !this.exceptionsBundle.indexOf(page);
    },

    /**
     * Проверьте имя задачи запуска
     * @param task
     * @return {boolean}
     */
    isTask: function(task) {
        let config = this.configArgv();
        return (config.hasOwnProperty('original') && config.original.indexOf(task) === 1 );
    },

    /**
     * Вернуть env args
     * @returns {object}
     */
    configArgv : function () {
        return this.configArg || (this.configArg = JSON.parse(process.env.npm_config_argv));
    }
};