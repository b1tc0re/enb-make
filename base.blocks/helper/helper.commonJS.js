let nodeExtend = require('extend');

module.exports = {

    /**
     * Добавить к сушествуюшему обекту или массиву дополнения
     * @param {object|undefined|Array} target
     * @param {object} extend
     * @return {object|Array}
     */
    append: function (target, extend) {
        this.isObject(target) || (target = {});

        if( Array.isArray(target) )
        {
            target.forEach((_target, index) => {
                target[index] = nodeExtend(_target, extend);
            });
        }
        else
        {
            target = nodeExtend(target, extend);
        }

        return target;
    },

    /**
     *
     * @param {object|Array} target
     * @param {object} extend
     * @return {Array}
     */
    push: function (target, extend) {
        typeof target === 'undefined' && (target = []);
        this.isObject(target) && (target = [target]);
        !Array.isArray(target) && (target = []);
        target.push(extend);
        return target;
    },

    /**
     * Проверка если значение является объектом
     * @param value
     * @return {boolean}
     */
    isObject: function(value) {
        return Object.getPrototypeOf(value) === null || Object === value.constructor;
    }

};