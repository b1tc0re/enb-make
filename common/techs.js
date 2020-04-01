module.exports = {
    rimraf: require("rimraf"),
    exec : require('child_process').exec,
    files : {
        provide : require('enb/techs/file-provider'),
        copy : require('enb/techs/file-copy'),
        merge : require('enb/techs/file-merge'),
        write : require('enb/techs/write-file'),
        fs : require('fs'),
    },
    path : require('path'),
    enbBemTechs : require('enb-bem-techs'),
    postcss : {
        postcss : require('enb-postcss/techs/enb-postcss'),
        plugins : [
            require('postcss-import')(),
            require('postcss-each'),
            require('postcss-for'),
            require('postcss-simple-vars')(),
            require('postcss-calc')(),
            require('postcss-nested'),
            require('rebem-css'),
            require('postcss-url')({ url: 'rebase' }),
            require('autoprefixer')(),
            require('postcss-reporter')()
        ]
    },
    js : require('enb-borschik/techs/js-borschik-include'),
    ym : require('enb-modules/techs/prepend-modules'),
    engines : {
        bemhtml : require('enb-bemxjst/techs/bemhtml'),
        bhCommonJS : require('enb-bh/techs/bh-commonjs'),
        bhBundle : require('enb-bh/techs/bh-bundle')
    },
    html : {
        bemhtml : require('enb-bemxjst/techs/bemjson-to-html'),
        bh : require('enb-bh/techs/bemjson-to-html')
    },
    borschik : require('enb-borschik/techs/borschik'),

    // js
    bable: require('../teach/bable'),
    browserJs: require('enb-js/techs/browser-js'),
    factory: require('enb-magic-factory'),
};
