/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

var pth = require('path');

exports.update = function(content, namespace, filepath, root) {

    function parseImport(content, namespace, filepath, root) {
        var reg = /(?:\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\/)|(?:\/\/[^\n\r\f]*)|@import\s+url\s*\(\s*([^\n\r\}\{\)]*?)\s*\)\s*\;/g;
        return content.replace(reg, function (m , v) {
            if(v){
                if(v.indexOf('?__inline') !== -1){
                    return m;
                }
                var tmp = v;
                var group = '';

                var info = fis.util.stringQuote(v);
                v = info.rest.trim();

                if(v.indexOf(':') !== -1){
                    group = v.split(':');
                    if(group[0] == 'common'){
                        var tmp = group[1].split('/');
                        v = 'common:static/common/ui/' + group[1] + '/' + tmp[tmp.length-1] + '.css';
                        return '/*@require ' + v + '*/';
                    }else if(group[0] == 'macro'){
                        return '';
                    }
                }else{
                    if(v.substr(0, 1) == '.'){
                        v = pth.normalize(pth.dirname(filepath) + '/' + v);
                        v = v.replace(/[\/\\]+/g, '/');
                        v = v.replace(root + '/', '');
                    }else{
                        group = v.split('/');
                        v = 'static/' +  namespace + '/ui/' + v + '/' + group[group.length-1] + '.css';
                    }
                    group = v.split('/');
                    if(group[group.length-2] == pth.basename(v, '.css')){
                        return '/*@require ' + namespace + ':' + v + '*/';
                    }else{
                        return m.replace(tmp, '\'' + v +'?__inline\'');
                    }
                }
            }
            return m;
        });
        return content;
    }

    content = parseImport(content, namespace, filepath, root);
    return content;
}