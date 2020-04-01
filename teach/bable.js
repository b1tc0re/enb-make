var vow = require('vow'),
    enb = require('enb'),
    vfs = enb.asyncFS || require('enb/lib/fs/async-fs'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    utils = require('enb-source-map/lib/utils'),
    File = require('enb-source-map/lib/file'),
    babel = require("@babel/core");

/**
 * @class BrowserJsTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Builds JavaScript files for browsers. <br/><br/>
 *
 * @param {Object}    [options]                                                    Options
 * @param {String}    [options.target='?.browser.js']                              Path to compiled file.
 * @param {String}    [options.filesTarget='?.files']                              Path to a target with FileList<br>
 *                                                                                 {@link http://bit.ly/1GTUOj0}
 * @param {String[]}  [options.sourceSuffixes=['vanilla.js', 'js', 'browser.js']]  Files with specified suffixes<br>
 *                                                                                 involved in the assembly.
 * @param {Boolean}   [options.params={}]                                          Adds an option to wrap merged
 *
 */
module.exports = buildFlow.create()
    .name('browser-js')
    .target('target', '?.browser.js')
    .useFileList(['vanilla.js', 'js', 'browser.js'])
    .defineOption('params', {})
    .builder(function (sourceFiles) {
        var promises = [this._readSourceFiles(sourceFiles)];


        return vow.all(promises)
            .spread(function (sources, ymSource) {
                var node = this.node,
                    file = new File(node.resolvePath(this._target), { sourceMap: this._sourcemap }),
                    params = this._params;

                if (ymSource) {
                    file.writeFileContent(node.relativePath(ymSource.path), ymSource.contents);
                }

                sources.forEach(function (source) {
                    file.writeFileContent(source.relPath, babel.transform(source.contents, params));
                });


                return file.render();

            }, this);
    })
    .methods({
        /**
         * Reads source js files.
         *
         * @protected
         * @param {FileList} files
         * @returns {FileData[]}
         */
        _readSourceFiles: function (files) {
            var node = this.node;

            return vow.all(files.map(function (file) {
                return vfs.read(file.fullname, 'utf8')
                    .then(function (contents) {
                        return {
                            path: file.fullname,
                            relPath: node.relativePath(file.fullname),
                            contents: contents
                        };
                    });
            }));
        }
    })
    .createTech();
