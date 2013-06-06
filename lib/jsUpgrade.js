/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

var util = require('./util.js');

exports.update = function(content, namespace) {
    var libs = [
        'tangram',
        'fis',
        'magic',
        'gmu',
    ];

    function inArray (needle, haystack, argStrict) {
        // http://kevin.vanzonneveld.net
        var key = '',
            strict = !! argStrict;

        if (strict) {
            for (key in haystack) {
                if (haystack[key] === needle) {
                    return true;
                }
            }
        } else {
            for (key in haystack) {
                if (haystack[key] == needle) {
                    return true;
                }
            }
        }

        return false;
    }

    function getPathId(v, namespace) {
        var group = '';
        if ( v.indexOf(':') == -1 && v.indexOf('.') != 0) {
            group = v.split('/');
            v = namespace + ':static/' + namespace + '/ui/' + v + '/' + group[group.length-1] + '.js';
        }else if( v.indexOf(':') !== -1){
            group = v.split(':'); 
            if (group[1].indexOf('.js') == -1) {
                var tpmnamespace = util.trim(group[0]);
                if(tpmnamespace == namespace || tpmnamespace == 'common'){
                    var grouptmp = group[1].split('/');
                    v = tpmnamespace + ":static/" + tpmnamespace + '/ui/' +  group[1] + '/' + grouptmp[grouptmp.length-1] + '.js';
                }else if (tpmnamespace == 'tangram' || tpmnamespace == 'magic') {
                    var grouptmp = group[1].split('/');
                    v = 'common:static/common/lib/' + tpmnamespace + '/' + group[1] + '/' + grouptmp[grouptmp.length-1] + '.js';
                }    
            };   
        }
        return v;
    }

    //对require添加namespace,注意私有处理
    function parseRequire(content, namespace) {
        var reg = /\brequire\s*\(\s*("(?:[^\\"]|\\[\s\S])+"|'(?:[^\\']|\\[\s\S])+')\s*\)/g;
        content = content.replace(reg, function(m, value){
            if(value){
                var info = fis.util.stringQuote(value);
                value = info.rest.trim();
                value = getPathId(value, namespace);
                m = 'require(' + info.quote + value + info.quote + ')';
            }
            return m;
        });
        return content;
    }

    /**
     * F.use -> require
     **/
    function parseUse(content, namespace) {
        var reg = /(?:\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\/)|(?:\/\/[^\n\r\f]*)|F.use\s*\(\s*("(?:[^\\"]|\\[\s\S])+"|'(?:[^\\']|\\[\s\S])+'|(?:\[[^\[\]]+?\]))\s*/g;
        return content.replace(reg, function (m , value) {
            if (value) {
                var hasBrackets = false;
                var values = [];
                value = value.trim().replace(/(^\[|\]$)/g, function(m, v) {
                    if (v) {
                        hasBrackets = true;
                    }
                    return '';
                });
                values = value.split(/\s*,\s*/);
                values = values.map(function(v) {
                    var info = fis.util.stringQuote(v);
                    v = info.rest.trim();
                    v = getPathId(v, namespace);
                    return info.quote + v + info.quote;
                });
                if (hasBrackets) {
                    m = 'require.async([' + values.join(', ') + ']';
                } else {
                    m = 'require.async(' + values.join(', ');
                }
            }
            return m;
        });
        return content;
    }

    function parseTemplate(content){
        var reg = /\bF.template/g;
        content = content.replace(reg, function (m , value) {
            return '__inline'
        });
        return content;
    }

    function parseUri(content) {
        var reg = /\bF.uri/g;
        content = content.replace(reg, function(m, value){
            return '__uri';
        });
        return content;
    }

    content = parseRequire(content, namespace);
    content = parseUse(content, namespace);
    content = parseUri(content);
    content = parseTemplate(content);
    return content;
}

