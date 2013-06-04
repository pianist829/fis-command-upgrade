/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

var pth = require('path');

exports.update = function(content, namespace, filepath, root) {

    function detMacro(content) {

    }

    function detWidgetExtend(content){

    }
    var macro = detMacro(content);
    content = parseImport(content, namespace, filepath, root);
    return content;
}