/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

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
        if ( v.indexOf(':') == -1 && v.indexOf('.') != 0) {
            v = namespace + ':' + v;
        }
        return v;
    }

    //对require添加namespace,注意私有处理
    function parseRequire(content, namespace) {
        var reg = /(?:\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\/)|(?:\/\/[^\n\r\f]*)|\brequire\s*\(\s*("(?:[^\\"]|\\[\s\S])+"|'(?:[^\\']|\\[\s\S])+')\s*\)/g;
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
        var reg = /(?:\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\/)|(?:\/\/[^\n\r\f]*)|\bF.template/g;
        content = content.replace(reg, function (m , value) {
            return '__inline'
        });
        return content;
    }

    function parseUri(content) {
        var reg = /(?:\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\/)|(?:\/\/[^\n\r\f]*)|\bF.uri/g;
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